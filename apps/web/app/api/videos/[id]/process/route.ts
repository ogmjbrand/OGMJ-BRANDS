import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { NextRequest } from 'next/server';
import { ApiError, createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';
import {
  assertCanStartProcessing,
  VideoProcessingStateError,
  VIDEO_PROCESSING_TIMEOUT_MS,
  withTimeout,
} from '@/lib/video/processing';

async function verifyVideoAccess(supabase: any, userId: string, videoId: string) {
  const { data: video, error } = await supabase
    .from('videos')
    .select('business_id, status, file_url, source_url, source_type, metadata')
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

/**
 * There is no external transcoding/render provider wired up for Video
 * Library uploads — that pipeline only exists for the separate AI Video
 * Generator (fal.ai, a different table). "Processing" a library video
 * means confirming the asset it points to is still actually reachable:
 * the storage object for an upload, or the external URL for a linked
 * video. This is the one thing the old stub never did, which is exactly
 * why no video could ever leave "processing".
 */
async function verifyVideoAssetReachable(
  supabase: any,
  video: { file_url?: string | null; source_url?: string | null; source_type?: string | null }
): Promise<void> {
  if (video.source_type === 'upload' && video.file_url) {
    const { error } = await supabase.storage.from('videos').createSignedUrl(video.file_url, 60);
    if (error) {
      throw new Error(`Uploaded file is not reachable in storage: ${error.message}`);
    }
    return;
  }

  const url = video.source_url || video.file_url;
  if (!url) {
    throw new Error('Video has no source file or URL to verify');
  }

  if (/^https?:\/\//i.test(url)) {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(`Source URL responded with ${response.status}`);
    }
  }
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

    try {
      assertCanStartProcessing(video.status);
    } catch (stateError) {
      if (stateError instanceof VideoProcessingStateError) {
        return createErrorResponse(stateError.message, 400);
      }
      throw stateError;
    }

    const { error: markProcessingError } = await supabase
      .from('videos')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', videoId);

    if (markProcessingError) {
      throw new ApiError('Failed to start video processing', 500);
    }

    try {
      await withTimeout(
        verifyVideoAssetReachable(supabase, video),
        VIDEO_PROCESSING_TIMEOUT_MS,
        'Timed out verifying the video asset — storage or the source URL did not respond in time'
      );
    } catch (processingError) {
      // Never mark a failed job as successful — record exactly why it
      // failed and leave it in a state the user can retry from.
      const message = processingError instanceof Error ? processingError.message : 'Video processing failed';

      await supabase
        .from('videos')
        .update({
          status: 'failed',
          metadata: { ...(video.metadata || {}), processingError: message, processingFailedAt: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        })
        .eq('id', videoId);

      return createErrorResponse(`Video processing failed: ${message}`, 502);
    }

    const { data: processedVideo, error: markProcessedError } = await supabase
      .from('videos')
      .update({ status: 'processed', updated_at: new Date().toISOString() })
      .eq('id', videoId)
      .select()
      .single();

    if (markProcessedError) {
      throw new ApiError('Failed to finalize video processing', 500);
    }

    return createSuccessResponse({
      video: processedVideo,
      message: 'Video is ready',
    }, 'Video processing completed');
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
      isQueued: video.status === 'uploaded',
      isProcessing: video.status === 'processing',
      isProcessed: video.status === 'processed',
      isFailed: video.status === 'failed',
      error: video.status === 'failed' ? video.metadata?.processingError ?? null : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
