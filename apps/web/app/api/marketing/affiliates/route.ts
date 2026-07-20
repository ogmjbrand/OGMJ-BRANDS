import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

function generateReferralCode(name: string): string {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${slug || 'AFF'}${suffix}`;
}

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
      .from('affiliate_partners')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error('Error listing affiliates:', error);
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
    const { businessId, name, email, commissionType, commissionValue } = body;

    if (!businessId || !name) {
      return NextResponse.json({ error: 'Business ID and name are required' }, { status: 400 });
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

    let referralCode = generateReferralCode(name);
    let attempts = 0;
    let data: any = null;
    let error: any = null;

    while (attempts < 5) {
      const result = await (supabase as any)
        .from('affiliate_partners')
        .insert({
          business_id: businessId,
          name,
          email: email || null,
          referral_code: referralCode,
          commission_type: commissionType || 'percentage',
          commission_value: commissionValue ?? 10,
          created_by: user.id,
        })
        .select()
        .single();

      data = result.data;
      error = result.error;

      if (!error || error.code !== '23505') break;
      referralCode = generateReferralCode(name);
      attempts++;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error creating affiliate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
