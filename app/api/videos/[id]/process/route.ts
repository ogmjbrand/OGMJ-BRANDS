import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { ApiError, createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';

async function verifyVideoAccess(supabase: any, userId: string, videoId: string) {
  const { data: video, error } = await supabase
    .from('videos')
    .select('business_id, status')
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

    // Update status to processing
    const { data: updatedVideo, error: updateError } = await supabase
      .from('videos')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoId)
      .select()
      .single();

    if (updateError) {
      throw new ApiError('Failed to start video processing', 500);
    }

    // TODO: Trigger actual video processing (e.g., call external service, queue job, etc.)
    // For now, we'll simulate processing completion
    // In a real implementation, this would be handled by a background job or webhook

    return createSuccessResponse({
      video: updatedVideo,
      message: 'Video processing started',
      estimatedDuration: 'Processing time varies based on video length and complexity',
    }, 'Video processing initiated successfully');
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