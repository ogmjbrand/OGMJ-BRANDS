import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getResendClient, isResendConfigured, RESEND_FROM_EMAIL } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: 'Paystack configuration missing' },
        { status: 500 }
      );
    }

    // Verify webhook signature (HMAC-SHA512)
    const hash = crypto
      .createHmac('sha512', paystackSecretKey)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const { reference, customer, amount, metadata } = event.data;

      const supabase = await createServerClient();

      // This webhook carries no Supabase user session (it's Paystack
      // calling back directly) — the HMAC signature check above is the
      // security boundary, not RLS. Rather than add a service-role key,
      // this SECURITY DEFINER RPC performs the subscription update +
      // transaction insert as one call (same pattern already used for
      // the fal.ai render webhook) and is idempotent on provider_reference,
      // since Paystack can redeliver the same webhook event.
      const { error: rpcError } = await (supabase as any).rpc('record_paystack_webhook_charge', {
        p_business_id: metadata?.businessId ?? null,
        p_subscription_id: metadata?.subscriptionId ?? null,
        p_reference: reference,
        p_amount: amount / 100,
        p_currency: event.data.currency,
      });

      if (rpcError) {
        console.error('Paystack webhook: failed to record charge', rpcError, { reference, metadata });
      }

      if (isResendConfigured() && customer?.email) {
        try {
          const formattedAmount = (amount / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: event.data.currency || 'NGN',
          });
          await getResendClient().emails.send({
            from: RESEND_FROM_EMAIL,
            to: customer.email,
            subject: 'Payment confirmed — OGMJ BRANDS',
            html: `<p>Your payment of <strong>${formattedAmount}</strong> was successful.</p><p>Reference: ${reference}</p>`,
          });
        } catch (emailError) {
          console.error('Error sending payment confirmation email:', emailError);
        }
      }
      console.log(`Payment confirmed for ${customer.email}`);
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


