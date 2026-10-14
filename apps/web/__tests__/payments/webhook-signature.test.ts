import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { verifyPaystackWebhookSignature } from '@/lib/payments/paystack';
import { verifyFlutterwaveWebhookSignature, isFlutterwaveWebhookConfigured } from '@/lib/payments/flutterwave';

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

describe('Flutterwave webhook signature verification', () => {
  const originalEnv = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
  const testSecret = 'test-flutterwave-secret-do-not-use-in-prod';

  beforeEach(() => {
    process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH = testSecret;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
    } else {
      process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH = originalEnv;
    }
  });

  it('reports configured when the secret env var is set', () => {
    expect(isFlutterwaveWebhookConfigured()).toBe(true);
  });

  it('rejects a missing verif-hash header', () => {
    expect(verifyFlutterwaveWebhookSignature(null)).toBe(false);
  });

  it('rejects an empty-string verif-hash header', () => {
    expect(verifyFlutterwaveWebhookSignature('')).toBe(false);
  });

  it('rejects an incorrect secret hash', () => {
    expect(verifyFlutterwaveWebhookSignature('totally-wrong-value')).toBe(false);
  });

  it('rejects an incorrect secret hash of the same length (rules out a length-only check)', () => {
    const sameLengthWrong = testSecret.slice(0, -1) + (testSecret.endsWith('d') ? 'x' : 'd');
    expect(verifyFlutterwaveWebhookSignature(sameLengthWrong)).toBe(false);
  });

  it('accepts the correct secret hash', () => {
    expect(verifyFlutterwaveWebhookSignature(testSecret)).toBe(true);
  });

  it('rejects any signature when no secret is configured', () => {
    delete process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
    expect(isFlutterwaveWebhookConfigured()).toBe(false);
    expect(verifyFlutterwaveWebhookSignature(testSecret)).toBe(false);
  });

  it('rejects malformed input without throwing', () => {
    expect(() => verifyFlutterwaveWebhookSignature('\u0000\u0001weird-bytes')).not.toThrow();
    expect(verifyFlutterwaveWebhookSignature('\u0000\u0001weird-bytes')).toBe(false);
  });
});
