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
 * Fix: an atomic claim (UPDATE ... WHERE status = 'draft') before
 * sending anything, and a rate-limit check keyed by recipient count
 * (not call count) before that claim.
 */

const campaignRow: Record<string, any> = {};
let contactsRows: Array<{ id: string; phone: string }> = [];
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

vi.mock('@/lib/auth.server', () => ({
  getCurrentUserServer: () => Promise.resolve({ id: 'user-1', email: 'user@example.com' }),
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
  for (const key of Object.keys(campaignRow)) delete campaignRow[key];
  Object.assign(campaignRow, { id: 'camp-1', business_id: 'biz-1', message: 'Hello!', status: 'draft', recipient_filter: {} }, overrides);
  contactsRows = [
    { id: 'contact-1', phone: '+2348012345678' },
    { id: 'contact-2', phone: '+2348012345679' },
  ];
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

  it('sends to every recipient and marks the campaign sent on the happy path', async () => {
    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.sent).toBe(2);
    expect(campaignRow.status).toBe('sent');
    expect(sendWhatsAppMessageMock).toHaveBeenCalledTimes(2);
  });

  it('REGRESSION FIX: a losing race on the atomic claim never sends a single message', async () => {
    // Simulate another request's claim having already landed: by the
    // time this request reaches its own claim, the row is no longer
    // 'draft' in the database, even though this request's earlier read
    // (above) saw 'draft'.
    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');

    // Flip status out from under the claim by wrapping checkRateLimit
    // (the step immediately before the claim) to simulate the
    // concurrent write landing in that window.
    checkRateLimitMock.mockImplementationOnce(async () => {
      campaignRow.status = 'sending'; // another request already claimed it
      return { allowed: true };
    });

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });

    expect(res.status).toBe(409);
    expect(sendWhatsAppMessageMock).not.toHaveBeenCalled();
    expect(sendsInserted).toHaveLength(0);
  });

  it('REGRESSION FIX: rejects with 429 and never claims or sends when the rate limit is exceeded', async () => {
    checkRateLimitMock.mockResolvedValue({ allowed: false, error: 'limit exceeded' });

    const { POST } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/send/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'camp-1' }) });

    expect(res.status).toBe(429);
    expect(campaignRow.status).toBe('draft'); // never claimed
    expect(sendWhatsAppMessageMock).not.toHaveBeenCalled();
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
});
