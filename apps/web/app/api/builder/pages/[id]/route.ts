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

    // Get page with business access verification (web_pages is the
    // canonical page table; sections live in content, meta in seo)
    const { data: page, error } = await supabase
      .from('web_pages')
      .select(`
        id,
        website_id,
        business_id,
        title,
        slug,
        type,
        content,
        seo,
        settings,
        status,
        version,
        published_at,
        created_at,
        updated_at
      `)
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

    return createSuccessResponse(page);
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
    const supabase = await createServerClient();

    // Get current page to verify access AND, if the caller opted into
    // conflict detection, to know the version it's about to compare-and-swap
    // against.
    const { data: currentPage } = await supabase
      .from('web_pages')
      .select('business_id, version')
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

    // Update page — whitelist canonical columns so unknown keys from the
    // client cannot 400 the whole request. `version` itself is never in
    // this list, so a client can never set it directly -- only the
    // increment below ever changes it.
    const allowed = [
      'title', 'slug', 'type', 'content', 'seo', 'settings', 'status',
      'parent_id', 'published_at',
    ];
    const updateData: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }
    updateData.updated_at = new Date().toISOString();

    // STALE-WRITE / CONFLICT DETECTION (opt-in, backward compatible): a
    // caller that loaded the page and tracked its `version` can pass
    // `expectedVersion` to get a real compare-and-swap -- the UPDATE only
    // takes effect if the row's version still matches what the caller last
    // saw, closing the "two editors open the same page, second save
    // silently clobbers the first" gap this route previously had no
    // protection against at all. A caller that doesn't pass it (any
    // existing integration -- the publish route, scripts, etc.) keeps the
    // exact prior unconditional-overwrite behavior; nothing is a breaking
    // change for them.
    const expectedVersion = typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined;
    const currentVersion = typeof (currentPage as any).version === 'number' ? (currentPage as any).version : 0;
    updateData.version = currentVersion + 1;

    let query = supabase.from('web_pages').update(updateData as any).eq('id', pageId);
    if (expectedVersion !== undefined) {
      query = query.eq('version', expectedVersion);
    }
    const { data: page, error } = await query.select().single();

    if (error || !page) {
      if (expectedVersion !== undefined) {
        // The CAS condition (`version = expectedVersion`) matched zero rows
        // -- the row exists (confirmed above) but its version has moved on,
        // meaning someone else saved in between. Report this as a real
        // conflict rather than either a generic 500 or a silent no-op.
        return createErrorResponse(
          'This page was changed by someone else since you loaded it. Reload the latest version before saving again.',
          409
        );
      }
      return createErrorResponse('Failed to update page', 500);
    }

    return createSuccessResponse(page);
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

    const { id: pageId } = await params;
    const supabase = await createServerClient();

    // Get current page to verify access
    const { data: currentPage } = await supabase
      .from('web_pages')
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

    // Delete page
    const { error } = await supabase
      .from('web_pages')
      .delete()
      .eq('id', pageId);

    if (error) {
      return createErrorResponse('Failed to delete page', 500);
    }

    return createSuccessResponse({ message: 'Page deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}