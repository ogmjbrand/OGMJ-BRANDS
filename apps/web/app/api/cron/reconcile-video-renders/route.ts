import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isVideoRenderConfigured } from '@/lib/video/render-provider';
import { reconcileProjectScenes, timeoutStalePendingScenes, computeAggregateStatus } from '@/lib/video/reconcile-render';

/**
 * Server-side fallback for AI video renders stuck at status='rendering'.
 *
 * The webhook is the primary path for recording a finished fal.ai
 * render; a browser-side poll (ScriptWorkspace.tsx) is a secondary
 * fallback for a dropped webhook delivery -- but that poll only runs
 * while the specific project is open in a mounted tab, capped at ~5
 * minutes. Closing the tab, switching projects, or a render that
 * simply takes longer than 5 minutes permanently stops it, with
 * nothing else in the app ever checking fal.ai again. This route is
 * meant to be hit on a schedule (see vercel.json) so every stuck
 * project gets reconciled regardless of what's open in anyone's
 * browser, and so a render can't stay 'rendering' forever even if
 * fal.ai itself never resolves the job.
 *
 * Authenticated by a shared secret (CRON_SECRET), not a user session --
 * this runs with no browser involved. Uses the service-role Supabase
 * client because it must read/update ai_video_projects across every
 * business, not just one caller's own; RLS on that table is scoped to
 * authenticated business members only; nothing here does anything a
 * business's own members couldn't already trigger themselves via the
 * per-project status route.
 */

const RENDER_TIMEOUT_MINUTES = 45;

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false; // fail closed if not configured, never fall back to "allow"
  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isVideoRenderConfigured()) {
    return NextResponse.json({ success: true, scanned: 0, reconciled: 0, timedOut: 0 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Service-role Supabase client is not configured on this deployment' },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: projects, error } = await supabase
    .from('ai_video_projects')
    .select('id, script, output_video_url, updated_at')
    .eq('status', 'rendering');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let reconciledCount = 0;
  let timedOutCount = 0;
  const failures: Array<{ id: string; error: string }> = [];

  for (const project of projects ?? []) {
    const projectId = (project as any).id as string;
    try {
      const scenes = ((project as any).script?.scenes || []) as Array<Record<string, any>>;
      const ageMinutes = (Date.now() - new Date((project as any).updated_at).getTime()) / 60000;

      // Always ask fal.ai for the real status first -- never force a
      // timeout on a scene fal.ai would have reported as completed.
      let outcome = await reconcileProjectScenes(scenes, (project as any).output_video_url ?? null);
      let isTimeout = false;

      if (outcome.newStatus === 'rendering' && ageMinutes >= RENDER_TIMEOUT_MINUTES) {
        const timeoutResult = timeoutStalePendingScenes(outcome.updatedScenes);
        if (timeoutResult.timedOut) {
          isTimeout = true;
          outcome = {
            changed: true,
            updatedScenes: timeoutResult.scenes,
            newStatus: computeAggregateStatus(timeoutResult.scenes),
            outputVideoUrl: outcome.outputVideoUrl,
          };
        }
      }

      if (!outcome.changed) continue;

      const { error: updateError } = await (supabase as any)
        .from('ai_video_projects')
        .update({
          status: outcome.newStatus,
          output_video_url: outcome.outputVideoUrl,
          script: { ...(project as any).script, scenes: outcome.updatedScenes },
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (updateError) {
        failures.push({ id: projectId, error: updateError.message });
        continue;
      }

      reconciledCount += 1;
      if (isTimeout) timedOutCount += 1;
    } catch (err) {
      failures.push({ id: projectId, error: err instanceof Error ? err.message : 'unknown error' });
    }
  }

  return NextResponse.json({
    success: true,
    scanned: projects?.length ?? 0,
    reconciled: reconciledCount,
    timedOut: timedOutCount,
    failures,
  });
}
