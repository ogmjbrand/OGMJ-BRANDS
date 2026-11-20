import { describe, expect, it, vi, beforeEach } from 'vitest';

let selectResult: { data: unknown; error: unknown } = { data: null, error: null };
let upsertCalls: Array<{ row: unknown; options: unknown }> = [];

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from(table: string) {
      if (table !== 'rate_limits') throw new Error(`unexpected table ${table}`);
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          return selectResult;
        },
        async upsert(row: unknown, options: unknown) {
          upsertCalls.push({ row, options });
          return { data: null, error: null };
        },
      };
    },
  }),
}));

import { checkAndIncrementRateLimit, DEFAULT_RATE_LIMIT_PER_HOUR } from '@/lib/ai/rateLimit';

beforeEach(() => {
  selectResult = { data: null, error: null };
  upsertCalls = [];
});

describe('checkAndIncrementRateLimit', () => {
  it('allows the first request in a new window and upserts count=1', async () => {
    const result = await checkAndIncrementRateLimit('biz-1', 'ai/business-assistant', 'user-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(DEFAULT_RATE_LIMIT_PER_HOUR - 1);
    expect(upsertCalls).toHaveLength(1);
    expect((upsertCalls[0].row as { count: number }).count).toBe(1);
    expect((upsertCalls[0].options as { onConflict: string }).onConflict).toBe('business_id,endpoint,window_start');
  });

  it('increments from the existing count within the same window', async () => {
    selectResult = { data: { count: 5 }, error: null };
    const result = await checkAndIncrementRateLimit('biz-1', 'ai/business-assistant', 'user-1');
    expect(result.allowed).toBe(true);
    expect((upsertCalls[0].row as { count: number }).count).toBe(6);
  });

  it('denies and does NOT increment once the limit is reached', async () => {
    selectResult = { data: { count: 10 }, error: null };
    const result = await checkAndIncrementRateLimit('biz-1', 'ai/business-assistant', 'user-1', 10);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(upsertCalls).toHaveLength(0); // never incremented past the limit
  });

  it('respects a custom limit', async () => {
    selectResult = { data: { count: 2 }, error: null };
    const result = await checkAndIncrementRateLimit('biz-1', 'ai/business-assistant', 'user-1', 3);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
    const denied = await (async () => {
      selectResult = { data: { count: 3 }, error: null };
      return checkAndIncrementRateLimit('biz-1', 'ai/business-assistant', 'user-1', 3);
    })();
    expect(denied.allowed).toBe(false);
  });

  it('always targets the rate_limits table (the mock throws on any other table name)', async () => {
    await expect(checkAndIncrementRateLimit('biz-2', 'ai/other-endpoint', 'user-2')).resolves.toMatchObject({ allowed: true });
  });

  it('writes the given business_id, endpoint, and identifier onto the row', async () => {
    await checkAndIncrementRateLimit('biz-3', 'ai/business-assistant', 'user-9');
    expect(upsertCalls[0].row).toMatchObject({ business_id: 'biz-3', endpoint: 'ai/business-assistant', identifier: 'user-9' });
  });
});
