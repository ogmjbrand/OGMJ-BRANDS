import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * `isValidSlugFormat` existed in lib/utils/slug.ts but was never actually
 * called anywhere -- page creation relied entirely on the CLIENT always
 * deriving a valid slug via `slugify()`/`uniqueSlug()` first (see
 * PagesPanel.tsx), with nothing stopping a direct/malformed POST. This
 * covers the server-side format check now enforced here too.
 */

let currentUser: { id: string; email: string } | null = { id: 'user-1', email: 'user@example.com' };
let businessAccess: { data: unknown } = { data: { role: 'owner' } };
let websiteRow: { data: unknown } = { data: { id: 'site-1' } };
let existingPage: { data: unknown } = { data: null };
let insertResult: { data: unknown; error: unknown } = { data: { id: 'page-1', slug: 'new-page' }, error: null };

vi.mock('@/lib/auth.server', () => ({
  getCurrentUserServer: () => Promise.resolve(currentUser),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () =>
    Promise.resolve({
      from(table: string) {
        if (table === 'business_users') {
          return { select() { return this; }, eq() { return this; }, async single() { return businessAccess; } };
        }
        if (table === 'websites') {
          return { select() { return this; }, eq() { return this; }, async single() { return websiteRow; } };
        }
        if (table === 'web_pages') {
          return {
            select() { return this; },
            eq() { return this; },
            async maybeSingle() { return existingPage; },
            insert() { return this; },
            async single() { return insertResult; },
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    }),
}));

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('https://ogmjbrands.com/api/builder/pages', { method: 'POST', body: JSON.stringify(body) });
}

describe('POST /api/builder/pages -- slug format validation', () => {
  beforeEach(() => {
    currentUser = { id: 'user-1', email: 'user@example.com' };
    businessAccess = { data: { role: 'owner' } };
    websiteRow = { data: { id: 'site-1' } };
    existingPage = { data: null };
    insertResult = { data: { id: 'page-1', slug: 'new-page' }, error: null };
  });

  it('rejects a malformed slug before checking uniqueness or inserting', async () => {
    const { POST } = await import('@/app/api/builder/pages/route');
    const res = await POST(makeRequest({ businessId: 'biz-1', websiteId: 'site-1', title: 'New', slug: 'Not Valid!' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/lowercase/i);
  });

  it('accepts a valid lowercase-hyphenated slug', async () => {
    const { POST } = await import('@/app/api/builder/pages/route');
    const res = await POST(makeRequest({ businessId: 'biz-1', websiteId: 'site-1', title: 'New', slug: 'new-page' }));
    expect(res.status).toBe(201);
  });
});
