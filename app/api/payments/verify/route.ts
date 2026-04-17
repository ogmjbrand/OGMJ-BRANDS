import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reference, amount, planId, businessId } = await request.json();

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
      `https://api.paystack.co/transaction/verify/${reference}`,
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

    const supabase = await createServerClient();

    // Create subscription
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

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(
      endDate.getMonth() + ((planData as any).billing_period === 'yearly' ? 12 : 1)
    );

    // Create subscription record
    const { data: subscription, error: subError } = await (supabase as any)
      .from('subscriptions')
      .insert({
        business_id: businessId,
        plan_id: planId,
        status: 'active',
        amount: amount / 100, // Convert from kobo
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
      amount: amount / 100,
      currency: verifyData.data.currency,
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
