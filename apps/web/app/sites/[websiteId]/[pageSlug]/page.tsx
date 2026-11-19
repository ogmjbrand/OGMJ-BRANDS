import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicPageView } from '@/components/sites/PublicPageView';
import {
  buildPageMetadata,
  getPublicWebsite,
  getPublishedPage,
  parseSlugParam,
} from '@/lib/sites/public-site';

// Content is edited live in the builder; never serve a stale static copy.
export const dynamic = 'force-dynamic';

type Params = { params: { websiteId: string; pageSlug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const slug = parseSlugParam(params.pageSlug);
  if (!slug) return { title: 'Page not found' };
  const website = await getPublicWebsite(params.websiteId);
  if (!website) return { title: 'Page not found' };
  const page = await getPublishedPage(website.id, slug);
  if (!page) return { title: 'Page not found' };
  return buildPageMetadata(website, page);
}

export default async function PublicSitePage({ params }: Params) {
  // Malformed percent-encoding / invalid slug => 404, never a 500.
  const slug = parseSlugParam(params.pageSlug);
  if (!slug) notFound();

  const website = await getPublicWebsite(params.websiteId);
  if (!website) notFound();

  const page = await getPublishedPage(website.id, slug);
  if (!page) notFound();

  return <PublicPageView website={website} page={page} />;
}
