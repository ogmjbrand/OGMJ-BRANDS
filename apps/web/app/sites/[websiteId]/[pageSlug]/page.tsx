import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicPageView } from '@/components/sites/PublicPageView';
import { buildPageMetadata, getPublicWebsite, getPublishedPage } from '@/lib/sites/public-site';

// Content is edited live in the builder; never serve a stale static copy.
export const dynamic = 'force-dynamic';

type Params = { params: { websiteId: string; pageSlug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const website = await getPublicWebsite(params.websiteId);
  if (!website) return { title: 'Page not found' };
  const page = await getPublishedPage(website.id, decodeURIComponent(params.pageSlug));
  if (!page) return { title: 'Page not found' };
  return buildPageMetadata(website, page);
}

export default async function PublicSitePage({ params }: Params) {
  const website = await getPublicWebsite(params.websiteId);
  if (!website) notFound();

  const page = await getPublishedPage(website.id, decodeURIComponent(params.pageSlug));
  if (!page) notFound();

  return <PublicPageView website={website} page={page} />;
}
