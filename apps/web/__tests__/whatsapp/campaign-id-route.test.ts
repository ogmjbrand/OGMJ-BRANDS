import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * PATCH/DELETE on a campaign relied entirely on RLS for tenant
 * isolation -- correct, but silent: a non-member's DELETE matched zero
 * rows (RLS-filtered) with no error, so the route returned
 * `{success: true}` as if it had deleted something. Added an explicit
 * membership check, consistent with every other route in this app, so
 * a non-member gets an honest 403 instead of a misleading 200.
 */

const campaignRow: Record<string, any> = {};
let deleteCalls = 0;

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
      if (table === 'whatsapp_campaigns') {
        return {
          select() {
            return {
              eq() {
                return {
                  async single() {
                    return { data: campaignRow.__notFound ? null : { ...campaignRow }, error: null };
                  },
                };
              },
            };
          },
          delete() {
            return {
              eq() {
                return {
                  async eq() {
                    deleteCalls += 1;
                    return { error: null };
                  },
                };
              },
            };
          },
          update(values: any) {
            return {
              eq() {
                return {
                  select() {
                    return {
                      async single() {
                        Object.assign(campaignRow, values);
                        return { data: { ...campaignRow }, error: null };
                      },
                    };
                  },
                };
              },
            };
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

function reset(overrides: Record<string, any> = {}) {
  for (const key of Object.keys(campaignRow)) delete campaignRow[key];
  Object.assign(campaignRow, { id: 'camp-1', business_id: 'biz-1', status: 'draft', name: 'Launch', message: 'Hi' }, overrides);
  deleteCalls = 0;
}

describe('DELETE /api/marketing/whatsapp/campaigns/[id]', () => {
  beforeEach(() => reset());

  it('REGRESSION FIX: rejects a non-member with 403 instead of a misleading success', async () => {
    reset({ __noAccess: true });
    const { DELETE } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/route');
    const res = await DELETE(new NextRequest('https://ogmjbrands.com/x', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'camp-1' }),
    });

    expect(res.status).toBe(403);
    expect(deleteCalls).toBe(0);
  });

  it('deletes a draft campaign for an actual member', async () => {
    const { DELETE } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/route');
    const res = await DELETE(new NextRequest('https://ogmjbrands.com/x', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'camp-1' }),
    });

    expect(res.status).toBe(200);
    expect(deleteCalls).toBe(1);
  });

  it('refuses to delete a non-draft campaign', async () => {
    reset({ status: 'sent' });
    const { DELETE } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/route');
    const res = await DELETE(new NextRequest('https://ogmjbrands.com/x', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'camp-1' }),
    });

    expect(res.status).toBe(400);
    expect(deleteCalls).toBe(0);
  });
});

describe('PATCH /api/marketing/whatsapp/campaigns/[id]', () => {
  beforeEach(() => reset());

  it('REGRESSION FIX: rejects a non-member with 403', async () => {
    reset({ __noAccess: true });
    const { PATCH } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/route');
    const res = await PATCH(
      new NextRequest('https://ogmjbrands.com/x', { method: 'PATCH', body: JSON.stringify({ name: 'New name' }) }),
      { params: Promise.resolve({ id: 'camp-1' }) }
    );

    expect(res.status).toBe(403);
  });

  it('updates a draft campaign for an actual member', async () => {
    const { PATCH } = await import('@/app/api/marketing/whatsapp/campaigns/[id]/route');
    const res = await PATCH(
      new NextRequest('https://ogmjbrands.com/x', { method: 'PATCH', body: JSON.stringify({ name: 'New name' }) }),
      { params: Promise.resolve({ id: 'camp-1' }) }
    );

    expect(res.status).toBe(200);
    expect(campaignRow.name).toBe('New name');
  });
});
