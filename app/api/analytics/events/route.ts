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

    const [{ data: recentEvents, error: recentError }, { data: counts, error: countError }] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('events')
        .select('event_type, count:event_type', { count: 'exact' })
        .eq('business_id', businessId)
        .group('event_type'),
    ] as any);

    if (recentError || countError) {
      throw recentError || countError;
    }

    return createSuccessResponse({
      recentEvents: recentEvents || [],
      eventTypeCounts: counts || [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
