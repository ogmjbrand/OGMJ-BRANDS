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

    const [recentResult, countResult] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('events')
        .select('event_type')
        .eq('business_id', businessId),
    ] as any);

    if (recentResult.error || countResult.error) {
      throw recentResult.error || countResult.error;
    }

    // Count event types manually
    const eventCounts: Record<string, number> = {};
    (countResult.data || []).forEach((event: any) => {
      eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
    });

    const eventTypeCounts = Object.entries(eventCounts).map(([event_type, count]) => ({
      event_type,
      count,
    }));

    return createSuccessResponse({
      recentEvents: recentResult.data || [],
      eventTypeCounts,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
