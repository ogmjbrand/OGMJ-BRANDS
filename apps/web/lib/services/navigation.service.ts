/**
 * Site-wide navigation (main + footer menus) -- lives in `websites.settings`
 * (jsonb), NOT in any page's document. That's deliberate: nav is shared
 * across every page under a website, so it can't live inside a single
 * page's `content`/document history, and it reuses the EXISTING, already-
 * whitelisted `settings` column on `/api/builder/sites/[id]` (see that
 * route's PUT handler) rather than a new column or route.
 *
 * SYNC WITH REAL PAGES: an internal link stores a `pageId`, never a
 * captured href/slug -- `resolveNavHref` looks the page's CURRENT slug up
 * from the live pages list every time a link is resolved, so renaming a
 * page's slug can never leave a stale nav link behind. (There is no public
 * site renderer yet to consume this -- that's PR #72's territory, which
 * this Phase 3 pass does not touch or bypass. This module only builds the
 * real, functional management surface; see the Phase 3 report for that
 * limitation.)
 */
import { safeHref } from '@/lib/document-model';
import { freshNodeId } from '@/lib/editor/createDefaultNode';
import type { Page } from './builder.service';

export type NavLinkTarget = { type: 'page'; pageId: string } | { type: 'external'; href: string };

export interface NavLink {
  id: string;
  label: string;
  target: NavLinkTarget;
  /** One level of nesting -- a dropdown. Deliberately not recursive: multi-level mega-menus are out of scope for this pass. */
  children?: NavLink[];
}

export interface SiteNavigation {
  main: NavLink[];
  footer: NavLink[];
}

export function emptyNavigation(): SiteNavigation {
  return { main: [], footer: [] };
}

function isNavLink(value: unknown): value is NavLink {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || typeof v.label !== 'string' || !v.target || typeof v.target !== 'object') return false;
  const t = v.target as Record<string, unknown>;
  if (t.type === 'page' && typeof t.pageId === 'string') return true;
  if (t.type === 'external' && typeof t.href === 'string') return true;
  return false;
}

/** Defensive parse of whatever `settings.navigation` currently holds -- malformed or absent data is treated as empty rather than thrown. */
function parseNavigation(raw: unknown): SiteNavigation {
  if (!raw || typeof raw !== 'object') return emptyNavigation();
  const v = raw as Record<string, unknown>;
  const clean = (list: unknown): NavLink[] => (Array.isArray(list) ? list.filter(isNavLink).map((l) => ({ ...l, children: Array.isArray(l.children) ? l.children.filter(isNavLink) : undefined })) : []);
  return { main: clean(v.main), footer: clean(v.footer) };
}

export function newNavLink(label: string, target: NavLinkTarget): NavLink {
  return { id: freshNodeId('nav'), label, target };
}

/** Rejects an unsafe external URL (javascript:, data:, etc.) before it's ever persisted -- same allow-list the document model's own links already go through, applied here in anticipation of a future public renderer. */
export function isSafeNavTarget(target: NavLinkTarget): boolean {
  return target.type === 'page' ? true : safeHref(target.href) !== undefined;
}

/** The href a link should resolve to right now, given the CURRENT slug of whatever page it targets -- undefined for a dangling pageId (the page was deleted) or an unsafe external href, so a caller can render a disabled/placeholder state instead of a broken or unsafe link. */
export function resolveNavHref(link: NavLink, pages: Page[]): string | undefined {
  const target = link.target;
  if (target.type === 'external') return safeHref(target.href);
  const page = pages.find((p) => p.id === target.pageId);
  return page ? `/${page.slug}` : undefined;
}

export async function loadNavigation(websiteId: string): Promise<SiteNavigation> {
  const res = await fetch(`/api/builder/sites/${websiteId}`, { method: 'GET' });
  const result = await res.json();
  if (!res.ok || !result.data) {
    throw new Error(result.error || 'Failed to load site');
  }
  return parseNavigation(result.data.settings?.navigation);
}

/** Merges into `settings` rather than replacing it -- `settings` can hold other keys this module knows nothing about, and a blind overwrite would silently discard them. */
export async function saveNavigation(websiteId: string, navigation: SiteNavigation): Promise<void> {
  const current = await fetch(`/api/builder/sites/${websiteId}`, { method: 'GET' });
  const currentResult = await current.json();
  const existingSettings = (currentResult.data?.settings && typeof currentResult.data.settings === 'object' ? currentResult.data.settings : {}) as Record<string, unknown>;

  const res = await fetch(`/api/builder/sites/${websiteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings: { ...existingSettings, navigation } }),
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || 'Failed to save navigation');
  }
}
