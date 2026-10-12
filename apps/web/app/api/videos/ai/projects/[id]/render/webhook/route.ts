import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { extractVideoUrlFromWebhookPayload } from '@/lib/video/render-provider';

/**
 * fal.ai calls this directly — no Supabase user session exists here.
 * Authenticity is verified by the token query param (generated and
 * stored when the render was submitted), checked inside the
 * complete_video_scene_render SECURITY DEFINER function, not by RLS.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get('token');
  const sceneParam = request.nextUrl.searchParams.get('scene');

  if (!token || sceneParam === null) {
    return NextResponse.json({ error: 'Missing token or scene' }, { status: 400 });
  }

  const sceneIndex = parseInt(sceneParam, 10);
  if (!Number.isInteger(sceneIndex) || sceneIndex < 0) {
    return NextResponse.json({ error: 'Invalid scene index' }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const failed = payload?.status === 'ERROR' || Boolean(payload?.error);
  const videoUrl = failed ? null : extractVideoUrlFromWebhookPayload(payload);

  if (!failed && !videoUrl) {
    // Payload shape didn't match what we expected — treat as a failure
    // rather than silently marking the scene complete with no video.
    console.error('fal.ai webhook: could not extract video URL from payload', JSON.stringify(payload).slice(0, 500));
  }

  const supabase = await createServerClient();
  const { error } = await supabase.rpc('complete_video_scene_render', {
    p_project_id: id,
    p_token: token,
    p_scene_index: sceneIndex,
    p_video_url: videoUrl,
    p_failed: failed || !videoUrl,
    p_error_message: failed ? payload?.error || 'Render failed' : !videoUrl ? 'No video URL in provider response' : null,
  });

  if (error) {
    console.error('complete_video_scene_render failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
