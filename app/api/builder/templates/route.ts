import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';

// Canonical templates table is a platform-level catalog:
// id, name, category, preview_image, schema, is_active, created_at.
// There is no per-business scoping.

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const supabase = await createServerClient();

    let query = supabase
      .from('templates')
      .select('id, name, category, preview_image, schema, is_active, created_at')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data: templates, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      return createErrorResponse('Failed to fetch templates', 500);
    }

    return createSuccessResponse({
      templates: templates || [],
      total: templates?.length || 0,
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
    const { name, category, config, thumbnailUrl } = body;

    if (!name || !config) {
      return createErrorResponse('Name and config are required', 400);
    }

    const supabase = await createServerClient();

    // Templates are platform-level; RLS restricts writes to platform admins.
    const { data: template, error } = await supabase
      .from('templates')
      .insert({
        name,
        category,
        schema: config,
        preview_image: thumbnailUrl,
        is_active: true,
      } as any)
      .select()
      .single();

    if (error) {
      return createErrorResponse('Failed to create template', 500);
    }

    return createSuccessResponse(template, undefined, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
