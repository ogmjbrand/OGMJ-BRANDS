/**
 * Load/save for the visual editor. Deliberately thin: it reuses the
 * existing `/api/builder/pages/[id]` GET+PUT routes as-is (that route
 * already whitelists and passes `content` straight through to the
 * `web_pages.content` jsonb column, so no new route or schema change is
 * needed) and leans on `migrateLegacyContent`, which already handles both a
 * true legacy `{ sections: [...] }` page and an already-saved
 * `VersionedDocument` identically.
 */
import { migrateLegacyContent, validateVersionedDocument, type VersionedDocument } from '@/lib/document-model';

export interface EditablePage {
  id: string;
  websiteId: string;
  businessId: string;
  title: string;
  slug: string;
  seo: { title?: string; description?: string };
  document: VersionedDocument;
  /** The row's `web_pages.version` at load time -- passed back on save as `expectedVersion` for stale-write detection (see the PUT route). */
  version: number;
}

export async function loadEditablePage(pageId: string): Promise<EditablePage> {
  const res = await fetch(`/api/builder/pages/${pageId}`, { method: 'GET' });
  const result = await res.json();
  if (!res.ok || !result.data) {
    throw new Error(result.error || 'Failed to load page');
  }
  const page = result.data;
  return {
    id: page.id,
    websiteId: page.website_id,
    businessId: page.business_id,
    title: page.title ?? '',
    slug: page.slug ?? '',
    seo: { title: page.seo?.title, description: page.seo?.description },
    document: migrateLegacyContent(page.content, page.title ?? 'Untitled page'),
    version: typeof page.version === 'number' ? page.version : 0,
  };
}

/**
 * Page-metadata save (title/slug/SEO) -- separate from `saveEditablePage`
 * (document content) so editing one never has to re-send the other. The
 * PUT route increments `version` on EVERY successful update regardless of
 * which fields changed, so this still has to return the new version: a
 * caller tracking version for the content-save's compare-and-swap (see
 * saveEditablePage) must stay in sync across either kind of save, or its
 * next content save would present a now-stale expectedVersion and get a
 * false-positive conflict.
 */
export async function savePageSettings(
  pageId: string,
  settings: { title: string; slug: string; seo: { title?: string; description?: string } }
): Promise<{ version: number }> {
  const res = await fetch(`/api/builder/pages/${pageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || 'Failed to save page settings');
  }
  return { version: typeof result.data?.version === 'number' ? result.data.version : 0 };
}

export async function loadWebsiteName(websiteId: string): Promise<string> {
  const res = await fetch(`/api/builder/sites/${websiteId}`, { method: 'GET' });
  const result = await res.json();
  if (!res.ok || !result.data) return websiteId;
  return result.data.name ?? websiteId;
}

/**
 * Validates before saving -- never writes a document that wouldn't pass the
 * same check the renderer/schema already enforce for AI- or user-authored
 * content, so a corrupted editor state can't silently become corrupted
 * stored content.
 */
export async function saveEditablePage(pageId: string, document: VersionedDocument, expectedVersion: number): Promise<{ version: number }> {
  const validation = validateVersionedDocument(document);
  if (!validation.success) {
    throw new Error(`Cannot save an invalid document: ${validation.errors.join('; ')}`);
  }

  const res = await fetch(`/api/builder/pages/${pageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: document, expectedVersion }),
  });
  const result = await res.json();
  if (!res.ok) {
    // 409 is a real conflict (see the PUT route) -- surfaced as-is, since
    // its message already tells the caller exactly what happened and what
    // to do (reload before saving again), not a generic failure.
    throw new Error(result.error || 'Failed to save page');
  }
  return { version: typeof result.data?.version === 'number' ? result.data.version : expectedVersion + 1 };
}
