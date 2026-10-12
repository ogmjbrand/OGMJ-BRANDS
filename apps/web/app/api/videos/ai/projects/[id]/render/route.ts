import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { isVideoRenderConfigured, renderVideoFromScenes } from '@/lib/video/render-provider';

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
        hint: 'REPLICATE_API_TOKEN is not set. Your script is saved and ready — rendering will work once a provider is connected.',
      },
      { status: 503 }
    );
  }

  const scenes = ((project as any).script?.scenes || []) as { visualPrompt: string; durationSeconds: number }[];
  if (scenes.length === 0) {
    return NextResponse.json({ error: 'This project has no scenes to render' }, { status: 400 });
  }

  try {
    await (supabase as any)
      .from('ai_video_projects')
      .update({ status: 'rendering', render_provider: 'replicate', render_error: null, updated_at: new Date().toISOString() })
      .eq('id', id);

    const result = await renderVideoFromScenes(scenes);

    const { data: updated, error: updateError } = await (supabase as any)
      .from('ai_video_projects')
      .update({ status: 'completed', output_video_url: result.videoUrl, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Render failed';
    await (supabase as any)
      .from('ai_video_projects')
      .update({ status: 'failed', render_error: message, updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
