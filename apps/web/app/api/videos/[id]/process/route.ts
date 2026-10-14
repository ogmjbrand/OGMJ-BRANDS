import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { NextRequest } from 'next/server';
import { ApiError, createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';

async function verifyVideoAccess(supabase: any, userId: string, videoId: string) {
  const { data: video, error } = await supabase
    .from('videos')
    .select('business_id, status, file_url, source_url')
    .eq('id', videoId)
    .single();

  if (error || !video) {
    throw new ApiError('Video not found', 404);
  }

  const { data: accessCheck } = await supabase
    .from('business_users')
    .select('role')
    .eq('business_id', video.business_id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!accessCheck) {
    throw new ApiError('Access denied', 403);
  }

  return video;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { id: videoId } = await params;
    const supabase = await createServerClient();

    const video = await verifyVideoAccess(supabase, user.id, videoId);

    // Check if video is already processed or processing
    if (video.status === 'processed') {
      return createErrorResponse('Video is already processed', 400);
    }

    if (video.status === 'processing') {
      return createErrorResponse('Video is already being processed', 400);
    }

    // There is no external transcoding/processing provider wired up for
    // this pipeline (transcription and clip generation are separate,
    // independent features with their own status fields and do not
    // depend on this one). What this endpoint can honestly guarantee is
    // that the video record actually has a playable source attached --
    // previously it set status to 'processing' and never transitioned it
    // any further, leaving every video stuck in that state forever. This
    // performs the one real, synchronous check available and reaches a
    // terminal status immediately, rather than promising async work that
    // was never implemented.
    const hasSource = Boolean(video.file_url || video.source_url);

    const { data: updatedVideo, error: updateError } = await supabase
      .from('videos')
      .update({
        status: hasSource ? 'processed' : 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoId)
      .select()
      .single();

    if (updateError) {
      throw new ApiError('Failed to update video status', 500);
    }

    if (!hasSource) {
      return createErrorResponse('Video has no file or source URL to process', 400);
    }

    return createSuccessResponse(
      { video: updatedVideo },
      'Video processed successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { id: videoId } = await params;
    const supabase = await createServerClient();

    const video = await verifyVideoAccess(supabase, user.id, videoId);

    return createSuccessResponse({
      videoId,
      status: video.status,
      isProcessing: video.status === 'processing',
      isProcessed: video.status === 'processed',
      isFailed: video.status === 'failed',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
