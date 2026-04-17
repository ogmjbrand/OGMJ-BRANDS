import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';

function calculateStartDate(period: string) {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case '7d':
      start.setDate(now.getDate() - 7);
      break;
    case '30d':
      start.setDate(now.getDate() - 30);
      break;
    case '90d':
      start.setDate(now.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setDate(now.getDate() - 30);
  }

  return start.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const period = searchParams.get('period') || '30d';

    if (!businessId) {
      return createErrorResponse('Business ID required', 400);
    }

    const startDate = calculateStartDate(period);
    const supabase = await createServerClient();

    const [{ count: contacts }, { count: deals }, { data: revenueData }] = await Promise.all([
      supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('created_at', startDate),
      supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('created_at', startDate),
      supabase
        .from('deals')
        .select('value')
        .eq('business_id', businessId)
        .eq('status', 'won')
        .gte('closed_at', startDate),
    ] as any);

    const totalRevenue = (revenueData as any[] | null)?.reduce((sum, deal) => sum + Number(deal.value || 0), 0) || 0;

    return createSuccessResponse({
      overview: {
        newContacts: contacts || 0,
        newDeals: deals || 0,
        totalRevenue,
      },
      period,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
