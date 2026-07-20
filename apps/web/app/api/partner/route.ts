import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

function getAppUrl(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '');
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    const { data: program } = await supabase
      .from('referral_programs')
      .select('id, name, description, commission_type, commission_value, cookie_days, min_payout, payout_currency')
      .eq('is_active', true)
      .maybeSingle();

    if (!program) {
      return NextResponse.json({ success: true, data: { enrolled: false, program: null } }, { status: 200 });
    }

    const { data: referral } = await supabase
      .from('referrals')
      .select('id, code, link, clicks, signups, conversions, total_earned, status, created_at')
      .eq('program_id', (program as any).id)
      .eq('referrer_id', user.id)
      .maybeSingle();

    let commissions: any[] = [];
    let payouts: any[] = [];
    let availableBalance = 0;

    if (referral) {
      const [commissionsResult, payoutsResult] = await Promise.all([
        supabase
          .from('referral_commissions')
          .select('id, amount, currency, status, approved_at, paid_at, created_at')
          .eq('referral_id', (referral as any).id)
          .order('created_at', { ascending: false }),
        supabase
          .from('payout_requests')
          .select('id, amount, currency, status, created_at, processed_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      commissions = commissionsResult.data ?? [];
      payouts = payoutsResult.data ?? [];

      const reserved = payouts
        .filter((p: any) => ['pending', 'processing', 'paid'].includes(p.status))
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      availableBalance = Math.max(0, Number((referral as any).total_earned || 0) - reserved);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          enrolled: !!referral,
          program,
          referral: referral
            ? { ...(referral as any), link: `${getAppUrl(request)}/r/${(referral as any).code}` }
            : null,
          commissions,
          payouts,
          availableBalance,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching partner status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
