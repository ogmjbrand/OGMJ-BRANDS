import { NextRequest, NextResponse } from 'next/server';
import { getResendClient, isResendConfigured, RESEND_FROM_EMAIL } from '@/lib/email/resend';
import { verifyPaystackWebhookSignature } from '@/lib/payments/paystack';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/service-role';

/**
 * HOTFIX (production incident): the payment_rpc_authorization_fix
 * migration correctly restricted record_paystack_webhook_charge (and
 * its sibling RPCs) to service_role only, closing an anon-callable
 * authorization bypass. But this route was still calling that RPC
 * with the anon-key request client, which lost EXECUTE on the
 * migration's apply -- meaning every real Paystack webhook since then
 * silently failed to record its transaction while still returning 200,
 * so Paystack never retried. This restores the intended trusted path
 * without reopening the anon-callable bypass: the HMAC signature check
 * below is still the real authorization boundary, this client is only
 * what lets a request that's already proven legitimate reach the
 * now-restricted RPC.
 *
 * charge.failed/refund.processed recording (added for dual-provider
 * parity with Flutterwave) follows the exact same fail-closed
 * convention as charge.success below: a failed RPC write returns a
 * non-2xx so Paystack retries instead of the event being silently
 * lost, and only the reference + error code are logged, never the
 * full error object or metadata.
 */
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

    if (!verifyPaystackWebhookSignature(body, signature, paystackSecretKey)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Signature verified above -- only now do we even check whether the
    // trusted path to record it is available, so an unauthenticated
    // request never learns anything about service-role configuration
    // state before it's proven to be a legitimate, signed delivery.
    //
    // Fails closed with a non-2xx response (not a silent 200): Paystack
    // retries a non-200 response on its documented schedule (live mode:
    // every 3 minutes for the first 4 attempts, then hourly for 72
    // hours), so a misconfigured deployment gets retried deliveries
    // instead of silently losing them.
    if (!isServiceRoleConfigured()) {
      console.error('Paystack webhook: SUPABASE_SERVICE_ROLE_KEY is not configured on this deployment');
      return NextResponse.json({ error: 'Webhook processing is not configured' }, { status: 503 });
    }

    const event = JSON.parse(body);
    const supabase = createServiceRoleClient();

    if (event.event === 'charge.success') {
      const { reference, customer, amount, metadata } = event.data;

      const { error: rpcError } = await (supabase as any).rpc('record_paystack_webhook_charge', {
        p_business_id: metadata?.businessId ?? null,
        p_subscription_id: metadata?.subscriptionId ?? null,
        p_reference: reference,
        p_amount: amount / 100,
        p_currency: event.data.currency,
      });

      if (rpcError) {
        // Do not acknowledge success when the transaction wasn't
        // actually recorded -- a non-2xx here tells Paystack to retry
        // delivery on its own schedule instead of this event being
        // silently lost. Only the reference and error code are logged,
        // never the full error object, metadata, or customer details.
        console.error('Paystack webhook: failed to record charge', { reference, code: rpcError.code });
        return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
      }

      // The charge is already safely recorded at this point (idempotent
      // on provider_reference, so a retried delivery is a safe no-op).
      // A failure to send the confirmation email is best-effort and
      // must not change the response Paystack sees.
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
          console.error('Error sending payment confirmation email:', emailError instanceof Error ? emailError.message : 'unknown error');
        }
      }
    } else if (event.event === 'charge.failed') {
      // Recorded for visibility only — a failed charge never created a
      // subscription in the first place, so there's nothing to revoke.
      const { reference, amount, currency, metadata } = event.data;
      const { error: rpcError } = await (supabase as any).rpc('record_paystack_webhook_transaction_event', {
        p_business_id: metadata?.businessId ?? null,
        p_reference: reference,
        p_amount: amount ? amount / 100 : null,
        p_currency: currency,
        p_status: 'failed',
      });
      if (rpcError) {
        console.error('Paystack webhook: failed to record failed-charge event', { reference, code: rpcError.code });
        return NextResponse.json({ error: 'Failed to record transaction event' }, { status: 500 });
      }
    } else if (event.event === 'refund.processed') {
      // Recorded for visibility only — deliberately does not touch
      // subscription status or access. What should happen to a
      // business's access on refund is a product decision this
      // integration does not make on its own.
      //
      // Paystack's refund payload field names are defensively checked
      // (not verified against live docs from this environment) — the
      // first real refund webhook should be checked against what
      // actually arrives.
      const data = event.data ?? {};
      const reference = data.transaction_reference ?? data.reference ?? data?.transaction?.reference ?? null;
      const amount = data.amount ?? data?.transaction?.amount ?? null;
      const currency = data.currency ?? data?.transaction?.currency ?? null;
      const metadata = data.metadata ?? data?.transaction?.metadata ?? {};

      const { error: rpcError } = await (supabase as any).rpc('record_paystack_webhook_transaction_event', {
        p_business_id: metadata?.businessId ?? null,
        p_reference: reference,
        p_amount: amount ? amount / 100 : null,
        p_currency: currency,
        p_status: 'refunded',
      });
      if (rpcError) {
        console.error('Paystack webhook: failed to record refund event', { reference, code: rpcError.code });
        return NextResponse.json({ error: 'Failed to record transaction event' }, { status: 500 });
      }
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook error:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
