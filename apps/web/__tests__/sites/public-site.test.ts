import { describe, it, expect } from 'vitest';
import {
  getPublicDocument,
  isValidWebsiteId,
  mapPublishedPageRow,
  parseSlugParam,
  isSafeAssetUrl,
  buildPageMetadata,
  type PublishedPageRow,
} from '@/lib/sites/public-site';

function row(overrides: Partial<PublishedPageRow> = {}): PublishedPageRow {
  return {
    website_id: 'aaaaaaaa-2222-4000-8000-000000000001',
    website_slug: 'site-a',
    website_name: 'Site A',
    website_status: 'draft',
    website_seo_title: null,
    website_seo_description: null,
    website_favicon_url: null,
    website_navigation: null,
    page_slug: 'home',
    page_title: 'Home',
    page_seo_title: null,
    page_seo_description: null,
    page_content: { sections: [] },
    page_list: [],
    ...overrides,
  };
}

describe('isValidWebsiteId', () => {
  it('accepts a canonical uuid', () => {
    expect(isValidWebsiteId('aaaaaaaa-2222-4000-8000-000000000001')).toBe(true);
  });
  it('rejects anything else', () => {
    expect(isValidWebsiteId('not-a-uuid')).toBe(false);
    expect(isValidWebsiteId(null)).toBe(false);
    expect(isValidWebsiteId(123)).toBe(false);
  });
});

describe('parseSlugParam', () => {
  it('decodes a normal slug', () => {
    expect(parseSlugParam('about-us')).toBe('about-us');
  });
  it('rejects malformed percent-encoding instead of throwing', () => {
    expect(parseSlugParam('%E0%A4%A')).toBeNull();
  });
  it('rejects empty, over-long, and control-char input', () => {
    expect(parseSlugParam('')).toBeNull();
    expect(parseSlugParam('a'.repeat(201))).toBeNull();
    expect(parseSlugParam('home\n')).toBeNull();
    expect(parseSlugParam(42)).toBeNull();
  });
});

describe('mapPublishedPageRow', () => {
  it('maps a well-formed row', () => {
    const mapped = mapPublishedPageRow(row({ website_navigation: { main: [], footer: [] } }));
    expect(mapped?.website.id).toBe('aaaaaaaa-2222-4000-8000-000000000001');
    expect(mapped?.page.slug).toBe('home');
    expect(mapped?.pageList).toEqual([]);
  });

  it('rejects a structurally invalid row rather than guessing', () => {
    expect(mapPublishedPageRow(null)).toBeNull();
    expect(mapPublishedPageRow([])).toBeNull();
    expect(mapPublishedPageRow(row({ website_id: null as unknown as string }))).toBeNull();
    expect(mapPublishedPageRow(row({ page_slug: undefined as unknown as string }))).toBeNull();
  });

  it('drops malformed nav links instead of rendering a broken one', () => {
    const mapped = mapPublishedPageRow(
      row({ website_navigation: { main: [{ id: 'n1', label: 'ok', target: { type: 'page', pageId: 'p1' } }, { not: 'a link' }] } }),
    );
    expect(mapped?.website.navigation.main).toHaveLength(1);
  });

  it('filters a malformed page_list entry rather than crashing', () => {
    const mapped = mapPublishedPageRow(
      row({ page_list: [{ id: 'p1', slug: 'about', title: 'About' }, { id: 'bad' }] }),
    );
    expect(mapped?.pageList).toEqual([{ id: 'p1', slug: 'about', title: 'About' }]);
  });
});

describe('getPublicDocument', () => {
  it('migrates a legacy sections page into a current VersionedDocument', () => {
    const doc = getPublicDocument({
      website_id: 'w1',
      slug: 'about',
      title: 'About',
      seo_title: null,
      seo_description: null,
      content: { sections: [{ type: 'heading', text: 'Hello' }] },
    });
    expect(doc.schemaVersion).toBeGreaterThanOrEqual(1);
    expect(doc.document.root.children[0]).toMatchObject({ kind: 'heading', text: 'Hello' });
  });

  it('passes a current VersionedDocument through unchanged', () => {
    const current = {
      schemaVersion: 1,
      document: {
        root: { id: 'root', kind: 'root' as const, children: [] },
        tokenSetId: 'default',
        breakpoints: [{ key: 'base', minWidthPx: 0 }],
        components: {},
        assets: {},
      },
    };
    const doc = getPublicDocument({ website_id: 'w1', slug: 'home', title: 'Home', seo_title: null, seo_description: null, content: current });
    expect(doc).toEqual(current);
  });
});

describe('isSafeAssetUrl', () => {
  it('allows http(s) and a single-slash site-relative path', () => {
    expect(isSafeAssetUrl('https://cdn.example.com/a.png')).toBe(true);
    expect(isSafeAssetUrl('/logo.png')).toBe(true);
  });
  it('rejects a protocol-relative or unsafe-scheme URL', () => {
    expect(isSafeAssetUrl('//evil.com/a.png')).toBe(false);
    expect(isSafeAssetUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeAssetUrl(null)).toBe(false);
  });
});

describe('buildPageMetadata', () => {
  const website = {
    id: 'w1', slug: 's', name: 'Site', status: 'draft',
    seo_title: 'Site SEO', seo_description: 'Site desc', favicon_url: '/fav.ico',
    navigation: { main: [], footer: [] },
  };
  it('prefers the page-level SEO title/description', () => {
    const meta = buildPageMetadata(website, {
      website_id: 'w1', slug: 'about', title: 'About', seo_title: 'About SEO', seo_description: 'About desc', content: {},
    });
    expect(meta.title).toBe('About SEO');
    expect(meta.description).toBe('About desc');
    expect(meta.icons).toEqual({ icon: '/fav.ico' });
  });
  it('falls back to "<page title> | <site>" when the page has no SEO title', () => {
    const meta = buildPageMetadata(website, {
      website_id: 'w1', slug: 'about', title: 'About', seo_title: null, seo_description: null, content: {},
    });
    expect(meta.title).toBe('About | Site SEO');
  });
});
