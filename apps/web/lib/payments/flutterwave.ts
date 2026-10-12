/**
 * OGMJ BRANDS — Flutterwave Payments Client (server-only)
 *
 * Flutterwave's v3 REST API over fetch — no SDK dependency. Mirrors the
 * same security posture as the Paystack flow: amounts are always derived
 * server-side from subscription_plans, never trusted from the client,
 * and the only client-supplied input to verify is a transaction id.
 */

import crypto from 'crypto';

export function isFlutterwaveConfigured(): boolean {
  return Boolean(process.env.FLUTTERWAVE_SECRET_KEY);
}

export function isFlutterwaveWebhookConfigured(): boolean {
  return Boolean(process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH);
}

/**
 * Flutterwave's documented webhook security mechanism is a static secret
 * hash (not HMAC): you set a "secret hash" string in the Flutterwave
 * dashboard's webhook settings, and every webhook delivery echoes it
 * back in the `verif-hash` header — a simple equality check, not a
 * signature over the body. See Flutterwave's webhook verification docs.
 */
export function verifyFlutterwaveWebhookSignature(verifHashHeader: string | null): boolean {
  const expected = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
  if (!expected || !verifHashHeader) return false;
  // Constant-time comparison — this is a shared secret check, not a
  // public signature, so timing differences matter.
  if (verifHashHeader.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(verifHashHeader), Buffer.from(expected));
}

export interface FlutterwaveVerifyResult {
  status: string;
  amount: number;
  currency: string;
  txRef: string;
  customerEmail: string | null;
  meta: Record<string, unknown> | null;
  error: string | null;
}

export async function verifyFlutterwaveTransaction(transactionId: string): Promise<FlutterwaveVerifyResult> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY as string;

  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.status !== 'success' || !data?.data) {
    return {
      status: 'failed',
      amount: 0,
      currency: '',
      txRef: '',
      customerEmail: null,
      meta: null,
      error: data?.message || `Flutterwave verification request failed (${response.status})`,
    };
  }

  const tx = data.data;
  return {
    status: tx.status,
    amount: Number(tx.amount),
    currency: tx.currency,
    txRef: tx.tx_ref,
    customerEmail: tx.customer?.email ?? null,
    meta: tx.meta ?? null,
    error: null,
  };
}
