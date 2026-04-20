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

    // Get websites for the business
    const { data: websites, error } = await supabase
      .from('websites')
      .select(`
        id,
        name,
        slug,
        description,
        domain,
        custom_domain,
        status,
        template_id,
        published_at,
        created_at,
        updated_at
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      return createErrorResponse('Failed to fetch websites', 500);
    }

    return createSuccessResponse({
      websites: websites || [],
      total: websites?.length || 0,
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
    const { businessId, name, slug, description, templateId } = body;

    if (!businessId || !name || !slug) {
      return createErrorResponse('Business ID, name, and slug are required', 400);
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

    // Check if slug is unique for this business
    const { data: existingWebsite } = await supabase
      .from('websites')
      .select('id')
      .eq('business_id', businessId)
      .eq('slug', slug)
      .single();

    if (existingWebsite) {
      return createErrorResponse('Website slug already exists', 409);
    }

    // Create website
    const { data: website, error } = await supabase
      .from('websites')
      .insert({
        business_id: businessId,
        name,
        slug,
        description,
        template_id: templateId,
        created_by: user.id,
      } as any)
      .select()
      .single();

    if (error) {
      return createErrorResponse('Failed to create website', 500);
    }

    return createSuccessResponse(website, 201);
  } catch (error) {
    return handleApiError(error);
  }
}