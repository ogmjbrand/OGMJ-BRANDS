import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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

      // Update subscription if exists
      if (metadata?.subscriptionId) {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        await (supabase as any)
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_end: endDate.toISOString(),
          })
          .eq('id', metadata.subscriptionId);
      }

      // Create transaction record
      await (supabase as any).from('transactions').insert({
        business_id: metadata?.businessId,
        subscription_id: metadata?.subscriptionId,
        type: 'subscription_charge',
        amount: amount / 100,
        currency: event.data.currency,
        status: 'completed',
        payment_provider: 'paystack',
        provider_reference: reference,
      });

      // TODO: Send confirmation email
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
