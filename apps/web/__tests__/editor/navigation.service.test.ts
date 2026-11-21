import { describe, expect, it, vi, afterEach } from 'vitest';
import { isSafeNavTarget, loadNavigation, newNavLink, resolveNavHref, saveNavigation } from '@/lib/services/navigation.service';
import type { Page } from '@/lib/services/builder.service';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

function mockFetchSequence(responses: Array<{ status: number; body: unknown }>) {
  let call = 0;
  global.fetch = vi.fn().mockImplementation(async () => {
    const r = responses[Math.min(call, responses.length - 1)];
    call++;
    return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.body };
  }) as unknown as typeof fetch;
}

function samplePages(): Page[] {
  return [
    { id: 'page-1', websiteId: 'site-1', title: 'Home', slug: 'home', sections: [], status: 'published', createdAt: '', updatedAt: '' },
    { id: 'page-2', websiteId: 'site-1', title: 'About', slug: 'about', sections: [], status: 'draft', createdAt: '', updatedAt: '' },
  ];
}

describe('loadNavigation', () => {
  it('parses settings.navigation from the site response', async () => {
    mockFetchSequence([
      { status: 200, body: { data: { id: 'site-1', settings: { navigation: { main: [{ id: 'n1', label: 'Home', target: { type: 'page', pageId: 'page-1' } }], footer: [] } } } } },
    ]);
    const nav = await loadNavigation('site-1');
    expect(nav.main).toHaveLength(1);
    expect(nav.main[0].label).toBe('Home');
    expect(nav.footer).toEqual([]);
  });

  it('defaults to empty menus when settings.navigation is absent', async () => {
    mockFetchSequence([{ status: 200, body: { data: { id: 'site-1', settings: {} } } }]);
    const nav = await loadNavigation('site-1');
    expect(nav).toEqual({ main: [], footer: [] });
  });

  it('drops malformed entries rather than throwing', async () => {
    mockFetchSequence([
      {
        status: 200,
        body: { data: { id: 'site-1', settings: { navigation: { main: [{ id: 'ok', label: 'Fine', target: { type: 'page', pageId: 'page-1' } }, { bogus: true }, 'not an object'], footer: null } } } },
      },
    ]);
    const nav = await loadNavigation('site-1');
    expect(nav.main).toHaveLength(1);
    expect(nav.main[0].id).toBe('ok');
    expect(nav.footer).toEqual([]);
  });

  it('throws with the server-provided message on a failed load', async () => {
    mockFetchSequence([{ status: 404, body: { error: 'Website not found' } }]);
    await expect(loadNavigation('missing')).rejects.toThrow('Website not found');
  });
});

describe('saveNavigation', () => {
  it('merges navigation into existing settings rather than replacing them', async () => {
    mockFetchSequence([
      { status: 200, body: { data: { id: 'site-1', settings: { analyticsId: 'UA-1' } } } }, // GET (read existing settings)
      { status: 200, body: { data: { id: 'site-1' } } }, // PUT
    ]);
    await saveNavigation('site-1', { main: [], footer: [] });
    const putCall = (global.fetch as any).mock.calls[1];
    const body = JSON.parse(putCall[1].body);
    expect(body.settings.analyticsId).toBe('UA-1'); // preserved
    expect(body.settings.navigation).toEqual({ main: [], footer: [] });
  });

  it('throws with the server-provided message on a failed save', async () => {
    mockFetchSequence([
      { status: 200, body: { data: { id: 'site-1', settings: {} } } },
      { status: 500, body: { error: 'Failed to update website' } },
    ]);
    await expect(saveNavigation('site-1', { main: [], footer: [] })).rejects.toThrow('Failed to update website');
  });
});

describe('resolveNavHref', () => {
  it("resolves a page link to the page's CURRENT slug", () => {
    const link = newNavLink('About', { type: 'page', pageId: 'page-2' });
    expect(resolveNavHref(link, samplePages())).toBe('/about');
  });

  it('returns undefined for a page link whose target page no longer exists (dangling pageId)', () => {
    const link = newNavLink('Deleted', { type: 'page', pageId: 'page-does-not-exist' });
    expect(resolveNavHref(link, samplePages())).toBeUndefined();
  });

  it('resolves an external link through the same safeHref allowlist the document model uses', () => {
    const safe = newNavLink('Docs', { type: 'external', href: 'https://example.com/docs' });
    expect(resolveNavHref(safe, samplePages())).toBe('https://example.com/docs');

    const unsafe = newNavLink('Bad', { type: 'external', href: 'javascript:alert(1)' });
    expect(resolveNavHref(unsafe, samplePages())).toBeUndefined();
  });

  it('tracks a page rename automatically -- the link stores pageId, never a captured slug', () => {
    const link = newNavLink('Home', { type: 'page', pageId: 'page-1' });
    const pages = samplePages();
    expect(resolveNavHref(link, pages)).toBe('/home');
    const renamed = pages.map((p) => (p.id === 'page-1' ? { ...p, slug: 'homepage' } : p));
    expect(resolveNavHref(link, renamed)).toBe('/homepage');
  });
});

describe('isSafeNavTarget', () => {
  it('always accepts a page target (pageId existence is checked separately by resolveNavHref)', () => {
    expect(isSafeNavTarget({ type: 'page', pageId: 'anything' })).toBe(true);
  });

  it('rejects an unsafe external scheme', () => {
    expect(isSafeNavTarget({ type: 'external', href: 'javascript:alert(1)' })).toBe(false);
    expect(isSafeNavTarget({ type: 'external', href: 'data:text/html,<script>' })).toBe(false);
  });

  it('accepts a safe external href', () => {
    expect(isSafeNavTarget({ type: 'external', href: 'https://example.com' })).toBe(true);
    expect(isSafeNavTarget({ type: 'external', href: '/relative-path' })).toBe(true);
  });
});

describe('newNavLink', () => {
  it('mints a fresh, unique id each time', () => {
    const a = newNavLink('A', { type: 'external', href: '/' });
    const b = newNavLink('B', { type: 'external', href: '/' });
    expect(a.id).not.toBe(b.id);
  });
});
