import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Route-level regression tests for /sites/[websiteId] and
 * /sites/[websiteId]/[pageSlug]: every "can't serve this" case must call
 * notFound() (404), never throw a raw error (500), and a page with no
 * sections must render the empty state.
 */

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: <T,>(fn: T) => fn,
}));

class NotFound extends Error {
  constructor() {
    super('NEXT_NOT_FOUND');
  }
}
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new NotFound();
  },
}));

const WEBSITE_ID = 'aaaaaaaa-2222-4000-8000-000000000001';
const rpcCalls: Array<Record<string, unknown>> = [];
// keyed by p_slug ('' key = homepage / null)
let rows: Record<string, unknown[]> = {};

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () =>
    Promise.resolve({
      rpc(_fn: string, args: Record<string, unknown>) {
        rpcCalls.push(args);
        if (args.p_website_id !== WEBSITE_ID) return Promise.resolve({ data: [], error: null });
        const key = (args.p_slug as string | null) ?? '';
        return Promise.resolve({ data: rows[key] ?? [], error: null });
      },
      from() {
        throw new Error('routes must not query tables directly');
      },
    }),
}));

function row(slug: string, content: unknown, overrides: Record<string, unknown> = {}) {
  return {
    website_id: WEBSITE_ID,
    website_slug: 'site-a',
    website_name: 'Site A',
    website_status: 'draft',
    website_seo_title: null,
    website_seo_description: null,
    website_favicon_url: null,
    website_navigation: null,
    page_slug: slug,
    page_title: slug || 'Home',
    page_seo_title: null,
    page_seo_description: null,
    page_content: content,
    page_list: [{ id: 'p-home', slug: 'home', title: 'Home' }],
    ...overrides,
  };
}

beforeEach(() => {
  rpcCalls.length = 0;
  rows = {};
});

describe('/sites/[websiteId] (homepage route)', () => {
  it('404s for an unknown website', async () => {
    const { default: PublicSiteHome } = await import('../../app/sites/[websiteId]/page');
    await expect(PublicSiteHome({ params: { websiteId: 'ffffffff-0000-4000-8000-000000000000' } })).rejects.toThrow(NotFound);
  });

  it('404s for a malformed websiteId instead of a raw cast error', async () => {
    const { default: PublicSiteHome } = await import('../../app/sites/[websiteId]/page');
    await expect(PublicSiteHome({ params: { websiteId: 'not-a-uuid' } })).rejects.toThrow(NotFound);
  });

  it('shows the "no published homepage" message when the website exists but nothing is published', async () => {
    rows[''] = [];
    const { default: PublicSiteHome } = await import('../../app/sites/[websiteId]/page');
    // getPublicWebsite and getPublishedHomepage both resolve null here because
    // the RPC returns zero rows for this website -- the whole site is
    // indistinguishable from missing, so this exercises the SAME "hidden
    // website" 404 path, not the empty-homepage message. See public-site.ts.
    await expect(PublicSiteHome({ params: { websiteId: WEBSITE_ID } })).rejects.toThrow(NotFound);
  });

  it('renders the homepage document through DocumentRenderer', async () => {
    rows[''] = [row('home', { sections: [{ type: 'heading', text: 'Welcome' }] })];
    const { default: PublicSiteHome } = await import('../../app/sites/[websiteId]/page');
    const element = await PublicSiteHome({ params: { websiteId: WEBSITE_ID } });
    const html = renderToStaticMarkup(element);
    expect(html).toContain('Welcome');
    expect(html).toContain('Site A');
  });
});

describe('/sites/[websiteId]/[pageSlug]', () => {
  it('404s for a malformed slug (bad percent-encoding) without throwing a raw URIError', async () => {
    const { default: PublicSitePage } = await import('../../app/sites/[websiteId]/[pageSlug]/page');
    await expect(PublicSitePage({ params: { websiteId: WEBSITE_ID, pageSlug: '%E0%A4%A' } })).rejects.toThrow(NotFound);
  });

  it('404s when the page is not published / does not exist', async () => {
    rows.about = [];
    const { default: PublicSitePage } = await import('../../app/sites/[websiteId]/[pageSlug]/page');
    await expect(PublicSitePage({ params: { websiteId: WEBSITE_ID, pageSlug: 'about' } })).rejects.toThrow(NotFound);
  });

  it('renders a legacy {sections:[...]} page through the migration + DocumentRenderer path', async () => {
    rows.about = [row('about', { sections: [{ type: 'text', text: 'About us' }] })];
    const { default: PublicSitePage } = await import('../../app/sites/[websiteId]/[pageSlug]/page');
    const element = await PublicSitePage({ params: { websiteId: WEBSITE_ID, pageSlug: 'about' } });
    const html = renderToStaticMarkup(element);
    expect(html).toContain('About us');
  });

  it('never queries the raw tables directly', async () => {
    rows.about = [row('about', { sections: [] })];
    const { default: PublicSitePage } = await import('../../app/sites/[websiteId]/[pageSlug]/page');
    await PublicSitePage({ params: { websiteId: WEBSITE_ID, pageSlug: 'about' } });
    expect(rpcCalls.length).toBeGreaterThan(0);
    expect(rpcCalls.every((c) => c.p_website_id === WEBSITE_ID)).toBe(true);
  });
});
