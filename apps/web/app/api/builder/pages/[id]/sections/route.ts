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

    const { id: pageId } = await params;
    const supabase = await createServerClient();

    // Sections live inside web_pages.content (jsonb)
    const { data: page, error } = await supabase
      .from('web_pages')
      .select('business_id, content')
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

    const sections = ((page as any).content?.sections as any[]) || [];
    return createSuccessResponse({
      sections,
      total: sections.length,
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

    // Get current page to verify access (content holds the sections)
    const { data: currentPage } = await supabase
      .from('web_pages')
      .select('business_id, content')
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

    // Merge sections into the content jsonb, preserving other keys
    const content = {
      ...(((currentPage as any).content as Record<string, unknown>) || {}),
      sections,
    };

    const { data: page, error } = await supabase
      .from('web_pages')
      .update({
        content,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', pageId)
      .select('id, content, updated_at')
      .single();

    if (error) {
      return createErrorResponse('Failed to update page sections', 500);
    }

    return createSuccessResponse({
      id: (page as any).id,
      sections: ((page as any).content?.sections as any[]) || [],
      updated_at: (page as any).updated_at,
    });
  } catch (error) {
    return handleApiError(error);
  }
}