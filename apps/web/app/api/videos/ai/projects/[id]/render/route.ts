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

  // The UI only disables "Generate video" client-side while status is
  // 'rendering' -- nothing server-side stopped a second call (a second
  // tab, a fast double-click before React re-renders, or a direct API
  // call) from resubmitting every scene while the first submission is
  // still in flight. That second call would generate a brand-new
  // render_webhook_token and unconditionally overwrite the one the
  // first submission's scenes are already using, so when fal.ai later
  // delivers the first submission's real webhook with the now-stale
  // token, complete_video_scene_render rejects it as invalid -- silently
  // losing that render forever, on top of paying fal.ai twice for the
  // same scenes.
  if ((project as any).status === 'rendering') {
    return NextResponse.json(
      { error: 'This project is already rendering. Wait for it to finish before submitting again.' },
      { status: 409 }
    );
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

  // Claim 'rendering' atomically BEFORE paying for any fal.ai submission,
  // not just before the final write. Two render calls can both pass the
  // status check above before either writes; without this, the loser
  // would still have already submitted (and paid for) every scene to
  // fal.ai only to have its DB write rejected. Requiring updated_at to
  // still match means only one request can win the claim -- the other
  // gets a clean 409 and never calls fal.ai at all.
  const { error: claimError } = await (supabase as any)
    .from('ai_video_projects')
    .update({ status: 'rendering', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('updated_at', (project as any).updated_at)
    .select()
    .single();

  if (claimError) {
    if (claimError.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'This project changed right before rendering could start. Reload and try again.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: claimError.message }, { status: 400 });
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

  // This project now exclusively owns the 'rendering' claim from above,
  // so no further CAS is needed on this write -- nothing else can have
  // changed updated_at in between (the webhook can't fire before fal.ai
  // has even returned a request id, and the UI can't submit again while
  // status is 'rendering').
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
