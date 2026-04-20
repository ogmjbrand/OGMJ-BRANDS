import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';

export async function POST(
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

    // Get current page to verify access
    const { data: currentPage } = await supabase
      .from('pages')
      .select('business_id, status')
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

    // Update page status to published and set published_at
    const { data: page, error } = await supabase
      .from('pages')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId)
      .select()
      .single();

    if (error) {
      return createErrorResponse('Failed to publish page', 500);
    }

    return createSuccessResponse(page);
  } catch (error) {
    return handleApiError(error);
  }
}