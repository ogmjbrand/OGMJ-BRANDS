import { NextRequest, NextResponse } from 'next/server';
import { isFlutterwaveWebhookConfigured, verifyFlutterwaveWebhookSignature } from '@/lib/payments/flutterwave';
import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/service-role';

/**
 * Flutterwave's documented webhook security mechanism is a static
 * secret-hash header comparison (verif-hash), not HMAC over the body —
 * see lib/payments/flutterwave.ts for the verification function.
 *
 * This webhook carries no Supabase user session (it's Flutterwave
 * calling back directly) — the verif-hash check above is the security
 * boundary, not RLS. The RPCs below are restricted to service_role by
 * the same payment_rpc_authorization_fix migration that restricts the
 * Paystack webhook's RPCs (see apps/web/app/api/webhooks/paystack/route.ts
 * and lib/supabase/service-role.ts for the full rationale) — this route
 * uses the service-role client for the same reason: the anon-key
 * client lost EXECUTE on that migration's apply, and a route still
 * using it would silently fail to record every real delivery while
 * still returning 200. Fails closed with a non-2xx response on an RPC
 * failure so Flutterwave retries instead of the event being lost; only
 * the reference and error code are logged, never the full error
 * object, metadata, or customer details. Idempotent on provider_reference.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isFlutterwaveWebhookConfigured()) {
      return NextResponse.json(
        { error: 'Flutterwave webhook verification is not configured' },
        { status: 503 }
      );
    }

    const verifHash = request.headers.get('verif-hash');
    if (!verifyFlutterwaveWebhookSignature(verifHash)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Signature verified above -- only now do we check whether the
    // trusted path to record it is available, so an unauthenticated
    // request never learns anything about service-role configuration
    // state before it's proven to be a legitimate, signed delivery.
    if (!isServiceRoleConfigured()) {
      console.error('Flutterwave webhook: SUPABASE_SERVICE_ROLE_KEY is not configured on this deployment');
      return NextResponse.json({ error: 'Webhook processing is not configured' }, { status: 503 });
    }

    const event = await request.json().catch(() => null);
    if (!event) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const data = event.data ?? {};
    const eventType: string | undefined = event.event ?? data.status;
    const reference: string | undefined = data.tx_ref ?? data.txRef;
    const amount = data.amount ?? null;
    const currency = data.currency ?? null;
    const metadata = data.meta ?? data.metadata ?? {};
    const status: string | undefined = data.status;

    const supabase = createServiceRoleClient();

    if (status === 'successful' || eventType === 'charge.completed') {
      const { error: rpcError } = await (supabase as any).rpc('record_flutterwave_webhook_charge', {
        p_business_id: metadata?.businessId ?? null,
        p_subscription_id: metadata?.subscriptionId ?? null,
        p_reference: reference ?? null,
        p_amount: amount,
        p_currency: currency,
      });
      if (rpcError) {
        // Do not acknowledge success when the transaction wasn't
        // actually recorded -- a non-2xx here tells Flutterwave to
        // retry delivery instead of this event being silently lost.
        console.error('Flutterwave webhook: failed to record charge', { reference, code: rpcError.code });
        return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
      }
    } else if (status === 'failed') {
      const { error: rpcError } = await (supabase as any).rpc('record_flutterwave_webhook_transaction_event', {
        p_business_id: metadata?.businessId ?? null,
        p_reference: reference ?? null,
        p_amount: amount,
        p_currency: currency,
        p_status: 'failed',
      });
      if (rpcError) {
        console.error('Flutterwave webhook: failed to record failed-charge event', { reference, code: rpcError.code });
        return NextResponse.json({ error: 'Failed to record transaction event' }, { status: 500 });
      }
    } else if (eventType === 'refund.completed' || status === 'refunded') {
      // Recorded for visibility only — deliberately does not touch
      // subscription status or access, same as the Paystack refund
      // handler. What should happen to access on refund is a product
      // decision this integration does not make on its own.
      const { error: rpcError } = await (supabase as any).rpc('record_flutterwave_webhook_transaction_event', {
        p_business_id: metadata?.businessId ?? null,
        p_reference: reference ?? null,
        p_amount: amount,
        p_currency: currency,
        p_status: 'refunded',
      });
      if (rpcError) {
        console.error('Flutterwave webhook: failed to record refund event', { reference, code: rpcError.code });
        return NextResponse.json({ error: 'Failed to record transaction event' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Flutterwave webhook error:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
