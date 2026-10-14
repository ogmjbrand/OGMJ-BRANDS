import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Route-level behavior tests for the Flutterwave webhook.
 *
 * Mirrors apps/web/__tests__/payments/paystack-webhook-route.test.ts:
 * proves this route uses the service-role client (not the anon-key
 * client, which lost EXECUTE on the payment_rpc_authorization_fix
 * migration -- see service-role.ts for the full rationale) and fails
 * closed (non-2xx, not a silent 200) on an RPC failure for every event
 * type this route handles, so Flutterwave retries instead of the event
 * being silently lost.
 */

const SECRET = 'test-flutterwave-secret-do-not-use-in-prod';

function makeRequest(body: string, verifHash: string | null) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (verifHash !== null) headers['verif-hash'] = verifHash;
  return new NextRequest('https://ogmjbrands.com/api/webhooks/flutterwave', {
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

describe('Flutterwave webhook route', () => {
  const originalSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;

  beforeEach(() => {
    process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH = SECRET;
    rpcMock.mockReset();
    isServiceRoleConfiguredMock.mockReset();
    isServiceRoleConfiguredMock.mockReturnValue(true);
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
    else process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH = originalSecret;
  });

  it('rejects a missing verif-hash header with 401, before touching the RPC', async () => {
    const { POST } = await import('@/app/api/webhooks/flutterwave/route');
    const body = JSON.stringify({ event: 'charge.completed', data: { tx_ref: 'r1', status: 'successful', amount: 1000, currency: 'NGN' } });
    const res = await POST(makeRequest(body, null));
    expect(res.status).toBe(401);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('rejects an incorrect verif-hash with 401, before touching the RPC', async () => {
    const { POST } = await import('@/app/api/webhooks/flutterwave/route');
    const body = JSON.stringify({ event: 'charge.completed', data: { tx_ref: 'r2', status: 'successful', amount: 1000, currency: 'NGN' } });
    const res = await POST(makeRequest(body, 'wrong-secret'));
    expect(res.status).toBe(401);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('fails closed with 503 when FLUTTERWAVE_WEBHOOK_SECRET_HASH is missing', async () => {
    delete process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
    const { POST } = await import('@/app/api/webhooks/flutterwave/route');
    const body = JSON.stringify({ event: 'charge.completed', data: { tx_ref: 'r3', status: 'successful', amount: 1000, currency: 'NGN' } });
    const res = await POST(makeRequest(body, 'irrelevant-since-no-secret-to-check-against'));
    expect(res.status).toBe(503);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('fails closed with 503 when the service-role client is not configured, after a valid signature', async () => {
    isServiceRoleConfiguredMock.mockReturnValue(false);
    const { POST } = await import('@/app/api/webhooks/flutterwave/route');
    const body = JSON.stringify({ event: 'charge.completed', data: { tx_ref: 'r4', status: 'successful', amount: 1000, currency: 'NGN' } });
    const res = await POST(makeRequest(body, SECRET));
    expect(res.status).toBe(503);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('returns 200 and records the charge via the service-role client when the RPC succeeds', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    const { POST } = await import('@/app/api/webhooks/flutterwave/route');
    const body = JSON.stringify({ event: 'charge.completed', data: { tx_ref: 'r5', status: 'successful', amount: 1000, currency: 'NGN', meta: {} } });
    const res = await POST(makeRequest(body, SECRET));
    expect(res.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith('record_flutterwave_webhook_charge', expect.objectContaining({ p_reference: 'r5' }));
  });

  it('REGRESSION FIX: a charge RPC failure returns a non-2xx (not 200), so Flutterwave retries', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'permission denied for function record_flutterwave_webhook_charge', code: '42501' } });
    const { POST } = await import('@/app/api/webhooks/flutterwave/route');
    const body = JSON.stringify({ event: 'charge.completed', data: { tx_ref: 'r6', status: 'successful', amount: 1000, currency: 'NGN', meta: {} } });
    const res = await POST(makeRequest(body, SECRET));
    expect(res.status).not.toBe(200);
    expect(res.status).toBeGreaterThanOrEqual(500);
  });

  it('records a failed-charge event and returns 200 when the RPC succeeds', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    const { POST } = await import('@/app/api/webhooks/flutterwave/route');
    const body = JSON.stringify({ data: { tx_ref: 'r7', status: 'failed', amount: 1000, currency: 'NGN', meta: {} } });
    const res = await POST(makeRequest(body, SECRET));
    expect(res.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith('record_flutterwave_webhook_transaction_event', expect.objectContaining({ p_reference: 'r7', p_status: 'failed' }));
  });

  it('REGRESSION FIX: a failed-charge RPC failure returns a non-2xx, not a silent 200', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'permission denied', code: '42501' } });
    const { POST } = await import('@/app/api/webhooks/flutterwave/route');
    const body = JSON.stringify({ data: { tx_ref: 'r8', status: 'failed', amount: 1000, currency: 'NGN', meta: {} } });
    const res = await POST(makeRequest(body, SECRET));
    expect(res.status).not.toBe(200);
    expect(res.status).toBeGreaterThanOrEqual(500);
  });

  it('records a refund event and returns 200 when the RPC succeeds', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    const { POST } = await import('@/app/api/webhooks/flutterwave/route');
    const body = JSON.stringify({ event: 'refund.completed', data: { tx_ref: 'r9', amount: 1000, currency: 'NGN', meta: {} } });
    const res = await POST(makeRequest(body, SECRET));
    expect(res.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith('record_flutterwave_webhook_transaction_event', expect.objectContaining({ p_reference: 'r9', p_status: 'refunded' }));
  });

  it('REGRESSION FIX: a refund RPC failure returns a non-2xx, not a silent 200', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'permission denied', code: '42501' } });
    const { POST } = await import('@/app/api/webhooks/flutterwave/route');
    const body = JSON.stringify({ event: 'refund.completed', data: { tx_ref: 'r10', amount: 1000, currency: 'NGN', meta: {} } });
    const res = await POST(makeRequest(body, SECRET));
    expect(res.status).not.toBe(200);
    expect(res.status).toBeGreaterThanOrEqual(500);
  });

  it('acknowledges (200) a status it does not act on, without calling the RPC', async () => {
    const { POST } = await import('@/app/api/webhooks/flutterwave/route');
    const body = JSON.stringify({ data: { tx_ref: 'r11', status: 'pending', amount: 1000, currency: 'NGN' } });
    const res = await POST(makeRequest(body, SECRET));
    expect(res.status).toBe(200);
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
