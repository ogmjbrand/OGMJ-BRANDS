import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { isVideoRenderConfigured, submitSceneRender } from '@/lib/video/render-provider';

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

  // Never pretend a video was generated when no provider is configured —
  // report the honest state instead of a fake success.
  if (!isVideoRenderConfigured()) {
    return NextResponse.json(
      {
        error: 'No video-generation provider is configured on this deployment',
        hint: 'FAL_KEY is not set. Your script is saved and ready — rendering will work once a provider is connected.',
      },
      { status: 503 }
    );
  }

  const scenes = ((project as any).script?.scenes || []) as { visualPrompt: string; durationSeconds: number }[];
  if (scenes.length === 0) {
    return NextResponse.json({ error: 'This project has no scenes to render' }, { status: 400 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '');
  const webhookToken = crypto.randomBytes(24).toString('hex');

  // Submissions are independent — one scene's submission failing must not
  // lose track of other scenes that already reached fal.ai successfully
  // (their webhook will still fire later), so this never short-circuits
  // on the first rejection the way Promise.all would.
  const results = await Promise.allSettled(
    scenes.map(async (scene, index) => {
      const webhookUrl = `${appUrl}/api/videos/ai/projects/${id}/render/webhook?token=${webhookToken}&scene=${index}`;
      const { requestId } = await submitSceneRender(scene, webhookUrl, (project as any).aspect_ratio);
      return requestId;
    })
  );

  const updatedScenes = scenes.map((scene, index) => {
    const result = results[index];
    if (result.status === 'fulfilled') {
      return { ...scene, renderStatus: 'pending', renderRequestId: result.value, videoUrl: undefined, renderError: undefined };
    }
    const message = result.reason instanceof Error ? result.reason.message : 'Failed to submit this scene';
    return { ...scene, renderStatus: 'failed', renderRequestId: undefined, videoUrl: undefined, renderError: message };
  });

  const anySubmitted = results.some((r) => r.status === 'fulfilled');
  const allFailed = results.every((r) => r.status === 'rejected');

  const { data: updated, error: updateError } = await (supabase as any)
    .from('ai_video_projects')
    .update({
      status: allFailed ? 'failed' : 'rendering',
      render_provider: 'fal',
      render_error: allFailed ? 'All scenes failed to submit for rendering' : null,
      render_webhook_token: anySubmitted ? webhookToken : null,
      script: { ...(project as any).script, scenes: updatedScenes },
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: updated }, { status: allFailed ? 502 : 200 });
}
