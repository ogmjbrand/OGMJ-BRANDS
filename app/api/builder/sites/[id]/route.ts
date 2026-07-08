import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { id: websiteId } = await params;
    const supabase = await createServerClient();

    // Get website with business access verification
    const { data: website, error } = await supabase
      .from('websites')
      .select(`
        id,
        business_id,
        name,
        description,
        ssl_certificate,
        status,
        template_id,
        seo_title,
        seo_description,
        analytics_id,
        favicon_url,
        metadata,
        settings,
        published_at,
        created_at,
        updated_at,
        owner_id
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
      .eq('business_id', (website as any).business_id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { id: websiteId } = await params;
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
      .eq('business_id', (currentWebsite as any).business_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!accessCheck) {
      return createErrorResponse('Access denied', 403);
    }

    // Update website — whitelist canonical columns so unknown keys from the
    // client cannot 400 the whole request
    const allowed = [
      'name', 'description', 'status', 'template_id', 'seo_title',
      'seo_description', 'analytics_id', 'favicon_url', 'metadata',
      'settings', 'seo', 'published_at',
    ];
    const updateData: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }
    updateData.updated_at = new Date().toISOString();

    const { data: website, error } = await supabase
      .from('websites')
      .update(updateData as any)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { id: websiteId } = await params;
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
      .eq('business_id', (currentWebsite as any).business_id)
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