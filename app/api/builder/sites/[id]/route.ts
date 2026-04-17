import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const websiteId = params.id;
    const supabase = await createServerClient();

    // Get website with business access verification
    const { data: website, error } = await supabase
      .from('websites')
      .select(`
        id,
        business_id,
        name,
        slug,
        description,
        domain,
        custom_domain,
        ssl_certificate,
        status,
        template_id,
        seo_title,
        seo_description,
        analytics_id,
        favicon_url,
        metadata,
        published_at,
        created_at,
        updated_at,
        created_by
      `)
      .eq('id', websiteId)
      .single();

    if (error || !website) {
      return createErrorResponse('Website not found', 404);
    }

    // Verify business access
    const { data: accessCheck } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', website.business_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!accessCheck) {
      return createErrorResponse('Access denied', 403);
    }

    return createSuccessResponse(website);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const websiteId = params.id;
    const body = await request.json();
    const supabase = await createServerClient();

    // Get current website to verify access
    const { data: currentWebsite } = await supabase
      .from('websites')
      .select('business_id')
      .eq('id', websiteId)
      .single();

    if (!currentWebsite) {
      return createErrorResponse('Website not found', 404);
    }

    // Verify business access
    const { data: accessCheck } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', currentWebsite.business_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!accessCheck) {
      return createErrorResponse('Access denied', 403);
    }

    // Update website
    const { data: website, error } = await supabase
      .from('websites')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', websiteId)
      .select()
      .single();

    if (error) {
      return createErrorResponse('Failed to update website', 500);
    }

    return createSuccessResponse(website);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const websiteId = params.id;
    const supabase = await createServerClient();

    // Get current website to verify access
    const { data: currentWebsite } = await supabase
      .from('websites')
      .select('business_id')
      .eq('id', websiteId)
      .single();

    if (!currentWebsite) {
      return createErrorResponse('Website not found', 404);
    }

    // Verify business access
    const { data: accessCheck } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', currentWebsite.business_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!accessCheck) {
      return createErrorResponse('Access denied', 403);
    }

    // Delete website
    const { error } = await supabase
      .from('websites')
      .delete()
      .eq('id', websiteId);

    if (error) {
      return createErrorResponse('Failed to delete website', 500);
    }

    return createSuccessResponse({ message: 'Website deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}