import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { isTranscriptionConfigured, transcribeVideo } from '@/lib/video/transcription-provider';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServerClient();

  const { data: video, error: fetchError } = await supabase
    .from('videos')
    .select('business_id, file_url, source_type')
    .eq('id', id)
    .single();

  if (fetchError || !video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from('business_users')
    .select('role')
    .eq('business_id', (video as any).business_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Never pretend a transcript was generated when no provider is
  // configured — report the honest state instead of a fake success.
  if (!isTranscriptionConfigured()) {
    return NextResponse.json(
      {
        error: 'No transcription provider is configured on this deployment',
        hint: 'ASSEMBLYAI_API_KEY or DEEPGRAM_API_KEY is not set. This video is uploaded and ready — transcription and clip suggestions will work once a provider is connected.',
      },
      { status: 503 }
    );
  }

  if (!(video as any).file_url) {
    return NextResponse.json({ error: 'This video has no file to transcribe' }, { status: 400 });
  }

  try {
    await supabase.from('videos').update({ transcript_status: 'processing' }).eq('id', id);

    const result = await transcribeVideo((video as any).file_url);

    const { data: updated, error: updateError } = await (supabase as any)
      .from('videos')
      .update({ transcription: result.text, transcript_status: 'completed', metadata: { transcriptSegments: result.segments } })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transcription failed';
    await supabase.from('videos').update({ transcript_status: 'failed' }).eq('id', id);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
