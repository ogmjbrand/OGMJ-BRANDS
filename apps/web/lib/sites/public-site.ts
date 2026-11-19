import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Read-only data access for the public site-serving path (/sites/...).
 *
 * ACCESS: websites and web_pages are RLS-restricted to business members, so
 * this module does NOT query those tables directly. It calls the
 * public.get_published_page(p_website_id, p_slug) SECURITY DEFINER RPC
 * (packages/db/supabase/migrations/20261119000000_public_site_get_published_page_rpc.sql),
 * which returns only render-relevant columns and itself enforces:
 *   - web_pages.status = 'published'
 *   - websites.status not in archived/deleted/disabled/suspended
 *   - homepage priority when p_slug is null: type 'home', slug home/index/'',
 *     then oldest published page.
 * Sensitive website columns (ssl_certificate, analytics_id, owner_id,
 * settings, ...) are never returned. This module deliberately does NOT use
 * the service-role client.
 *
 * Consequence: a website with no published pages is indistinguishable from a
 * missing one (getPublicWebsite returns null), so its name is not exposed.
 */

export type PublicWebsite = {
  id: string;
  name: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  favicon_url: string | null;
};

export type PublicPage = {
  id: string;
  website_id: string;
  title: string;
  slug: string;
  type: string;
  status: 'published';
  content: { sections?: unknown } | null;
  seo: Record<string, unknown> | null;
  published_at: string | null;
  created_at: string;
};

/** Row shape returned by public.get_published_page. */
type PublishedPageRow = {
  website_id: string;
  website_name: string;
  website_description: string | null;
  website_seo_title: string | null;
  website_seo_description: string | null;
  website_favicon_url: string | null;
  page_id: string;
  page_title: string;
  page_slug: string;
  page_type: string;
  page_content: { sections?: unknown } | null;
  page_seo: Record<string, unknown> | null;
  page_published_at: string | null;
  page_created_at: string;
};

/**
 * One RPC call per (website, slug) per request; generateMetadata and the page
 * component share the result. slug === null means "homepage".
 */
const fetchPublishedPageRow = cache(
  async (websiteId: string, slug: string | null): Promise<PublishedPageRow | null> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase.rpc('get_published_page', {
      p_website_id: websiteId,
      p_slug: slug,
    });

    // An invalid uuid, hidden website, unpublished page, or missing row all
    // resolve to "not found".
    if (error || !data) return null;
    const rows = (Array.isArray(data) ? data : [data]) as PublishedPageRow[];
    return rows[0] ?? null;
  },
);

function toWebsite(row: PublishedPageRow): PublicWebsite {
  return {
    id: row.website_id,
    name: row.website_name,
    description: row.website_description,
    seo_title: row.website_seo_title,
    seo_description: row.website_seo_description,
    favicon_url: row.website_favicon_url,
  };
}

function toPage(row: PublishedPageRow): PublicPage {
  return {
    id: row.page_id,
    website_id: row.website_id,
    title: row.page_title,
    slug: row.page_slug,
    type: row.page_type,
    status: 'published',
    content: row.page_content,
    seo: row.page_seo,
    published_at: row.page_published_at,
    created_at: row.page_created_at,
  };
}

/**
 * Returns the public website fields, or null if the website is missing,
 * hidden, or has no published pages.
 */
export async function getPublicWebsite(websiteId: string): Promise<PublicWebsite | null> {
  const row = await fetchPublishedPageRow(websiteId, null);
  return row ? toWebsite(row) : null;
}

export async function getPublishedPage(websiteId: string, slug: string): Promise<PublicPage | null> {
  const row = await fetchPublishedPageRow(websiteId, slug);
  return row ? toPage(row) : null;
}

/**
 * Picks the homepage among a website's published pages: a page whose type is
 * 'home', else slug 'home' / 'index' / '', else the oldest published page.
 * (Selection happens inside the get_published_page RPC.)
 */
export async function getPublishedHomepage(websiteId: string): Promise<PublicPage | null> {
  const row = await fetchPublishedPageRow(websiteId, null);
  return row ? toPage(row) : null;
}

/** Extracts the sections array from web_pages.content, tolerating bad data. */
export function getPageSections(page: PublicPage): unknown[] {
  const sections = page.content?.sections;
  return Array.isArray(sections) ? sections : [];
}

function seoString(seo: Record<string, unknown> | null, key: string): string | undefined {
  const value = seo?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function buildPageMetadata(website: PublicWebsite, page: PublicPage) {
  const title = seoString(page.seo, 'title') ?? `${page.title} | ${website.seo_title || website.name}`;
  const description =
    seoString(page.seo, 'description') ?? website.seo_description ?? website.description ?? undefined;
  return {
    title,
    description,
    icons: website.favicon_url ? { icon: website.favicon_url } : undefined,
  };
}
