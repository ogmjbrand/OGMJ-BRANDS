import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Regression tests for the website-creation slug bug: production added a
 * NOT NULL, UNIQUE, format-checked `slug` column to `websites` (migration
 * `website_builder_phase1`) but this route's insert never supplied one, so
 * every creation failed with a swallowed not-null violation surfaced only
 * as a generic "Failed to create website" 500.
 */

let currentUser: { id: string; email: string } | null = { id: 'user-1', email: 'user@example.com' };
let accessCheckResult: { data: unknown; error: unknown } = { data: { role: 'owner' }, error: null };
/** Queue of { data, error } results the mocked websites insert returns, one per call, in order. */
let insertResults: Array<{ data: unknown; error: unknown }> = [];
let insertedRows: any[] = [];

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
        if (table === 'websites') {
          return {
            insert(values: any) {
              insertedRows.push(values);
              return {
                select() {
                  return this;
                },
                async single() {
                  const next = insertResults.shift();
                  return next ?? { data: null, error: { code: 'TEST_NO_RESULT_CONFIGURED', message: 'no more results queued' } };
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
  return new NextRequest('https://ogmjbrands.com/api/builder/sites', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/builder/sites -- slug generation', () => {
  beforeEach(() => {
    currentUser = { id: 'user-1', email: 'user@example.com' };
    accessCheckResult = { data: { role: 'owner' }, error: null };
    insertResults = [];
    insertedRows = [];
  });

  it('includes a valid, derived slug when creating a website', async () => {
    insertResults = [{ data: { id: 'site-1', name: 'My Travel Site', slug: 'my-travel-site' }, error: null }];
    const { POST } = await import('@/app/api/builder/sites/route');
    const res = await POST(makeRequest({ businessId: 'biz-1', name: 'My Travel Site' }));
    expect(res.status).toBe(201);
    expect(insertedRows[0].slug).toBe('my-travel-site');
  });

  it('normalizes spaces and special characters into hyphens', async () => {
    insertResults = [{ data: { id: 'site-1' }, error: null }];
    const { POST } = await import('@/app/api/builder/sites/route');
    await POST(makeRequest({ businessId: 'biz-1', name: "AJW Travels & Co. — Int'l!!" }));
    expect(insertedRows[0].slug).toMatch(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/);
    expect(insertedRows[0].slug).not.toMatch(/[^a-z0-9-]/);
    expect(insertedRows[0].slug).not.toMatch(/--/);
  });

  it('rejects a name that has no alphanumeric characters at all, before ever reaching the database', async () => {
    const { POST } = await import('@/app/api/builder/sites/route');
    const res = await POST(makeRequest({ businessId: 'biz-1', name: '!!! --- ???' }));
    expect(res.status).toBe(400);
    expect(insertedRows).toHaveLength(0); // never attempted an insert
  });

  it('truncates an overly long name to the database column\'s length limit, keeping a valid format', async () => {
    insertResults = [{ data: { id: 'site-1' }, error: null }];
    const { POST } = await import('@/app/api/builder/sites/route');
    const longName = 'A'.repeat(200);
    await POST(makeRequest({ businessId: 'biz-1', name: longName }));
    const slug = insertedRows[0].slug as string;
    expect(slug.length).toBeLessThanOrEqual(63);
    expect(slug).toMatch(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/);
  });

  it('ignores a client-supplied slug entirely -- it is always derived server-side from the name', async () => {
    insertResults = [{ data: { id: 'site-1' }, error: null }];
    const { POST } = await import('@/app/api/builder/sites/route');
    await POST(makeRequest({ businessId: 'biz-1', name: 'Real Name', slug: 'totally-different-attacker-slug' }));
    expect(insertedRows[0].slug).toBe('real-name');
  });

  it('retries with a numbered suffix on a slug collision (duplicate website name) and succeeds', async () => {
    insertResults = [
      { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "websites_slug_unique"' } },
      { data: { id: 'site-2', slug: 'my-site-2' }, error: null },
    ];
    const { POST } = await import('@/app/api/builder/sites/route');
    const res = await POST(makeRequest({ businessId: 'biz-1', name: 'My Site' }));
    expect(res.status).toBe(201);
    expect(insertedRows).toHaveLength(2);
    expect(insertedRows[0].slug).toBe('my-site');
    expect(insertedRows[1].slug).toBe('my-site-2');
  });

  it('returns a safe 409 (not a raw database error) when every retry attempt still collides', async () => {
    insertResults = Array.from({ length: 10 }, () => ({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint "websites_slug_unique" DETAIL: Key (slug)=(x) already exists.' },
    }));
    const { POST } = await import('@/app/api/builder/sites/route');
    const res = await POST(makeRequest({ businessId: 'biz-1', name: 'My Site' }));
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error).not.toContain('constraint');
    expect(body.error).not.toContain('DETAIL');
    expect(body.error).not.toContain('websites_slug_unique');
  });

  it('returns a safe 500 (not the raw database error) for a non-collision insert failure', async () => {
    insertResults = [{ data: null, error: { code: '23503', message: 'insert or update on table "websites" violates foreign key constraint "websites_business_id_fkey"' } }];
    const { POST } = await import('@/app/api/builder/sites/route');
    const res = await POST(makeRequest({ businessId: 'biz-1', name: 'My Site' }));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to create website');
    expect(body.error).not.toContain('constraint');
    expect(body.error).not.toContain('fkey');
    expect(insertedRows).toHaveLength(1); // did not retry a non-collision error
  });

  it('still requires authentication', async () => {
    currentUser = null;
    const { POST } = await import('@/app/api/builder/sites/route');
    const res = await POST(makeRequest({ businessId: 'biz-1', name: 'My Site' }));
    expect(res.status).toBe(401);
    expect(insertedRows).toHaveLength(0);
  });

  it('still requires businessId and name', async () => {
    const { POST } = await import('@/app/api/builder/sites/route');
    const res = await POST(makeRequest({ name: 'My Site' }));
    expect(res.status).toBe(400);
    expect(insertedRows).toHaveLength(0);
  });

  it('still enforces business membership/ownership access control', async () => {
    accessCheckResult = { data: null, error: null };
    const { POST } = await import('@/app/api/builder/sites/route');
    const res = await POST(makeRequest({ businessId: 'biz-1', name: 'My Site' }));
    expect(res.status).toBe(403);
    expect(insertedRows).toHaveLength(0);
  });
});
