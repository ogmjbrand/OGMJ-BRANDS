import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Regression tests for two defects in POST
 * /api/marketing/whatsapp/campaigns/[id]/send:
 *
 * 1. TOCTOU race: the route read campaign.status, checked it was
 *    'draft', and only much later wrote status: 'sending' -- with
 *    nothing stopping two concurrent "Send" calls from both passing
 *    that check before either wrote. Each would go on to message
 *    every recipient, so a double-click or two browser tabs could send
 *    an entire campaign twice.
 * 2. No rate limiting at all on the bulk send, unlike the ad-hoc
 *    single-send endpoint -- a campaign with many contacts could
 *    dispatch an unbounded number of paid WhatsApp messages in one
 *    call.
 *
 * Fix: a single atomic conditional UPDATE (`... WHERE status = 'draft'`)
 * claims the campaign before sending anything -- not a separate SELECT
 * followed by an unconditional UPDATE -- so exactly one concurrent
 * caller can ever win it. A rate-limit check keyed by recipient count
 * (not call count) runs before that claim. A pre-send filter against
 * existing 'sent' rows makes any future resume/retry path safe from
 * double-messaging someone who already got the campaign.
 */

const campaignRow: Record<string, any> = {};
let contactsRows: Array<{ id: string; phone: string }> = [];
let existingSentContactIds: string[] = [];
const sendsInserted: any[] = [];
const sendWhatsAppMessageMock = vi.fn();
const checkRateLimitMock = vi.fn();

