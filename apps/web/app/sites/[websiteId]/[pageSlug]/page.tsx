import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicPageView } from '@/components/sites/PublicPageView';
import {
  buildPageMetadata,
  getPublicWebsiteAndPage,
  getPublishedPageList,
  parseSlugParam,
} from '@/lib/sites/public-site';

// Content is edited live in the builder; never serve a stale static copy.
export const dynamic = 'force-dynamic';

type Params = { params: { websiteId: string; pageSlug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const slug = parseSlugParam(params.pageSlug);
  if (!slug) return { title: 'Page not found' };
  const result = await getPublicWebsiteAndPage(params.websiteId, slug);
  if (!result) return { title: 'Page not found' };
  return buildPageMetadata(result.website, result.page);
}

export default async function PublicSitePage({ params }: Params) {
  // Malformed percent-encoding / invalid slug => 404, never a 500.
  const slug = parseSlugParam(params.pageSlug);
  if (!slug) notFound();

  const result = await getPublicWebsiteAndPage(params.websiteId, slug);
  if (!result) notFound();
  const { website, page } = result;

  const pageList = await getPublishedPageList(website.id, slug);
  return <PublicPageView website={website} page={page} pageList={pageList} />;
}
