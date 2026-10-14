import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { NextRequest } from 'next/server';

/**
 * Route-level behavior tests for the Paystack webhook hotfix.
 *
 * These exercise the actual POST handler's HTTP response codes under
 * mocked RPC outcomes -- specifically proving the regression this
 * hotfix fixes (a failed RPC call must NOT return 200) and the fail-
 * closed behavior when the service-role client isn't configured.
 *
 * Real RPC idempotency (a redelivered charge.success is a no-op, not a
 * duplicate row) is proven separately at the database layer via
 * packages/db/supabase/tests/*.sql run against the live schema inside
 * a rolled-back transaction -- this suite mocks the RPC result, so it
 * cannot and does not re-prove that guarantee; it only proves the
 * route correctly acts on whatever result the RPC returns.
 */

const SECRET = 'test-paystack-secret-do-not-use-in-prod';

function sign(body: string, secret = SECRET) {
  return crypto.createHmac('sha512', secret).update(body).digest('hex');
}

function makeRequest(body: string, signature: string | null) {
  const headers: Record<string, string> = {};
  if (signature !== null) headers['x-paystack-signature'] = signature;
  return new NextRequest('https://ogmjbrands.com/api/webhooks/paystack', {
    method: 'POST',
    body,
    headers,
  });
}

const rpcMock = vi.fn();
const isServiceRoleConfiguredMock = vi.fn();

vi.mock('@/lib/supabase/service-role', () => ({
  isServiceRoleConfigured: () => isServiceRoleConfiguredMock(),
  createServiceRoleClient: () => ({ rpc: rpcMock }),
}));

vi.mock('@/lib/email/resend', () => ({
  isResendConfigured: () => false,
  getResendClient: () => ({ emails: { send: vi.fn() } }),
  RESEND_FROM_EMAIL: 'test@example.com',
}));

describe('Paystack webhook route — hotfix behavior', () => {
  const originalSecret = process.env.PAYSTACK_SECRET_KEY;

  beforeEach(() => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    rpcMock.mockReset();
    isServiceRoleConfiguredMock.mockReset();
    isServiceRoleConfiguredMock.mockReturnValue(true);
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = originalSecret;
  });

  it('rejects a missing signature header with 401, before touching the RPC', async () => {
    const { POST } = await import('@/app/api/webhooks/paystack/route');
    const body = JSON.stringify({ event: 'charge.success', data: { reference: 'r1', amount: 1000, currency: 'NGN', customer: {} } });
    const res = await POST(makeRequest(body, null));
    expect(res.status).toBe(401);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid signature with 401, before touching the RPC', async () => {
    const { POST } = await import('@/app/api/webhooks/paystack/route');
    const body = JSON.stringify({ event: 'charge.success', data: { reference: 'r2', amount: 1000, currency: 'NGN', customer: {} } });
    const res = await POST(makeRequest(body, 'a'.repeat(128)));
    expect(res.status).toBe(401);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('fails closed with 500 when PAYSTACK_SECRET_KEY is missing', async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const { POST } = await import('@/app/api/webhooks/paystack/route');
    const body = JSON.stringify({ event: 'charge.success', data: { reference: 'r3', amount: 1000, currency: 'NGN', customer: {} } });
    const res = await POST(makeRequest(body, 'irrelevant-since-no-secret-to-check-against'));
    expect(res.status).toBe(500);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('fails closed with 503 when the service-role client is not configured, after a valid signature', async () => {
    isServiceRoleConfiguredMock.mockReturnValue(false);
    const { POST } = await import('@/app/api/webhooks/paystack/route');
    const body = JSON.stringify({ event: 'charge.success', data: { reference: 'r4', amount: 1000, currency: 'NGN', customer: {} } });
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(503);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('returns 200 and records the charge when the RPC succeeds', async () => {
    rpcMock.mockResolvedValue({ data: { success: true, duplicate: false }, error: null });
    const { POST } = await import('@/app/api/webhooks/paystack/route');
    const body = JSON.stringify({ event: 'charge.success', data: { reference: 'r5', amount: 1000, currency: 'NGN', customer: {} } });
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith('record_paystack_webhook_charge', expect.objectContaining({ p_reference: 'r5' }));
  });

  it('REGRESSION FIX: returns a non-2xx (not 200) when the RPC fails, so Paystack retries', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'permission denied for function record_paystack_webhook_charge', code: '42501' } });
    const { POST } = await import('@/app/api/webhooks/paystack/route');
    const body = JSON.stringify({ event: 'charge.success', data: { reference: 'r6', amount: 1000, currency: 'NGN', customer: {} } });
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).not.toBe(200);
    expect(res.status).toBeGreaterThanOrEqual(500);
  });

  it('acknowledges (200) an event type it does not act on, without calling the RPC', async () => {
    const { POST } = await import('@/app/api/webhooks/paystack/route');
    const body = JSON.stringify({ event: 'subscription.create', data: {} });
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
