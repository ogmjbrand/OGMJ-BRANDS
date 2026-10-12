import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
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

    // file_url only holds a storage object path (not an external URL)
    // when source_type is 'upload' — only remove storage in that case, so
    // a video linked to an outside URL doesn't trigger a pointless (and
    // potentially wrong) storage delete.
    const { data: existingVideo } = await supabase
      .from('videos')
      .select('file_url, source_type')
      .eq('id', videoId)
      .single();

    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      throw new ApiError('Failed to delete video', 500);
    }

    if ((existingVideo as any)?.source_type === 'upload' && (existingVideo as any)?.file_url) {
      const { error: storageError } = await supabase.storage
        .from('videos')
        .remove([(existingVideo as any).file_url]);
      if (storageError) {
        console.error('Failed to remove storage object for deleted video:', storageError);
      }
    }

    return createSuccessResponse({ success: true }, 'Video deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}