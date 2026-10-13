import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { isVideoRenderConfigured } from '@/lib/video/render-provider';
import { reconcileProjectScenes } from '@/lib/video/reconcile-render';

/**
 * Reconciles a project's scenes directly against fal.ai's queue API.
 * The webhook route is the primary path for recording a finished render;
 * this exists for the case where a webhook never arrives (dropped
 * delivery, a deploy mid-flight) — the frontend calls this while polling
 * a 'rendering' project instead of only waiting on the webhook.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServerClient();

  const { data: project, error: fetchError } = await supabase
    .from('ai_video_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from('business_users')
    .select('role')
    .eq('business_id', (project as any).business_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (!isVideoRenderConfigured()) {
    return NextResponse.json({ success: true, data: project });
  }

  const scenes = ((project as any).script?.scenes || []) as Array<Record<string, any>>;
  const outcome = await reconcileProjectScenes(scenes, (project as any).output_video_url ?? null);

  if (!outcome.changed) {
    return NextResponse.json({ success: true, data: project });
  }

  const { data: updated, error: updateError } = await (supabase as any)
    .from('ai_video_projects')
    .update({
      status: outcome.newStatus,
      output_video_url: outcome.outputVideoUrl,
      script: { ...(project as any).script, scenes: outcome.updatedScenes },
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: updated });
}
