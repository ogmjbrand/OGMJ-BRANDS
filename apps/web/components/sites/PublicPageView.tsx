import { DocumentRenderer } from '@/components/document/DocumentRenderer';
import { DEFAULT_TOKEN_SET, validateVersionedDocument, type DocumentRoot } from '@/lib/document-model';
import { getPublicDocument, type PublicPage, type PublicPageListEntry, type PublicWebsite } from '@/lib/sites/public-site';
import { PublicSiteNav } from '@/components/sites/PublicNav';

/**
 * Shared shell for a published website page. Server component.
 *
 * Renders through the SAME shared document-model renderer the editor's
 * live preview will eventually use (`DocumentRenderer`, Phase 1) --
 * `migrateLegacyContent` (via `getPublicDocument`) already normalizes
 * either a legacy `{sections:[...]}` page or a current VersionedDocument
 * into the one shape that component knows how to render, so this is a
 * single rendering path rather than a second, ad hoc one.
 */
export function PublicPageView({ website, page, pageList }: { website: PublicWebsite; page: PublicPage; pageList: PublicPageListEntry[] }) {
  const versioned = getPublicDocument(page);
  // Defence in depth -- re-validate even though migrateLegacyContent only
  // ever produces a current, well-formed document; a document that somehow
  // fails validation renders as empty rather than crashing the page.
  const validation = validateVersionedDocument(versioned);
  // documentNodeSchema is `z.ZodType<unknown>` (schema.ts's fix for z.lazy's
  // circular-inference problem with recursive nodes), so Zod's inferred type
  // for `root.children` is `unknown[]` even though safeParse has already
  // confirmed the real DocumentNode shape at runtime -- same gap other
  // DocumentRenderer callers avoid by typing their document some other way
  // (e.g. loadEditablePage's declared DocumentRoot return type).
  const document = validation.success ? (validation.data.document as unknown as DocumentRoot) : null;

  return (
    <div className="min-h-screen bg-obsidian text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
          <a href={`/sites/${website.id}`} className="font-display text-lg font-semibold text-white">
            {website.name}
          </a>
          <PublicSiteNav navigation={website.navigation} pages={pageList} position="main" />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-12">
        {document ? (
          <DocumentRenderer document={document} tokenSet={DEFAULT_TOKEN_SET} />
        ) : (
          <p className="text-white/70">This page has no content yet.</p>
        )}
      </main>
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <PublicSiteNav navigation={website.navigation} pages={pageList} position="footer" />
        </div>
      </footer>
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
