import { SectionRenderer } from '@/components/sites/SectionRenderer';
import { getPageSections, type PublicPage, type PublicWebsite } from '@/lib/sites/public-site';

/** Shared shell for a published website page. Server component. */
export function PublicPageView({ website, page }: { website: PublicWebsite; page: PublicPage }) {
  return (
    <div className="min-h-screen bg-obsidian text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
          <a href={`/sites/${website.id}`} className="font-display text-lg font-semibold text-white">
            {website.name}
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <SectionRenderer sections={getPageSections(page)} />
      </main>
    </div>
  );
}

export function SiteMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian px-4 text-white">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p className="text-white/70">{message}</p>
      </div>
    </div>
  );
}
