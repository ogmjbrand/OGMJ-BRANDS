import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicPageView, SiteMessage } from '@/components/sites/PublicPageView';
import { buildPageMetadata, getPublicWebsite, getPublishedHomepage, getPublishedPageList } from '@/lib/sites/public-site';

export const dynamic = 'force-dynamic';

type Params = { params: { websiteId: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const website = await getPublicWebsite(params.websiteId);
  if (!website) return { title: 'Page not found' };
  const page = await getPublishedHomepage(website.id);
  if (!page) return { title: website.seo_title || website.name };
  return buildPageMetadata(website, page);
}

/** Website root: renders the homepage (type 'home', slug home/index, or oldest published page). */
export default async function PublicSiteHome({ params }: Params) {
  const website = await getPublicWebsite(params.websiteId);
  if (!website) notFound();

  const page = await getPublishedHomepage(website.id);
  if (!page) {
    return (
      <SiteMessage
        title={website.name}
        message="This website has no published homepage yet."
      />
    );
  }

  const pageList = await getPublishedPageList(website.id, null);
  return <PublicPageView website={website} page={page} pageList={pageList} />;
}
