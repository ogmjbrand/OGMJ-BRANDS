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

    // Get contact metrics
    const [{ count: totalContacts }, { count: newContacts }] = await Promise.all([
      supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId),
      supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('created_at', startDate),
    ]);

    // Get contact status distribution
    const { data: contactStatuses } = await supabase
      .from('contacts')
      .select('status')
      .eq('business_id', businessId);

    const statusDistribution = (contactStatuses as any[] | null)?.reduce((acc: Record<string, number>, contact) => {
      acc[contact.status] = (acc[contact.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get deal metrics
    const [
      { count: totalDeals },
      { count: activeDeals },
      { count: wonDeals },
      { count: lostDeals }
    ] = await Promise.all([
      supabase
        .from('contacts')
        .select('deals!inner(*)', { count: 'exact', head: true })
        .eq('business_id', businessId),
      supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'open'),
      supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'won')
        .gte('closed_at', startDate),
      supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'lost')
        .gte('closed_at', startDate),
    ]);

    // Get deal stage distribution
    const { data: dealStages } = await supabase
      .from('deals')
      .select('stage')
      .eq('business_id', businessId)
      .eq('status', 'open');

    const stageDistribution = (dealStages as any[] | null)?.reduce((acc: Record<string, number>, deal) => {
      acc[deal.stage] = (acc[deal.stage] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get average deal value
    const { data: dealValues } = await supabase
      .from('deals')
      .select('value')
      .eq('business_id', businessId)
      .eq('status', 'won')
      .gte('closed_at', startDate);

    const averageDealValue = (dealValues as any[] | null)?.length
      ? ((dealValues as any[]).reduce((sum, deal) => sum + Number(deal.value || 0), 0) / (dealValues as any[]).length)
      : 0;

    // Get conversion rate (won deals / total deals)
    const conversionRate = totalDeals ? (wonDeals || 0) / totalDeals : 0;

    // Get recent contacts and deals
    const [{ data: recentContacts }, { data: recentDeals }] = await Promise.all([
      supabase
        .from('contacts')
        .select('id, first_name, last_name, email, status, created_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('deals')
        .select('id, title, value, stage, status, created_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    return createSuccessResponse({
      crm: {
        contacts: {
          total: totalContacts || 0,
          new: newContacts || 0,
          byStatus: statusDistribution,
        },
        deals: {
          total: totalDeals || 0,
          active: activeDeals || 0,
          won: wonDeals || 0,
          lost: lostDeals || 0,
          byStage: stageDistribution,
          averageValue: averageDealValue,
          conversionRate,
        },
        recentActivity: {
          contacts: recentContacts || [],
          deals: recentDeals || [],
        },
      },
      period,
      dateRange: {
        start: startDate,
        end: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}