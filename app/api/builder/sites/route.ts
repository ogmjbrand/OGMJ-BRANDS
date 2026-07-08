import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
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

    // Canonical websites columns (no slug/domain — custom_domains is a
    // separate table); page count via the web_pages FK embed.
    const { data: websites, error } = await supabase
      .from('websites')
      .select(`
        id,
        name,
        description,
        status,
        template_id,
        seo_title,
        seo_description,
        favicon_url,
        published_at,
        created_at,
        updated_at,
        web_pages(id)
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
    const { businessId, name, description, templateId } = body;

    if (!businessId || !name) {
      return createErrorResponse('Business ID and name are required', 400);
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

    // Create website (owner_id is NOT NULL in the canonical schema;
    // websites has no slug or created_by column)
    const { data: website, error } = await supabase
      .from('websites')
      .insert({
        business_id: businessId,
        name,
        description,
        template_id: templateId,
        owner_id: user.id,
      } as any)
      .select()
      .single();

    if (error) {
      return createErrorResponse('Failed to create website', 500);
    }

    return createSuccessResponse(website, undefined, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}


