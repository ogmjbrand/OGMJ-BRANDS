import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
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

    const { id: pageId } = await params;
    const supabase = await createServerClient();

    // Get page to verify access and get sections
    const { data: page, error } = await supabase
      .from('pages')
      .select('business_id, sections')
      .eq('id', pageId)
      .single();

    if (error || !page) {
      return createErrorResponse('Page not found', 404);
    }

    // Verify business access
    const { data: accessCheck } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', (page as any).business_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!accessCheck) {
      return createErrorResponse('Access denied', 403);
    }

    return createSuccessResponse({
      sections: (page as any).sections || [],
      total: ((page as any).sections as any[])?.length || 0,
    });
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

    const { id: pageId } = await params;
    const body = await request.json();
    const { sections } = body;

    if (!Array.isArray(sections)) {
      return createErrorResponse('Sections must be an array', 400);
    }

    const supabase = await createServerClient();

    // Get current page to verify access
    const { data: currentPage } = await supabase
      .from('pages')
      .select('business_id')
      .eq('id', pageId)
      .single();

    if (!currentPage) {
      return createErrorResponse('Page not found', 404);
    }

    // Verify business access
    const { data: accessCheck } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', (currentPage as any).business_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!accessCheck) {
      return createErrorResponse('Access denied', 403);
    }

    // Update page sections
    const { data: page, error } = await supabase
      .from('pages')
      .update({
        sections,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', pageId)
      .select('id, sections, updated_at')
      .single();

    if (error) {
      return createErrorResponse('Failed to update page sections', 500);
    }

    return createSuccessResponse(page);
  } catch (error) {
    return handleApiError(error);
  }
}