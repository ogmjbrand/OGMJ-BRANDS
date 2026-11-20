import { createClient } from '@supabase/supabase-js';

/**
 * OGMJ BRANDS — Service-role Supabase client (server-only, trusted path)
 *
 * This client authenticates with the Supabase SERVICE ROLE key, which
 * bypasses Row Level Security entirely. Known legitimate uses:
 *
 * 1. Calling the payment-recording webhook RPCs
 *    (record_paystack_webhook_charge, record_paystack_webhook_transaction_event,
 *    record_flutterwave_webhook_charge, record_flutterwave_webhook_transaction_event)
 *    from inside the Paystack/Flutterwave webhook routes, which have no
 *    Supabase user session to authenticate as.
 * 2. lib/ai/rateLimit.ts's business-scoped AI rate-limit counter
 *    (`rate_limits` table): its RLS policy only allows an admin-role
 *    SELECT and has no client-writable policy at all, by design (the
 *    counter itself must be write-trusted, not user-writable). Only
 *    ever called AFTER the request's caller has already been verified
 *    (authenticated user + confirmed active business membership),
 *    exactly like the webhook routes verify their signature first.
 *
 * SECURITY_FIX (C1): those RPCs were previously called using the public
 * anon-key client, which meant they had to be granted EXECUTE to the
 * `anon` role to work at all — and since they performed no internal
 * authorization check of their own, that made them callable by anyone
 * on the internet with the (public, shipped-to-the-browser) anon key,
 * completely bypassing this route's own webhook-signature check. The
 * fix is two-sided: the database migration revokes anon/authenticated
 * EXECUTE on those functions (service_role only, already applied to
 * production), and this client is what lets the legitimate webhook
 * routes keep working after that revocation.
 *
 * DO NOT:
 *   - import this from any 'use client' component or anything that
 *     could end up in a client-side bundle
 *   - import this into any route that does not independently verify
 *     the caller first (e.g. a webhook's HMAC/verif-hash signature
 *     check) — this client bypasses RLS entirely, so the route itself
 *     is the only remaining authorization boundary once you use it
 *   - widen its use beyond the specific RPC calls it was introduced
 *     for without a matching security review
 *
 * Fails closed: throws immediately if SUPABASE_SERVICE_ROLE_KEY is not
 * configured, rather than silently falling back to a weaker client.
 */

export function isServiceRoleConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured on this deployment');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
