import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Regression tests for the metadata-injection fix in
 * apps/web/app/api/payments/initialize/route.ts.
 *
 * The vulnerability: this route used to build the metadata sent to
 * Paystack as `{ ...metadata, businessId, planId, userId }`, where
 * `metadata` came straight from the client's request body. Since the
 * webhook route trusts a `subscriptionId` key inside that metadata (if
 * present) to decide which subscription row to activate, a client
 * could inject `metadata: { subscriptionId: '<victim-subscription-id>' }`
 * into the initialize call and have the webhook activate a completely
 * different business's subscription once their own real payment
 * completed.
 *
 * These tests prove the fix by inspecting the actual request body this
 * route sends to Paystack's API, not by inspecting application state --
 * no real payment or live exploit attempt is involved.
 */

const REAL_USER_ID = 'real-user-11111111-1111-1111-1111-111111111111';
const REAL_BUSINESS_ID = 'business-22222222-2222-2222-2222-222222222222';
const PLAN_ID = 'plan-33333333-3333-3333-3333-333333333333';
const VICTIM_SUBSCRIPTION_ID = 'victim-sub-99999999-9999-9999-9999-999999999999';

vi.mock('@/lib/auth.server', () => ({
  getCurrentUserServer: () => Promise.resolve({ id: REAL_USER_ID, email: 'real-user@example.com' }),
}));

function makeSupabaseMock() {
  return {
    from(table: string) {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async single() {
          if (table === 'business_users') {
            return { data: { role: 'owner' }, error: null };
          }
          if (table === 'subscription_plans') {
            return { data: { id: PLAN_ID, price_ngn: 5000, status: 'active' }, error: null };
          }
          return { data: null, error: null };
        },
      };
    },
  };
}

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => Promise.resolve(makeSupabaseMock()),
}));

function makeRequest(body: unknown) {
  return new NextRequest('https://ogmjbrands.com/api/payments/initialize', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('Paystack initialize route — metadata-injection fix', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.PAYSTACK_SECRET_KEY = 'test-paystack-secret';
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { authorization_url: 'https://paystack.test/pay', access_code: 'ac_1', reference: 'ref_1' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('never forwards a client-supplied subscriptionId (or any other extra key) to Paystack', async () => {
    const { POST } = await import('@/app/api/payments/initialize/route');

    const res = await POST(
      makeRequest({
        businessId: REAL_BUSINESS_ID,
        planId: PLAN_ID,
        // Attempted injection: a client-controlled `metadata` object
        // trying to point the webhook at a victim's subscription, and
        // trying to override the server-controlled identity fields.
        metadata: {
          subscriptionId: VICTIM_SUBSCRIPTION_ID,
          businessId: 'attacker-chosen-business-id',
          userId: 'attacker-chosen-user-id',
          planId: 'attacker-chosen-plan-id',
        },
      })
    );

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, requestInit] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(requestInit.body as string);

    expect(sentBody.metadata).toEqual({
      businessId: REAL_BUSINESS_ID,
      planId: PLAN_ID,
      userId: REAL_USER_ID,
    });
    expect(sentBody.metadata.subscriptionId).toBeUndefined();
  });

  it('builds the same safe metadata even when no metadata field is sent at all', async () => {
    const { POST } = await import('@/app/api/payments/initialize/route');

    const res = await POST(makeRequest({ businessId: REAL_BUSINESS_ID, planId: PLAN_ID }));

    expect(res.status).toBe(200);
    const [, requestInit] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(requestInit.body as string);

    expect(sentBody.metadata).toEqual({
      businessId: REAL_BUSINESS_ID,
      planId: PLAN_ID,
      userId: REAL_USER_ID,
    });
  });

  it('request body no longer has a metadata field in its type at all (TS-level lock-in, checked at runtime via extra-key passthrough)', async () => {
    const { POST } = await import('@/app/api/payments/initialize/route');

    // Even a deeply-nested or prototype-pollution-shaped attempt must not
    // surface as an own key on the outgoing metadata object.
    const res = await POST(
      makeRequest({
        businessId: REAL_BUSINESS_ID,
        planId: PLAN_ID,
        metadata: { __proto__: { subscriptionId: VICTIM_SUBSCRIPTION_ID }, subscriptionId: VICTIM_SUBSCRIPTION_ID },
      })
    );

    expect(res.status).toBe(200);
    const [, requestInit] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(requestInit.body as string);
    expect(Object.keys(sentBody.metadata).sort()).toEqual(['businessId', 'planId', 'userId']);
  });
});
