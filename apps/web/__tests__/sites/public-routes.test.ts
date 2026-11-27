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
  cache: <T>(fn: T) => fn,
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

function row(slug: string, sections: unknown) {
  return {
    website_id: WEBSITE_ID,
    website_slug: 'site-a',
    website_name: 'Site A',
    website_status: 'draft',
    website_seo_title: null,
    website_seo_description: null,
    website_favicon_url: null,
    page_slug: slug,
    page_title: slug,
    page_seo_title: null,
    page_seo_description: null,
    page_sections: sections,
  };
}

beforeEach(() => {
  rpcCalls.length = 0;
  rows = {
    '': [row('home', [{ type: 'heading', text: 'Home heading' }])],
    about: [row('about', [{ type: 'text', text: 'About text' }])],
    empty: [row('empty', [])],
  };
});

async function renderSlug(websiteId: string, pageSlug: string) {
  const { default: Page } = await import('@/app/sites/[websiteId]/[pageSlug]/page');
  return renderToStaticMarkup(await Page({ params: { websiteId, pageSlug } }));
}

async function renderHome(websiteId: string) {
  const { default: Page } = await import('@/app/sites/[websiteId]/page');
  return renderToStaticMarkup(await Page({ params: { websiteId } }));
}

describe('/sites/[websiteId]/[pageSlug]', () => {
  it('anonymous visitor sees a published page', async () => {
    const html = await renderSlug(WEBSITE_ID, 'about');
    expect(html).toContain('About text');
    expect(html).toContain('Site A');
  });

  it('page with no sections renders the empty state', async () => {
    const html = await renderSlug(WEBSITE_ID, 'empty');
    expect(html).toContain('This page has no content yet.');
  });

  it('unpublished / unknown slug => 404', async () => {
    await expect(renderSlug(WEBSITE_ID, 'secret-draft')).rejects.toBeInstanceOf(NotFound);
  });

  it('malformed percent-encoding => 404, not a URIError 500', async () => {
    await expect(renderSlug(WEBSITE_ID, '%E0%A4%A')).rejects.toBeInstanceOf(NotFound);
  });

  it('malformed website id => 404 without hitting the database', async () => {
    await expect(renderSlug('not-a-uuid', 'about')).rejects.toBeInstanceOf(NotFound);
    expect(rpcCalls).toHaveLength(0);
  });

  it('website of another / unknown business => 404', async () => {
    await expect(renderSlug('bbbbbbbb-2222-4000-8000-000000000002', 'about')).rejects.toBeInstanceOf(NotFound);
  });

  it('generateMetadata never throws on bad input', async () => {
    const { generateMetadata } = await import('@/app/sites/[websiteId]/[pageSlug]/page');
    await expect(generateMetadata({ params: { websiteId: 'nope', pageSlug: '%' } })).resolves.toEqual({
      title: 'Page not found',
    });
  });
});

describe('/sites/[websiteId]', () => {
  it('renders the homepage', async () => {
    const html = await renderHome(WEBSITE_ID);
    expect(html).toContain('Home heading');
  });

  it('website with no published pages => 404', async () => {
    rows = {};
    await expect(renderHome(WEBSITE_ID)).rejects.toBeInstanceOf(NotFound);
  });

  it('malformed website id => 404', async () => {
    await expect(renderHome('%27%20OR%201%3D1')).rejects.toBeInstanceOf(NotFound);
    expect(rpcCalls).toHaveLength(0);
  });
});
