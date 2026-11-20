import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Read-only data access for the public site-serving path (/sites/...).
 *
 * ACCESS: websites and web_pages are RLS-restricted to business members, so
 * this module does NOT query those tables directly. It calls the
 * public.get_published_page(p_website_id text, p_slug text) SECURITY DEFINER
 * RPC (packages/db/supabase/migrations/20261119000000_public_site_get_published_page_rpc.sql),
 * which returns ONLY an allow-list of render fields and itself enforces:
 *   - web_pages.status = 'published'
 *   - websites.status in ('draft', 'published')  (fails closed for anything else)
 *   - web_pages.business_id = websites.business_id (no cross-tenant pages)
 *   - homepage priority when p_slug is null: type 'home', slug home/index/'',
 *     then oldest published page.
 * Sensitive website columns (ssl_certificate, analytics_id, owner_id,
 * business_id, settings, metadata, ...) are never returned. This module
 * deliberately does NOT use the service-role client.
 *
 * Inputs are validated here as well (defence in depth) so malformed URLs
 * never reach the database and always resolve to "not found", never a 500.
 *
 * Consequence: a website with no published pages is indistinguishable from a
 * missing one (getPublicWebsite returns null), so its name is not exposed.
 */

export type PublicWebsite = {
  id: string;
  slug: string | null;
  name: string;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  favicon_url: string | null;
};

export type PublicPage = {
  website_id: string;
  slug: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  sections: unknown[];
};

/** Row shape returned by public.get_published_page — the full allow-list. */
export type PublishedPageRow = {
  website_id: string;
  website_slug: string | null;
  website_name: string;
  website_status: string;
  website_seo_title: string | null;
  website_seo_description: string | null;
  website_favicon_url: string | null;
  page_slug: string;
  page_title: string;
  page_seo_title: string | null;
  page_seo_description: string | null;
  page_sections: unknown;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SLUG_LENGTH = 200;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f]/;

/** True only for a canonical 8-4-4-4-12 hex uuid (same rule as the RPC). */
export function isValidWebsiteId(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/**
 * Decodes a raw [pageSlug] route segment. Returns null (=> 404) for
 * malformed percent-encoding, empty, over-long or control-char slugs, so a
 * bad URL can never throw (URIError) and surface as a 500.
 */
export function parseSlugParam(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!decoded || decoded.length > MAX_SLUG_LENGTH || CONTROL_CHARS_RE.test(decoded)) return null;
  return decoded;
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/**
 * Maps one RPC row to the public website/page shapes. Picks ONLY known
 * allow-listed fields (any extra key the RPC might ever return is dropped),
 * and returns null for a structurally invalid row.
 */
export function mapPublishedPageRow(
  raw: unknown,
): { website: PublicWebsite; page: PublicPage } | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Partial<Record<keyof PublishedPageRow, unknown>>;
  const websiteId = str(row.website_id);
  const name = str(row.website_name);
  const pageSlug = str(row.page_slug);
  const pageTitle = str(row.page_title);
  if (!websiteId || name === null || pageSlug === null || pageTitle === null) return null;

  return {
    website: {
      id: websiteId,
      slug: str(row.website_slug),
      name,
      status: str(row.website_status) ?? 'draft',
      seo_title: str(row.website_seo_title),
      seo_description: str(row.website_seo_description),
      favicon_url: str(row.website_favicon_url),
    },
    page: {
      website_id: websiteId,
      slug: pageSlug,
      title: pageTitle,
      seo_title: str(row.page_seo_title),
      seo_description: str(row.page_seo_description),
      sections: Array.isArray(row.page_sections) ? row.page_sections : [],
    },
  };
}

/**
 * One RPC call per (website, slug) per request; generateMetadata and the page
 * component share the result. slug === null means "homepage".
 */
const fetchPublishedPage = cache(async (websiteId: string, slug: string | null) => {
  if (!isValidWebsiteId(websiteId)) return null;
  if (slug !== null && (slug.length > MAX_SLUG_LENGTH || CONTROL_CHARS_RE.test(slug))) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_published_page', {
    p_website_id: websiteId,
    p_slug: slug,
  });

  // Hidden website, unpublished page, or missing row all resolve to "not
  // found". A DB/network error also 404s rather than leaking details.
  if (error || !data) return null;
  const rows = Array.isArray(data) ? data : [data];
  return mapPublishedPageRow(rows[0]);
});

/**
 * Returns the public website fields, or null if the website is missing,
 * hidden, or has no published pages.
 */
export async function getPublicWebsite(websiteId: string): Promise<PublicWebsite | null> {
  const result = await fetchPublishedPage(websiteId, null);
  return result ? result.website : null;
}

export async function getPublishedPage(websiteId: string, slug: string): Promise<PublicPage | null> {
  const result = await fetchPublishedPage(websiteId, slug);
  return result ? result.page : null;
}

/**
 * Picks the homepage among a website's published pages: a page whose type is
 * 'home', else slug 'home' / 'index' / '', else the oldest published page.
 * (Selection happens inside the get_published_page RPC.)
 */
export async function getPublishedHomepage(websiteId: string): Promise<PublicPage | null> {
  const result = await fetchPublishedPage(websiteId, null);
  return result ? result.page : null;
}

/** The page's sections array (always an array; the RPC normalises bad data). */
export function getPageSections(page: PublicPage): unknown[] {
  return Array.isArray(page.sections) ? page.sections : [];
}

function nonEmpty(value: string | null | undefined): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function buildPageMetadata(website: PublicWebsite, page: PublicPage) {
  const title = nonEmpty(page.seo_title) ?? `${page.title} | ${nonEmpty(website.seo_title) ?? website.name}`;
  const description = nonEmpty(page.seo_description) ?? nonEmpty(website.seo_description);
  return {
    title,
    description,
    icons: isSafeAssetUrl(website.favicon_url) ? { icon: website.favicon_url } : undefined,
  };
}

/** Public assets only from http(s) or site-relative paths (never `//host`). */
export function isSafeAssetUrl(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^(https?:\/\/|\/(?![/\\]))/i.test(value.trim());
}
