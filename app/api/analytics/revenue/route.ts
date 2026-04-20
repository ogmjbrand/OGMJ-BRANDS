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

function getMonthlyBreakdown(startDate: string, endDate: string, transactions: any[]) {
  const months: Record<string, number> = {};
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Initialize months
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  while (current <= end) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    months[key] = 0;
    current.setMonth(current.getMonth() + 1);
  }

  // Sum transactions by month
  transactions.forEach((transaction) => {
    const date = new Date(transaction.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (months[key] !== undefined) {
      months[key] += Number(transaction.amount || 0);
    }
  });

  return Object.entries(months).map(([month, amount]) => ({ month, amount }));
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
    const endDate = new Date().toISOString();
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

    // Get revenue from transactions (payments and subscriptions)
    const { data: transactionRevenue } = await supabase
      .from('transactions')
      .select('amount, type, created_at, currency')
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .in('type', ['payment', 'subscription'])
      .gte('created_at', startDate);

    // Get revenue from won deals
    const { data: dealRevenue } = await supabase
      .from('deals')
      .select('value, currency, closed_at')
      .eq('business_id', businessId)
      .eq('status', 'won')
      .gte('closed_at', startDate);

    // Calculate totals
    const transactionTotal = (transactionRevenue as any[] | null)?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;
    const dealTotal = (dealRevenue as any[] | null)?.reduce((sum, d) => sum + Number(d.value || 0), 0) || 0;
    const totalRevenue = transactionTotal + dealTotal;

    // Get revenue by source
    const revenueBySource = {
      transactions: transactionTotal,
      deals: dealTotal,
    };

    // Get monthly breakdown (combine both sources)
    const allRevenueTransactions = [
      ...(transactionRevenue || []).map((t: any) => ({ created_at: t.created_at, amount: t.amount })),
      ...(dealRevenue || []).map((d: any) => ({ created_at: d.closed_at, amount: d.value })),
    ];

    const monthlyBreakdown = getMonthlyBreakdown(startDate, endDate, allRevenueTransactions);

    // Get top revenue sources (deals with highest value)
    const { data: topDeals } = await supabase
      .from('deals')
      .select('id, title, value, closed_at')
      .eq('business_id', businessId)
      .eq('status', 'won')
      .gte('closed_at', startDate)
      .order('value', { ascending: false })
      .limit(5);

    return createSuccessResponse({
      revenue: {
        total: totalRevenue,
        bySource: revenueBySource,
        monthlyBreakdown,
        topDeals: topDeals || [],
      },
      period,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}