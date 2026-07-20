import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

const PLATFORMS = ['meta', 'google', 'linkedin', 'tiktok'];
const OBJECTIVES = ['awareness', 'traffic', 'leads', 'conversions', 'engagement'];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessId = request.nextUrl.searchParams.get('businessId');
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    const supabase = await createServerClient();

    const { data: membership } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error('Error listing ad campaigns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessId, name, platform, objective, budgetAmount, budgetType, currency, startDate, endDate, targeting, adCopy } = body;

    if (!businessId || !name || !platform) {
      return NextResponse.json({ error: 'Business ID, name, and platform are required' }, { status: 400 });
    }
    if (!PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }
    if (objective && !OBJECTIVES.includes(objective)) {
      return NextResponse.json({ error: 'Invalid objective' }, { status: 400 });
    }

    const supabase = await createServerClient();

    const { data: membership } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data, error } = await (supabase as any)
      .from('ad_campaigns')
      .insert({
        business_id: businessId,
        name,
        platform,
        objective: objective || 'traffic',
        budget_amount: budgetAmount ?? null,
        budget_type: budgetType || 'daily',
        currency: currency || 'NGN',
        start_date: startDate || null,
        end_date: endDate || null,
        targeting: targeting || {},
        ad_copy: adCopy || {},
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error creating ad campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
