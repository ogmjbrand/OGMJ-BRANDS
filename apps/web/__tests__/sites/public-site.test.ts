import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regression tests for the public site data layer (lib/sites/public-site.ts).
 *
 * The real visibility rules (published-only, hidden websites, cross-tenant
 * pages) live in the get_published_page RPC and are covered at SQL level by
 * packages/db/supabase/tests/public_site_get_published_page.sql. These tests
 * pin the TypeScript side: input validation before the RPC, the exact RPC
 * call, allow-list mapping of the result, and "anything wrong => null (404)".
 */

const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = [];
let rpcResult: { data: unknown; error: unknown } = { data: [], error: null };
let tableAccessed: string | null = null;

// React.cache only exists in the react-server build Next.js vendors; the
// plain react@18 package used by vitest lacks it. Identity shim for tests.
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: <T>(fn: T) => fn,
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () =>
    Promise.resolve({
      rpc(fn: string, args: Record<string, unknown>) {
        rpcCalls.push({ fn, args });
        return Promise.resolve(rpcResult);
      },
      from(table: string) {
        tableAccessed = table;
        throw new Error(`public-site must not query tables directly (tried ${table})`);
      },
    }),
}));

const WEBSITE_ID = 'aaaaaaaa-2222-4000-8000-000000000001';

const publishedRow = {
  website_id: WEBSITE_ID,
  website_slug: 'site-a',
  website_name: 'Site A',
  website_status: 'draft',
  website_seo_title: 'Site A SEO',
  website_seo_description: 'Site A description',
  website_favicon_url: 'https://cdn.example.com/a.ico',
  page_slug: 'about',
  page_title: 'About',
  page_seo_title: null,
  page_seo_description: null,
  page_sections: [{ type: 'heading', text: 'Hi' }],
};

async function load() {
  // fresh module per test so React.cache() never leaks results between tests
  vi.resetModules();
  return import('@/lib/sites/public-site');
}

beforeEach(() => {
  rpcCalls.length = 0;
  rpcResult = { data: [], error: null };
  tableAccessed = null;
});

describe('public-site: anonymous access to a published page', () => {
  it('calls only the get_published_page RPC and returns the page', async () => {
    rpcResult = { data: [publishedRow], error: null };
    const { getPublishedPage } = await load();

    const page = await getPublishedPage(WEBSITE_ID, 'about');

    expect(rpcCalls).toEqual([{ fn: 'get_published_page', args: { p_website_id: WEBSITE_ID, p_slug: 'about' } }]);
    expect(tableAccessed).toBeNull();
    expect(page).toEqual({
      website_id: WEBSITE_ID,
      slug: 'about',
      title: 'About',
      seo_title: null,
      seo_description: null,
      sections: [{ type: 'heading', text: 'Hi' }],
    });
  });

  it('homepage lookup passes p_slug = null', async () => {
    rpcResult = { data: [publishedRow], error: null };
    const { getPublishedHomepage, getPublicWebsite } = await load();

    const website = await getPublicWebsite(WEBSITE_ID);
    const home = await getPublishedHomepage(WEBSITE_ID);

    expect(website?.name).toBe('Site A');
    expect(home?.slug).toBe('about');
    // generateMetadata + page share one cached call per (id, slug)
    expect(rpcCalls.every((c) => c.args.p_slug === null)).toBe(true);
  });
});

describe('public-site: not found cases resolve to null (404), never throw', () => {
  it('unpublished / missing page: RPC returns no rows => null', async () => {
    rpcResult = { data: [], error: null };
    const { getPublishedPage, getPublicWebsite } = await load();
    await expect(getPublishedPage(WEBSITE_ID, 'secret-draft')).resolves.toBeNull();
    await expect(getPublicWebsite(WEBSITE_ID)).resolves.toBeNull();
  });

  it('RPC error => null, error details are not surfaced', async () => {
    rpcResult = { data: null, error: { code: '42501', message: 'permission denied for function' } };
    const { getPublishedPage } = await load();
    await expect(getPublishedPage(WEBSITE_ID, 'about')).resolves.toBeNull();
  });

  it.each([
    ['empty', ''],
    ['not a uuid', 'not-a-uuid'],
    ['sql-injection-looking', "' OR 1=1 --"],
    ['uuid with trailing junk', `${WEBSITE_ID}x`],
    ['uuid without dashes', WEBSITE_ID.replace(/-/g, '')],
  ])('malformed website id (%s) short-circuits before the RPC', async (_label, id) => {
    const { getPublishedPage, getPublicWebsite } = await load();
    await expect(getPublicWebsite(id)).resolves.toBeNull();
    await expect(getPublishedPage(id, 'about')).resolves.toBeNull();
    expect(rpcCalls).toHaveLength(0);
  });

  it('over-long or control-char slug short-circuits before the RPC', async () => {
    const { getPublishedPage } = await load();
    await expect(getPublishedPage(WEBSITE_ID, 'a'.repeat(201))).resolves.toBeNull();
    await expect(getPublishedPage(WEBSITE_ID, 'home\n')).resolves.toBeNull();
    expect(rpcCalls).toHaveLength(0);
  });
});

