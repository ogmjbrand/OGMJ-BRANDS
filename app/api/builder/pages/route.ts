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
    const websiteId = searchParams.get('websiteId');

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
      .from('pages')
      .select(`
        id,
        website_id,
        title,
        slug,
        path,
        layout_id,
        sections,
        meta_title,
        meta_description,
        og_image,
        status,
        published_at,
        created_at,
        updated_at
      `)
      .eq('business_id', businessId);

    if (websiteId) {
      query = query.eq('website_id', websiteId);
    }

    const { data: pages, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      return createErrorResponse('Failed to fetch pages', 500);
    }

    return createSuccessResponse({
      pages: pages || [],
      total: pages?.length || 0,
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
    const { businessId, websiteId, title, slug, path, sections, layoutId } = body;

    if (!businessId || !websiteId || !title || !slug) {
      return createErrorResponse('Business ID, website ID, title, and slug are required', 400);
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

    // Verify website belongs to business
    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('id', websiteId)
      .eq('business_id', businessId)
      .single();

    if (!website) {
      return createErrorResponse('Website not found or access denied', 404);
    }

    // Check if slug is unique for this website
    const { data: existingPage } = await supabase
      .from('pages')
      .select('id')
      .eq('website_id', websiteId)
      .eq('slug', slug)
      .single();

    if (existingPage) {
      return createErrorResponse('Page slug already exists for this website', 409);
    }

    // Create page
    const { data: page, error } = await supabase
      .from('pages')
      .insert({
        business_id: businessId,
        website_id: websiteId,
        title,
        slug,
        path: path || `/${slug}`,
        layout_id: layoutId,
        sections: sections || [],
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return createErrorResponse('Failed to create page', 500);
    }

    return createSuccessResponse(page, 201);
  } catch (error) {
    return handleApiError(error);
  }
}