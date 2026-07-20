import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference required' },
        { status: 400 }
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: 'Paystack configuration missing' },
        { status: 500 }
      );
    }

    // Verify transaction with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok || !verifyData.data || verifyData.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Trust only what our server wrote into the Paystack metadata during
    // initialize — never client-supplied businessId/planId/amount.
    const paidKobo = Number(verifyData.data.amount);
    const paidCurrency = verifyData.data.currency;
    const businessId = verifyData.data.metadata?.businessId;
    const planId = verifyData.data.metadata?.planId;

    if (!businessId || !planId) {
      return NextResponse.json(
        { error: 'Transaction metadata is missing plan details' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // The caller must be an owner/admin of the business the payment is for
    const { data: membership } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership || !['owner', 'admin'].includes((membership as any).role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!planData) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // The verified paid amount must cover the plan price
    const expectedKobo = Math.round(Number((planData as any).price_ngn) * 100);
    if (paidCurrency !== 'NGN' || !Number.isFinite(paidKobo) || paidKobo < expectedKobo) {
      return NextResponse.json(
        { error: 'Paid amount does not match the plan price' },
        { status: 400 }
      );
    }

    // Reject duplicate verifications for the same Paystack reference
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('reference_id', reference)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'This payment has already been processed' },
        { status: 409 }
      );
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(
      endDate.getMonth() + ((planData as any).billing_period === 'yearly' ? 12 : 1)
    );

    // Create subscription record (provider is NOT NULL in the canonical schema)
    const { data: subscription, error: subError } = await (supabase as any)
      .from('subscriptions')
      .insert({
        business_id: businessId,
        plan_id: planId,
        status: 'active',
        provider: 'paystack',
        amount: paidKobo / 100,
        currency: paidCurrency,
        billing_period: (planData as any).billing_period,
        current_period_start: now.toISOString(),
        current_period_end: endDate.toISOString(),
        payment_method: 'paystack',
        reference_id: reference,
      })
      .select()
      .single();

    if (subError) {
      return NextResponse.json(
        { error: subError.message },
        { status: 400 }
      );
    }

    // Create transaction record
    await (supabase as any).from('transactions').insert({
      business_id: businessId,
      subscription_id: subscription.id,
      type: 'subscription_charge',
      amount: paidKobo / 100,
      currency: paidCurrency,
      status: 'completed',
      payment_provider: 'paystack',
      provider_reference: reference,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          subscription,
          verified: true,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
