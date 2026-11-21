import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Stale-write / conflict-detection tests for PUT /api/builder/pages/[id]
 * (Phase 3 audit finding: this route previously had no protection at all
 * against two editors overwriting each other's save). Opt-in via
 * `expectedVersion` in the body -- a caller that omits it keeps the exact
 * prior unconditional-overwrite behavior, which the last test here proves.
 */

let currentUser: { id: string; email: string } | null = { id: 'user-1', email: 'user@example.com' };
let accessCheckResult: { data: unknown; error: unknown } = { data: { role: 'owner' }, error: null };
let pageRow: { business_id: string; version: number } | null = { business_id: 'biz-1', version: 3 };
/** Queue of { data, error } the mocked UPDATE's final .single() returns, one per call. */
let updateResults: Array<{ data: unknown; error: unknown }> = [];
let updateCalls: Array<{ values: any; versionFilter: number | undefined }> = [];

vi.mock('@/lib/auth.server', () => ({
  getCurrentUserServer: () => Promise.resolve(currentUser),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () =>
    Promise.resolve({
      from(table: string) {
        if (table === 'business_users') {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            async single() {
              return accessCheckResult;
            },
          };
        }
        if (table === 'web_pages') {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            async single() {
              return pageRow ? { data: pageRow, error: null } : { data: null, error: { code: 'PGRST116' } };
            },
            update(values: any) {
              const call = { values, versionFilter: undefined as number | undefined };
              updateCalls.push(call);
              return {
                eq(col: string, val: any) {
                  if (col === 'version') call.versionFilter = val;
                  return this;
                },
                select() {
                  return this;
                },
                async single() {
                  const next = updateResults.shift();
                  return next ?? { data: null, error: { code: 'TEST_NO_RESULT_CONFIGURED' } };
                },
              };
            },
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    }),
}));

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('https://ogmjbrands.com/api/builder/pages/page-1', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

describe('PUT /api/builder/pages/[id] -- stale-write detection', () => {
  beforeEach(() => {
    currentUser = { id: 'user-1', email: 'user@example.com' };
    accessCheckResult = { data: { role: 'owner' }, error: null };
    pageRow = { business_id: 'biz-1', version: 3 };
    updateResults = [];
    updateCalls = [];
  });

  it('with a matching expectedVersion, updates and returns the incremented version', async () => {
    updateResults = [{ data: { id: 'page-1', title: 'New title', version: 4 }, error: null }];
    const { PUT } = await import('@/app/api/builder/pages/[id]/route');
    const res = await PUT(makeRequest({ title: 'New title', expectedVersion: 3 }), { params: Promise.resolve({ id: 'page-1' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.version).toBe(4);
    expect(updateCalls[0].versionFilter).toBe(3);
    expect(updateCalls[0].values.version).toBe(4);
  });

  it('with a STALE expectedVersion (someone else saved since), returns 409 and never reports success', async () => {
    // The mocked CAS condition (version = expectedVersion) matches nothing,
    // so the final .single() sees zero rows -- exactly what a real
    // Postgres `.update().eq(...)` guard produces when the WHERE clause
    // excludes every row.
    updateResults = [{ data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } }];
    const { PUT } = await import('@/app/api/builder/pages/[id]/route');
    const res = await PUT(makeRequest({ title: 'New title', expectedVersion: 1 }), { params: Promise.resolve({ id: 'page-1' }) });
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/changed by someone else/i);
    expect(updateCalls[0].versionFilter).toBe(1); // the stale value the caller actually sent, not silently corrected
  });

  it('a client-supplied "version" field in the body is ignored -- only the server-computed increment is ever written', async () => {
    updateResults = [{ data: { id: 'page-1', version: 4 }, error: null }];
    const { PUT } = await import('@/app/api/builder/pages/[id]/route');
    await PUT(makeRequest({ title: 'x', expectedVersion: 3, version: 999 }), { params: Promise.resolve({ id: 'page-1' }) });
    expect(updateCalls[0].values.version).toBe(4); // not 999
  });

  it('WITHOUT expectedVersion (legacy caller), still updates unconditionally -- no behavior change for existing callers', async () => {
    updateResults = [{ data: { id: 'page-1', title: 'New title', version: 4 }, error: null }];
    const { PUT } = await import('@/app/api/builder/pages/[id]/route');
    const res = await PUT(makeRequest({ title: 'New title' }), { params: Promise.resolve({ id: 'page-1' }) });
    expect(res.status).toBe(200);
    expect(updateCalls[0].versionFilter).toBeUndefined(); // no .eq('version', ...) guard was ever added
  });

  it('still enforces business membership/ownership access control before any update', async () => {
    accessCheckResult = { data: null, error: null };
    const { PUT } = await import('@/app/api/builder/pages/[id]/route');
    const res = await PUT(makeRequest({ title: 'x', expectedVersion: 3 }), { params: Promise.resolve({ id: 'page-1' }) });
    expect(res.status).toBe(403);
    expect(updateCalls).toHaveLength(0);
  });

  it('still requires authentication', async () => {
    currentUser = null;
    const { PUT } = await import('@/app/api/builder/pages/[id]/route');
    const res = await PUT(makeRequest({ title: 'x' }), { params: Promise.resolve({ id: 'page-1' }) });
    expect(res.status).toBe(401);
    expect(updateCalls).toHaveLength(0);
  });
});
