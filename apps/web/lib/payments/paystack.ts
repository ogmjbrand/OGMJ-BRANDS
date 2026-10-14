/**
 * OGMJ BRANDS — Paystack Payments Client (server-only)
 *
 * Extracted from the webhook route so the signature-verification logic
 * can be unit-tested directly, mirroring the existing Flutterwave module
 * (lib/payments/flutterwave.ts).
 */

import crypto from 'crypto';

export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

/**
 * Paystack's documented webhook security mechanism: a hex-encoded
 * HMAC-SHA512 of the raw request body, keyed with the Paystack secret
 * key, sent in the `x-paystack-signature` header. Constant-time
 * comparison — this is a MAC check, so timing differences between a
 * near-miss and a correct hash shouldn't be observable.
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secretKey: string | undefined
): boolean {
  if (!secretKey || !signatureHeader) return false;

  const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');

  return (
    hash.length === signatureHeader.length &&
    crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signatureHeader))
  );
}
