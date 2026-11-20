import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';
import { slugForAttempt, slugify } from '@/lib/utils/slug';

/** Postgres unique-violation code -- what `websites_slug_unique` raises on a collision. */
const POSTGRES_UNIQUE_VIOLATION = '23505';

/** Bounded retry budget for slug collisions: base, base-2, base-3, ... */
const MAX_SLUG_ATTEMPTS = 10;

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

    // Canonical websites columns (custom_domains is a separate table);
    // page count via the web_pages FK embed.
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

    // SECURITY: the slug is always derived server-side from `name`, never
    // accepted from the request body -- its uniqueness and format
    // (`websites_slug_format`/`websites_slug_unique`) are enforced by the
    // database, and a client-supplied value could otherwise be crafted to
    // collide with, or spoof the shape of, another business's website.
    // slugify() only fails to produce anything usable when the name has no
    // alphanumeric characters at all (e.g. "!!!") -- length and the exact
    // character-class/hyphen-placement rules are enforced per attempt below
    // by slugForAttempt, which truncates and re-validates the shape itself.
    const baseSlug = slugify(name);
    if (!baseSlug) {
      return createErrorResponse('Website name must contain at least one letter or number', 400);
    }

    // Retry on a slug collision (base, base-2, base-3, ...) rather than
    // checking uniqueness first and inserting second -- that check-then-insert
    // sequence has a race under concurrent creation; relying on the
    // database's own unique constraint and retrying on its rejection is race-free.
    let website: Record<string, unknown> | null = null;
    let lastError: { code?: string; message?: string } | null = null;
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const slug = slugForAttempt(baseSlug, attempt);
      const { data, error } = await supabase
        .from('websites')
        .insert({
          business_id: businessId,
          name,
          description,
          template_id: templateId,
          owner_id: user.id,
          slug,
        } as any)
        .select()
        .single();

      if (!error) {
        website = data;
        break;
      }

      lastError = error;
      if (error.code !== POSTGRES_UNIQUE_VIOLATION) break;
      // else: slug collision -- loop and try the next suffixed slug
    }

    if (!website) {
      // Never forward the raw database error (constraint names, schema
      // details) to the client -- log it server-side and return a safe,
      // generic message instead.
      console.error('Failed to create website:', {
        businessId,
        code: lastError?.code,
        message: lastError?.message,
      });
      const status = lastError?.code === POSTGRES_UNIQUE_VIOLATION ? 409 : 500;
      const message = status === 409
        ? 'A website with a very similar name already exists -- please choose a different name'
        : 'Failed to create website';
      return createErrorResponse(message, status);
    }

    return createSuccessResponse(website, undefined, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}


