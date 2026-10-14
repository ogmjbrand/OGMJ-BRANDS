import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyPaystackWebhookSignature } from '@/lib/payments/paystack';

describe('Paystack webhook signature verification', () => {
  const secret = 'test-paystack-secret-do-not-use-in-prod';
  const body = JSON.stringify({ event: 'charge.success', data: { reference: 'ref_123' } });
  const validSignature = crypto.createHmac('sha512', secret).update(body).digest('hex');

  it('rejects a missing signature header', () => {
    expect(verifyPaystackWebhookSignature(body, null, secret)).toBe(false);
  });

  it('rejects an empty-string signature header', () => {
    expect(verifyPaystackWebhookSignature(body, '', secret)).toBe(false);
  });

  it('rejects an incorrect signature', () => {
    expect(verifyPaystackWebhookSignature(body, 'a'.repeat(128), secret)).toBe(false);
  });

  it('rejects a signature computed with the wrong secret', () => {
    const wrongSig = crypto.createHmac('sha512', 'wrong-secret').update(body).digest('hex');
    expect(verifyPaystackWebhookSignature(body, wrongSig, secret)).toBe(false);
  });

  it('rejects a valid-looking signature if the body was tampered with', () => {
    const tamperedBody = JSON.stringify({ event: 'charge.success', data: { reference: 'ref_999' } });
    expect(verifyPaystackWebhookSignature(tamperedBody, validSignature, secret)).toBe(false);
  });

  it('accepts a correctly computed signature', () => {
    expect(verifyPaystackWebhookSignature(body, validSignature, secret)).toBe(true);
  });

  it('rejects any signature when no secret is configured', () => {
    expect(verifyPaystackWebhookSignature(body, validSignature, undefined)).toBe(false);
  });

  it('rejects malformed (non-hex, wrong-length) signature input without throwing', () => {
    expect(() => verifyPaystackWebhookSignature(body, 'not-a-hex-signature!!', secret)).not.toThrow();
    expect(verifyPaystackWebhookSignature(body, 'not-a-hex-signature!!', secret)).toBe(false);
  });
});
