import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!businessId) {
      return createErrorResponse('Business ID required', 400);
    }

    const supabase = await createServerClient();

    // Verify business access
    const { data: accessCheck } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!accessCheck) {
      return createErrorResponse('Access denied', 403);
    }

    let query = supabase
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
      `, { count: 'exact' })
      .eq('business_id', businessId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: videos, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return createErrorResponse('Failed to fetch videos', 500);
    }

    return createSuccessResponse({
      videos: videos || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { businessId, title, description, sourceUrl, sourceType, fileUrl, thumbnailUrl, durationSeconds, fileSizeBytes } = body;

    if (!businessId || !title) {
      return createErrorResponse('Business ID and title are required', 400);
    }

    const supabase = await createServerClient();

    // Verify business access
    const { data: accessCheck } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!accessCheck) {
      return createErrorResponse('Access denied', 403);
    }

    // Create video
    const { data: video, error } = await supabase
      .from('videos')
      .insert({
        business_id: businessId,
        title,
        description,
        source_url: sourceUrl,
        source_type: sourceType,
        file_url: fileUrl,
        thumbnail_url: thumbnailUrl,
        duration_seconds: durationSeconds,
        file_size_bytes: fileSizeBytes,
        status: 'processing',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return createErrorResponse('Failed to create video', 500);
    }

    return createSuccessResponse(video, undefined, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}