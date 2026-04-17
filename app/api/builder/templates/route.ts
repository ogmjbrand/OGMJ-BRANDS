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
    const category = searchParams.get('category');
    const isPublic = searchParams.get('public') === 'true';

    const supabase = await createServerClient();

    let query = supabase
      .from('templates')
      .select(`
        id,
        name,
        description,
        category,
        thumbnail_url,
        preview_url,
        config,
        is_public,
        business_id,
        created_at,
        updated_at
      `);

    if (businessId) {
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

      // Get both public templates and business-specific templates
      query = query.or(`is_public.eq.true,business_id.eq.${businessId}`);
    } else {
      // If no business ID, only return public templates
      query = query.eq('is_public', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: templates, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      return createErrorResponse('Failed to fetch templates', 500);
    }

    return createSuccessResponse({
      templates: templates || [],
      total: templates?.length || 0,
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
    const { businessId, name, description, category, config, thumbnailUrl, previewUrl, isPublic } = body;

    if (!businessId || !name || !config) {
      return createErrorResponse('Business ID, name, and config are required', 400);
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

    // Create template
    const { data: template, error } = await supabase
      .from('templates')
      .insert({
        business_id: businessId,
        name,
        description,
        category,
        config,
        thumbnail_url: thumbnailUrl,
        preview_url: previewUrl,
        is_public: isPublic || false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return createErrorResponse('Failed to create template', 500);
    }

    return createSuccessResponse(template, 201);
  } catch (error) {
    return handleApiError(error);
  }
}