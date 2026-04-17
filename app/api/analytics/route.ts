import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Verify user has access to this business
    const { data: userAccess } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!userAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const startDateStr = startDate.toISOString();
    const nowStr = now.toISOString();

    // Get contact metrics
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    const { count: newContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('created_at', startDateStr);

    // Get deal metrics
    const { count: totalDeals } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    const { count: activeDeals } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'open');

    const { count: wonDeals } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'won')
      .gte('closed_at', startDateStr);

    // Get revenue metrics
    const { data: revenueData } = await supabase
      .from('deals')
      .select('value, currency')
      .eq('business_id', businessId)
      .eq('status', 'won')
      .gte('closed_at', startDateStr);

    const totalRevenue = (revenueData as any)?.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0) || 0;

    // Get contact status distribution
    const { data: contactStatusData } = await supabase
      .from('contacts')
      .select('status')
      .eq('business_id', businessId);

    const contactStatusCounts = (contactStatusData as any)?.reduce((acc: Record<string, number>, contact: any) => {
      acc[contact.status] = (acc[contact.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get deal stage distribution
    const { data: dealStageData } = await supabase
      .from('deals')
      .select('stage')
      .eq('business_id', businessId)
      .eq('status', 'open');

    const dealStageCounts = (dealStageData as any)?.reduce((acc: Record<string, number>, deal: any) => {
      acc[deal.stage] = (acc[deal.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get recent activity (last 10 items)
    const { data: recentContacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: recentDeals } = await supabase
      .from('deals')
      .select('id, title, value, stage, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(5);

    const analytics = {
      overview: {
        totalContacts: totalContacts || 0,
        newContacts: newContacts || 0,
        totalDeals: totalDeals || 0,
        activeDeals: activeDeals || 0,
        wonDeals: wonDeals || 0,
        totalRevenue,
      },
      distributions: {
        contactStatus: contactStatusCounts,
        dealStages: dealStageCounts,
      },
      recentActivity: {
        contacts: recentContacts || [],
        deals: recentDeals || [],
      },
      period,
      dateRange: {
        start: startDateStr,
        end: nowStr,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: analytics,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}