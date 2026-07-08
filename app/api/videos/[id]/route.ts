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

  return video;
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

    await verifyVideoAccess(supabase, user.id, videoId);

    const { data: video, error } = await supabase
      .from('videos')
      .select(`
        id,
        title,
        description,
        source_url,
        source_type,
        file_url,
        thumbnail_url,
        duration_seconds,
        file_size_bytes,
        status,
        transcription,
        transcript_status,
        metadata,
        created_at,
        updated_at
      `)
      .eq('id', videoId)
      .single();

    if (error) {
      throw new ApiError('Failed to fetch video', 500);
    }

    return createSuccessResponse(video);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
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
    const { title, description, thumbnailUrl, metadata } = body;

    const supabase = await createServerClient();
    await verifyVideoAccess(supabase, user.id, videoId);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (thumbnailUrl !== undefined) updateData.thumbnail_url = thumbnailUrl;
    if (metadata !== undefined) updateData.metadata = metadata;

    const { data: video, error } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', videoId)
      .select()
      .single();

    if (error) {
      throw new ApiError('Failed to update video', 500);
    }

    return createSuccessResponse(video, 'Video updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
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

    await verifyVideoAccess(supabase, user.id, videoId);

    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      throw new ApiError('Failed to delete video', 500);
    }

    return createSuccessResponse({ success: true }, 'Video deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}