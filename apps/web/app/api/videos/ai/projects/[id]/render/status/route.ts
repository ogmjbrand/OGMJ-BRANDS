import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { getSceneRenderStatus, isVideoRenderConfigured } from '@/lib/video/render-provider';

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
  const pendingIndices = scenes
    .map((scene, index) => ({ scene, index }))
    .filter(({ scene }) => scene.renderStatus === 'pending' && scene.renderRequestId);

  if (pendingIndices.length === 0) {
    return NextResponse.json({ success: true, data: project });
  }

  const results = await Promise.allSettled(
    pendingIndices.map(({ scene }) => getSceneRenderStatus(scene.renderRequestId))
  );

  let changed = false;
  const updatedScenes = [...scenes];
  pendingIndices.forEach(({ index }, i) => {
    const result = results[i];
    if (result.status !== 'fulfilled') return;
    const { status, videoUrl, error } = result.value;
    if (status === 'COMPLETED' && videoUrl) {
      updatedScenes[index] = { ...updatedScenes[index], renderStatus: 'completed', videoUrl, renderError: undefined };
      changed = true;
    } else if (status === 'FAILED') {
      updatedScenes[index] = { ...updatedScenes[index], renderStatus: 'failed', renderError: error || 'Render failed' };
      changed = true;
    }
    // IN_QUEUE / IN_PROGRESS / UNKNOWN — leave as pending, nothing to update yet.
  });

  if (!changed) {
    return NextResponse.json({ success: true, data: project });
  }

  const allDone = updatedScenes.every((s) => s.renderStatus === 'completed' || s.renderStatus === 'failed');
  const anyCompleted = updatedScenes.some((s) => s.renderStatus === 'completed');
  const newStatus = allDone ? (anyCompleted ? 'completed' : 'failed') : 'rendering';

  const { data: updated, error: updateError } = await (supabase as any)
    .from('ai_video_projects')
    .update({
      status: newStatus,
      output_video_url: newStatus === 'completed' ? updatedScenes.find((s) => s.videoUrl)?.videoUrl ?? null : (project as any).output_video_url,
      script: { ...(project as any).script, scenes: updatedScenes },
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