function makeSupabaseMock() {
  return {
    from(table: string) {
      if (table === 'business_users') {
        return {
          select() { return this; },
          eq() { return this; },
          async single() {
            return { data: campaignRow.__noAccess ? null : { role: 'owner' }, error: null };
          },
        };
      }
      if (table === 'contacts') {
        const builder: any = {
          select() { return builder; },
          eq() { return builder; },
          not() { return builder; },
          then(resolve: any) {
            resolve({ data: contactsRows, error: null });
          },
        };
        return builder;
      }
      if (table === 'whatsapp_sends') {
        return {
          select() {
            const builder: any = {
              eq() { return builder; },
              then(resolve: any) {
                resolve({ data: existingSentContactIds.map((contact_id) => ({ contact_id })), error: null });
              },
            };
            return builder;
          },
          insert(values: any) {
            sendsInserted.push(values);
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === 'whatsapp_campaigns') {
        return {
          select() {
            return {
              eq() {
                return {
                  async single() {
                    return { data: { ...campaignRow }, error: null };
                  },
                };
              },
            };
          },
          update(values: Record<string, any>) {
            const filters: Record<string, any> = {};
            const builder: any = {
              eq(col: string, val: any) {
                filters[col] = val;
                return builder;
              },
              select() {
                return {
                  async single() {
                    if ('status' in filters && filters.status !== campaignRow.status) {
                      return { data: null, error: { code: 'PGRST116', message: 'no rows found' } };
                    }
                    if (campaignRow.__claimDbError) {
                      return { data: null, error: { code: '08006', message: 'connection reset by peer' } };
                    }
                    Object.assign(campaignRow, values);
                    return { data: { ...campaignRow }, error: null };
                  },
                };
              },
              then(resolve: any) {
                Object.assign(campaignRow, values);
                resolve({ data: null, error: null });
              },
            };
            return builder;
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

let currentUser: { id: string; email: string } | null = { id: 'user-1', email: 'user@example.com' };

vi.mock('@/lib/auth.server', () => ({
  getCurrentUserServer: () => Promise.resolve(currentUser),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => Promise.resolve(makeSupabaseMock()),
}));

vi.mock('@/lib/whatsapp/twilio', () => ({
  isTwilioConfigured: () => true,
  isTwilioSendingEnabled: () => true,
  sendWhatsAppMessage: (...args: any[]) => sendWhatsAppMessageMock(...args),
}));

vi.mock('@/lib/utils/rate-limit', () => ({
  checkRateLimit: (...args: any[]) => checkRateLimitMock(...args),
}));

function makeRequest() {
  return new NextRequest('https://ogmjbrands.com/api/marketing/whatsapp/campaigns/camp-1/send', { method: 'POST' });
}

function reset(overrides: Record<string, any> = {}) {
  currentUser = { id: 'user-1', email: 'user@example.com' };
  for (const key of Object.keys(campaignRow)) delete campaignRow[key];
  Object.assign(campaignRow, { id: 'camp-1', business_id: 'biz-1', message: 'Hello!', status: 'draft', recipient_filter: {} }, overrides);
  contactsRows = [
    { id: 'contact-1', phone: '+2348012345678' },
    { id: 'contact-2', phone: '+2348012345679' },
  ];
  existingSentContactIds = [];
  sendsInserted.length = 0;
  sendWhatsAppMessageMock.mockReset();
  sendWhatsAppMessageMock.mockResolvedValue({ sid: 'SM123', status: 'queued', error: null });
  checkRateLimitMock.mockReset();
  checkRateLimitMock.mockResolvedValue({ allowed: true });
}

describe('POST /api/marketing/whatsapp/campaigns/[id]/send', () => {
  beforeEach(() => {
    reset();
  });

  // --- 5. Authorized sending still works -----------------------------
  it('sends to every recipient and marks the campaign sent on the happy path', async () => {
    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.sent).toBe(2);
    expect(campaignRow.status).toBe('sent');
    expect(sendWhatsAppMessageMock).toHaveBeenCalledTimes(2);
  });

  // --- 1 & 2. Two concurrent sends cannot both claim and dispatch ----
  it('REGRESSION FIX: two truly concurrent send requests -- exactly one dispatches, the other gets a clean conflict, and the provider is never called twice over', async () => {
    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');

    const [res1, res2] = await Promise.all([
      POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) }),
      POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // One request wins the atomic claim (200), the other is rejected
    // outright (409) -- never both succeeding, never both failing.
    expect(statuses).toEqual([200, 409]);
    // The whole point of claiming before sending: only the winner's loop
    // ever runs, so every recipient is messaged exactly once in total,
    // not twice.
    expect(sendWhatsAppMessageMock).toHaveBeenCalledTimes(2);
  });

  // --- 2. A request that fails to acquire the claim sends zero messages
  it('REGRESSION FIX: a losing race on the atomic claim never sends a single message', async () => {
    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');

    // Simulate another request's claim having already landed in the
    // narrow window between this request's rate-limit check and its own
    // claim attempt.
    checkRateLimitMock.mockImplementationOnce(async () => {
      campaignRow.status = 'sending'; // another request already claimed it
      return { allowed: true };
    });

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });

    expect(res.status).toBe(409);
    expect(sendWhatsAppMessageMock).not.toHaveBeenCalled();
    expect(sendsInserted).toHaveLength(0);
  });

  // --- 3. A database claim failure sends zero messages ----------------
  it('REGRESSION FIX: a genuine database error on the claim is reported as 500, not 409, and sends zero messages', async () => {
    reset({ __claimDbError: true });
    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });

    expect(res.status).toBe(500);
    expect(campaignRow.status).toBe('draft'); // never claimed
    expect(sendWhatsAppMessageMock).not.toHaveBeenCalled();
    expect(sendsInserted).toHaveLength(0);
  });

  // --- 4. A rate-limited request sends zero messages ------------------
  it('REGRESSION FIX: rejects with 429 and never claims or sends when the rate limit is exceeded', async () => {
    checkRateLimitMock.mockResolvedValue({ allowed: false, error: 'limit exceeded' });

    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });

    expect(res.status).toBe(429);
    expect(campaignRow.status).toBe('draft'); // never claimed
    expect(sendWhatsAppMessageMock).not.toHaveBeenCalled();
    expect(sendsInserted).toHaveLength(0);
  });

  it('checks the rate limit by recipient count, not by call count', async () => {
    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');
    await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });

    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: 'biz-1', incrementBy: 2, endpoint: 'whatsapp:campaign-send' })
    );
  });

  it('rejects an already-sent campaign before ever checking the rate limit', async () => {
    reset({ status: 'sent' });
    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });

    expect(res.status).toBe(400);
    expect(checkRateLimitMock).not.toHaveBeenCalled();
  });

  // --- 6. Unauthorized / cross-business access is rejected ------------
  it('rejects an unauthenticated request before touching the campaign', async () => {
    currentUser = null;
    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });
    expect(res.status).toBe(401);
    expect(sendWhatsAppMessageMock).not.toHaveBeenCalled();
  });

  it('rejects a user who is not an active member of the campaign business', async () => {
    reset({ __noAccess: true });
    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });

    expect(res.status).toBe(403);
    expect(sendWhatsAppMessageMock).not.toHaveBeenCalled();
    expect(campaignRow.status).toBe('draft'); // never claimed either
  });

  // --- 7. Partial/provider failures never mark the whole campaign falsely successful
  it('records a per-recipient failure without losing track of the other sends', async () => {
    sendWhatsAppMessageMock
      .mockResolvedValueOnce({ sid: 'SM123', status: 'queued', error: null })
      .mockResolvedValueOnce({ sid: null, status: null, error: 'The "To" number is not currently reachable' });

    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.sent).toBe(1);
    expect(body.data.failed).toBe(1);
    expect(campaignRow.status).toBe('sent'); // not every recipient failed
  });

  it('REGRESSION: marks the campaign "failed", not "sent", when every recipient fails', async () => {
    sendWhatsAppMessageMock.mockResolvedValue({ sid: null, status: null, error: 'Twilio outage' });

    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.sent).toBe(0);
    expect(campaignRow.status).toBe('failed');
  });

  // --- 8. Safe retry / crash-recovery cannot duplicate recipients -----
  it('REGRESSION FIX: a contact already recorded as sent for this campaign is never messaged again', async () => {
    existingSentContactIds = ['contact-1'];
    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    // Only contact-2 is actually sent to.
    expect(sendWhatsAppMessageMock).toHaveBeenCalledTimes(1);
    expect(body.data.total).toBe(1);
  });

  it('REGRESSION FIX: refuses to proceed when every matching recipient was already sent this campaign', async () => {
    existingSentContactIds = ['contact-1', 'contact-2'];
    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });

    expect(res.status).toBe(400);
    expect(sendWhatsAppMessageMock).not.toHaveBeenCalled();
    expect(campaignRow.status).toBe('draft'); // never claimed -- nothing to send
  });
});