describe('parseSlugParam', () => {
  it('decodes valid percent-encoding', async () => {
    const { parseSlugParam } = await load();
    expect(parseSlugParam('about')).toBe('about');
    expect(parseSlugParam('caf%C3%A9')).toBe('café');
  });

  it('returns null instead of throwing on malformed encoding (no 500)', async () => {
    const { parseSlugParam } = await load();
    expect(() => parseSlugParam('%E0%A4%A')).not.toThrow();
    expect(parseSlugParam('%E0%A4%A')).toBeNull();
    expect(parseSlugParam('%')).toBeNull();
  });

  it('rejects empty, over-long, control-char and non-string input', async () => {
    const { parseSlugParam } = await load();
    expect(parseSlugParam('')).toBeNull();
    expect(parseSlugParam('a'.repeat(201))).toBeNull();
    expect(parseSlugParam('home%0A')).toBeNull();
    expect(parseSlugParam(undefined)).toBeNull();
  });
});

describe('mapPublishedPageRow: allow-list mapping', () => {
  it('drops any non-approved field the RPC might ever return', async () => {
    const { mapPublishedPageRow } = await load();
    const mapped = mapPublishedPageRow({
      ...publishedRow,
      ssl_certificate: 'SECRET-SSL',
      analytics_id: 'SECRET-GA',
      owner_id: 'SECRET-OWNER',
      business_id: 'SECRET-BUSINESS',
      settings: { secret: 'SECRET-SETTINGS' },
      metadata: { secret: 'SECRET-METADATA' },
      page_content: { draft_notes: 'SECRET-CONTENT' },
    });
    expect(mapped).not.toBeNull();
    expect(JSON.stringify(mapped)).not.toContain('SECRET');
    expect(Object.keys(mapped!.website).sort()).toEqual(
      ['favicon_url', 'id', 'name', 'seo_description', 'seo_title', 'slug', 'status'].sort(),
    );
    expect(Object.keys(mapped!.page).sort()).toEqual(
      ['sections', 'seo_description', 'seo_title', 'slug', 'title', 'website_id'].sort(),
    );
  });

  it('normalises non-array sections to [] (empty state)', async () => {
    const { mapPublishedPageRow } = await load();
    expect(mapPublishedPageRow({ ...publishedRow, page_sections: 'oops' })?.page.sections).toEqual([]);
    expect(mapPublishedPageRow({ ...publishedRow, page_sections: null })?.page.sections).toEqual([]);
    expect(mapPublishedPageRow({ ...publishedRow, page_sections: { a: 1 } })?.page.sections).toEqual([]);
  });

  it('rejects structurally invalid rows', async () => {
    const { mapPublishedPageRow } = await load();
    expect(mapPublishedPageRow(null)).toBeNull();
    expect(mapPublishedPageRow([])).toBeNull();
    expect(mapPublishedPageRow('row')).toBeNull();
    expect(mapPublishedPageRow({ ...publishedRow, website_id: null })).toBeNull();
    expect(mapPublishedPageRow({ ...publishedRow, page_slug: 42 })).toBeNull();
  });
});

describe('buildPageMetadata', () => {
  it('prefers page SEO, falls back to site SEO / name', async () => {
    const { mapPublishedPageRow, buildPageMetadata } = await load();
    const { website, page } = mapPublishedPageRow(publishedRow)!;
    expect(buildPageMetadata(website, page)).toEqual({
      title: 'About | Site A SEO',
      description: 'Site A description',
      icons: { icon: 'https://cdn.example.com/a.ico' },
    });
    const withSeo = { ...page, seo_title: 'Custom', seo_description: 'Custom desc' };
    expect(buildPageMetadata({ ...website, seo_title: null }, withSeo)).toMatchObject({
      title: 'Custom',
      description: 'Custom desc',
    });
    expect(buildPageMetadata({ ...website, seo_title: '  ' }, page).title).toBe('About | Site A');
  });

  it('drops unsafe favicon URLs', async () => {
    const { mapPublishedPageRow, buildPageMetadata } = await load();
    const { website, page } = mapPublishedPageRow(publishedRow)!;
    for (const bad of ['javascript:alert(1)', '//evil.example/x.ico', 'data:image/png;base64,AAAA']) {
      expect(buildPageMetadata({ ...website, favicon_url: bad }, page).icons).toBeUndefined();
    }
    expect(buildPageMetadata({ ...website, favicon_url: '/favicon.ico' }, page).icons).toEqual({ icon: '/favicon.ico' });
  });
});
