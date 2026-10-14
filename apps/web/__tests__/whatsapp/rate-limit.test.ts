import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * checkRateLimit's `incrementBy` is what lets the campaign-send route
 * cap total recipients per hour instead of total calls per hour. This
 * confirms the RPC receives the right value, and that omitting it keeps
 * every pre-existing caller (one unit per call) unchanged.
 */

const rpcMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () =>
    Promise.resolve({
      rpc: (...args: any[]) => rpcMock(...args),
    }),
}));

beforeEach(() => {
  rpcMock.mockReset();
  rpcMock.mockResolvedValue({ data: true, error: null });
});

describe('checkRateLimit', () => {
  it('defaults p_increment_by to 1 when incrementBy is omitted (backward compatible)', async () => {
    const { checkRateLimit } = await import('@/lib/utils/rate-limit');
    await checkRateLimit({ businessId: 'biz-1', endpoint: 'whatsapp:send', limit: 20, windowMinutes: 60 });

    expect(rpcMock).toHaveBeenCalledWith(
      'increment_rate_limit',
      expect.objectContaining({ p_increment_by: 1 })
    );
  });

  it('passes a custom incrementBy through as p_increment_by', async () => {
    const { checkRateLimit } = await import('@/lib/utils/rate-limit');
    await checkRateLimit({ businessId: 'biz-1', endpoint: 'whatsapp:campaign-send', limit: 500, windowMinutes: 60, incrementBy: 37 });

    expect(rpcMock).toHaveBeenCalledWith(
      'increment_rate_limit',
      expect.objectContaining({ p_increment_by: 37 })
    );
  });

  it('fails closed when the RPC errors', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'connection reset' } });
    const { checkRateLimit } = await import('@/lib/utils/rate-limit');
    const result = await checkRateLimit({ businessId: 'biz-1', endpoint: 'whatsapp:send', limit: 20, windowMinutes: 60 });

    expect(result.allowed).toBe(false);
  });
});
