import { createServerClient } from '@/lib/supabase/server';

/**
 * Read-only data access for the public site-serving path (/sites/...).
 *
 * Canonical columns (packages/db/supabase/migrations/20260101000000_remote_baseline.sql):
 *   websites:  id, business_id, name, description, status ('draft' default),
 *              seo_title, seo_description, favicon_url, ...
 *   web_pages: id, website_id, business_id, title, slug, type ('page' default),
 *              status ('draft' default), content jsonb ({ sections: [...] }),
 *              seo jsonb, settings jsonb, published_at, ...
 *
 * NOTE ON ACCESS: this uses the same cookie-aware anon-key server client as the
 * rest of the app. Both tables currently have RLS policies that only allow
 * business members (is_business_member(business_id)), so anonymous visitors
 * will get notFound() until a separate, reviewed change adds a public SELECT
 * policy for published pages. This module deliberately does NOT use the
 * service-role client.
 */

export type PublicWebsite = {
  id: string;
  name: string;
  description: string | null;
  status: string;
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
  status: string;
  content: { sections?: unknown } | null;
  seo: Record<string, unknown> | null;
  published_at: string | null;
  created_at: string;
};

/** Website statuses that should never be served publicly. */
const HIDDEN_WEBSITE_STATUSES = new Set(['archived', 'deleted', 'disabled', 'suspended']);

/** Slugs (or page types) treated as a website's homepage, in priority order. */
const HOMEPAGE_SLUGS = ['home', 'index', ''];

const WEBSITE_COLUMNS =
  'id, name, description, status, seo_title, seo_description, favicon_url';
const PAGE_COLUMNS =
  'id, website_id, title, slug, type, status, content, seo, published_at, created_at';

export async function getPublicWebsite(websiteId: string): Promise<PublicWebsite | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('websites')
    .select(WEBSITE_COLUMNS)
    .eq('id', websiteId)
    .maybeSingle();

  // An invalid uuid, RLS denial, or missing row all resolve to "not found".
  if (error || !data) return null;
  const website = data as unknown as PublicWebsite;
  if (HIDDEN_WEBSITE_STATUSES.has(website.status)) return null;
  return website;
}

export async function getPublishedPage(websiteId: string, slug: string): Promise<PublicPage | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('web_pages')
    .select(PAGE_COLUMNS)
    .eq('website_id', websiteId)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as PublicPage;
}

/**
 * Picks the homepage among a website's published pages: a page whose type is
 * 'home', else slug 'home' / 'index' / '', else the oldest published page.
 */
export async function getPublishedHomepage(websiteId: string): Promise<PublicPage | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('web_pages')
    .select(PAGE_COLUMNS)
    .eq('website_id', websiteId)
    .eq('status', 'published')
    .order('created_at', { ascending: true })
    .limit(100);

  if (error || !data || data.length === 0) return null;
  const pages = data as unknown as PublicPage[];

  const byType = pages.find((p) => p.type === 'home');
  if (byType) return byType;
  for (const slug of HOMEPAGE_SLUGS) {
    const match = pages.find((p) => p.slug === slug);
    if (match) return match;
  }
  return pages[0];
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
