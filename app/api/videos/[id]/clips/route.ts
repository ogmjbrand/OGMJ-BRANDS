import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { ApiError, createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';

async function verifyVideoAccess(supabase: any, userId: string, videoId: string) {
  const { data: video, error } = await supabase
    .from('videos')
    .select('business_id')
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

  return video.business_id;
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createServerClient();
    const businessId = await verifyVideoAccess(supabase, user.id, videoId);

    const { data: clips, error, count } = await supabase
      .from('video_clips')
      .select(`
        id,
        title,
        description,
        start_time_seconds,
        end_time_seconds,
        duration_seconds,
        aspect_ratio,
        file_url,
        thumbnail_url,
        has_captions,
        caption_file_url,
        highlighted_keywords,
        viral_score,
        status,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('video_id', videoId)
      .eq('business_id', businessId)
      .order('start_time_seconds', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ApiError('Failed to fetch video clips', 500);
    }

    return createSuccessResponse({
      clips: clips || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    return handleApiError(error);
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
    const body = await request.json();
    const {
      title,
      description,
      startTimeSeconds,
      endTimeSeconds,
      aspectRatio = '16:9',
      fileUrl,
      thumbnailUrl,
      hasCaptions = false,
      captionFileUrl,
      highlightedKeywords = [],
    } = body;

    if (!startTimeSeconds || !endTimeSeconds) {
      return createErrorResponse('Start time and end time are required', 400);
    }

    if (startTimeSeconds >= endTimeSeconds) {
      return createErrorResponse('Start time must be less than end time', 400);
    }

    const supabase = await createServerClient();
    const businessId = await verifyVideoAccess(supabase, user.id, videoId);

    const { data: clip, error } = await supabase
      .from('video_clips')
      .insert({
        business_id: businessId,
        video_id: videoId,
        title,
        description,
        start_time_seconds: startTimeSeconds,
        end_time_seconds: endTimeSeconds,
        aspect_ratio: aspectRatio,
        file_url: fileUrl,
        thumbnail_url: thumbnailUrl,
        has_captions: hasCaptions,
        caption_file_url: captionFileUrl,
        highlighted_keywords: highlightedKeywords,
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError('Failed to create video clip', 500);
    }

    return createSuccessResponse(clip, 'Video clip created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}