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
  };
}

/** Page-metadata save (title/slug/SEO) -- separate from `saveEditablePage` (document content) so editing one never has to re-send the other. */
export async function savePageSettings(
  pageId: string,
  settings: { title: string; slug: string; seo: { title?: string; description?: string } }
): Promise<void> {
  const res = await fetch(`/api/builder/pages/${pageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || 'Failed to save page settings');
  }
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
export async function saveEditablePage(pageId: string, document: VersionedDocument): Promise<void> {
  const validation = validateVersionedDocument(document);
  if (!validation.success) {
    throw new Error(`Cannot save an invalid document: ${validation.errors.join('; ')}`);
  }

  const res = await fetch(`/api/builder/pages/${pageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: document }),
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || 'Failed to save page');
  }
}
