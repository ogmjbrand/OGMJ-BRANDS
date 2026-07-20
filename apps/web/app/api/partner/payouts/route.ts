import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('payout_requests')
      .select('id, amount, currency, status, bank_name, account_number, account_name, created_at, processed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error('Error listing payout requests:', error);
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
    const { amount, bankName, accountNumber, accountName } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'A positive payout amount is required' }, { status: 400 });
    }
    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json({ error: 'Bank name, account number, and account name are required' }, { status: 400 });
    }

    const supabase = await createServerClient();

    const { data: program } = await supabase
      .from('referral_programs')
      .select('id, min_payout, payout_currency')
      .eq('is_active', true)
      .maybeSingle();

    if (!program) {
      return NextResponse.json({ error: 'No active partner program' }, { status: 400 });
    }

    if (amount < Number((program as any).min_payout || 0)) {
      return NextResponse.json(
        { error: `Minimum payout amount is ${(program as any).min_payout} ${(program as any).payout_currency}` },
        { status: 400 }
      );
    }

    const { data: referral } = await supabase
      .from('referrals')
      .select('total_earned')
      .eq('program_id', (program as any).id)
      .eq('referrer_id', user.id)
      .maybeSingle();

    if (!referral) {
      return NextResponse.json({ error: 'You are not enrolled in the partner program' }, { status: 400 });
    }

    const { data: existingPayouts } = await supabase
      .from('payout_requests')
      .select('amount, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing', 'paid']);

    const reserved = (existingPayouts ?? []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const availableBalance = Number((referral as any).total_earned || 0) - reserved;

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: `Requested amount exceeds your available balance of ${availableBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    const { data, error } = await (supabase as any)
      .from('payout_requests')
      .insert({
        user_id: user.id,
        amount,
        currency: (program as any).payout_currency,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data, message: 'Payout requested' }, { status: 201 });
  } catch (error) {
    console.error('Error requesting payout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
