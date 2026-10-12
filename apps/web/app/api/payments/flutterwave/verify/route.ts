import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { isFlutterwaveConfigured, verifyFlutterwaveTransaction } from '@/lib/payments/flutterwave';
import { getResendClient, isResendConfigured, RESEND_FROM_EMAIL } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isFlutterwaveConfigured()) {
      return NextResponse.json({ error: 'Flutterwave configuration missing' }, { status: 500 });
    }

    const { transactionId } = await request.json();
    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
    }

    const verified = await verifyFlutterwaveTransaction(String(transactionId));

    if (verified.error || verified.status !== 'successful') {
      return NextResponse.json({ error: verified.error || 'Payment verification failed' }, { status: 400 });
    }

    // Trust only what our server sent as meta during initialize — never
    // client-supplied businessId/planId/amount.
    const businessId = verified.meta?.businessId as string | undefined;
    const planId = verified.meta?.planId as string | undefined;

    if (!businessId || !planId) {
      return NextResponse.json({ error: 'Transaction metadata is missing plan details' }, { status: 400 });
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
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // The verified paid amount must cover the plan price (Flutterwave
    // amounts are whole-currency-unit Naira, same as price_ngn)
    const expectedAmount = Number((planData as any).price_ngn);
    if (verified.currency !== 'NGN' || !Number.isFinite(verified.amount) || verified.amount < expectedAmount) {
      return NextResponse.json({ error: 'Paid amount does not match the plan price' }, { status: 400 });
    }

    // Reject duplicate verifications for the same Flutterwave reference
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('reference_id', verified.txRef)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'This payment has already been processed' }, { status: 409 });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + ((planData as any).billing_period === 'yearly' ? 12 : 1));

    const { data: subscription, error: subError } = await (supabase as any)
      .from('subscriptions')
      .insert({
        business_id: businessId,
        plan_id: planId,
        status: 'active',
        provider: 'flutterwave',
        amount: verified.amount,
        currency: verified.currency,
        billing_period: (planData as any).billing_period,
        current_period_start: now.toISOString(),
        current_period_end: endDate.toISOString(),
        payment_method: 'flutterwave',
        reference_id: verified.txRef,
      })
      .select()
      .single();

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 400 });
    }

    await (supabase as any).from('transactions').insert({
      business_id: businessId,
      subscription_id: subscription.id,
      type: 'subscription_charge',
      amount: verified.amount,
      currency: verified.currency,
      status: 'completed',
      payment_provider: 'flutterwave',
      provider_reference: verified.txRef,
    });

    if (isResendConfigured() && verified.customerEmail) {
      try {
        const formattedAmount = verified.amount.toLocaleString('en-US', {
          style: 'currency',
          currency: verified.currency,
        });
        await getResendClient().emails.send({
          from: RESEND_FROM_EMAIL,
          to: verified.customerEmail,
          subject: 'Payment confirmed — OGMJ BRANDS',
          html: `<p>Your payment of <strong>${formattedAmount}</strong> was successful.</p><p>Reference: ${verified.txRef}</p>`,
        });
      } catch (emailError) {
        console.error('Error sending Flutterwave payment confirmation email:', emailError);
      }
    }

    return NextResponse.json(
      { success: true, data: { subscription, verified: true } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Flutterwave verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
