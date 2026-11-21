'use client';

/**
 * Site-wide navigation manager -- main + footer menus, shared across every
 * page of this website (see navigation.service.ts for why this isn't part
 * of any single page's document). Internal links store a pageId, never a
 * captured href, and are re-resolved against the live pages list on every
 * render -- renaming a page's slug can never leave a stale link here.
 */
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, FileText, Plus, Trash2 } from 'lucide-react';
import { getPages, type Page } from '@/lib/services/builder.service';
import {
  isSafeNavTarget,
  loadNavigation,
  newNavLink,
  resolveNavHref,
  saveNavigation,
  type NavLink,
  type SiteNavigation,
} from '@/lib/services/navigation.service';
import { TextField } from './Inspector';

interface NavigationPanelProps {
  businessId: string;
  websiteId: string;
}

type MenuKey = 'main' | 'footer';

function moveItem<T>(list: T[], index: number, delta: number): T[] {
  const next = [...list];
  const target = index + delta;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function NavigationPanel({ businessId, websiteId }: NavigationPanelProps) {
  const [nav, setNav] = useState<SiteNavigation | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([loadNavigation(websiteId), getPages(businessId, websiteId)])
      .then(([navigation, pagesResult]) => {
        if (cancelled) return;
        setNav(navigation);
        setPages(pagesResult.data ?? []);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load navigation'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [businessId, websiteId]);

  function updateMenu(menu: MenuKey, updater: (links: NavLink[]) => NavLink[]) {
    setNav((n) => (n ? { ...n, [menu]: updater(n[menu]) } : n));
    setDirty(true);
  }

  async function handleSave() {
    if (!nav) return;
    setSaving(true);
    setError(null);
    try {
      await saveNavigation(websiteId, nav);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save navigation');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-4 text-sm text-[#7a7a7a]">Loading navigation…</div>;
  if (!nav) return <div className="p-4 text-sm text-[#f09a9a]">{error ?? 'Failed to load navigation'}</div>;

  return (
    <div className="space-y-5 p-3">
      {error && <p className="rounded-md border border-[#B91C1C]/30 bg-[#B91C1C]/10 p-2 text-xs text-[#f09a9a]">{error}</p>}

      <MenuEditor title="Main navigation" menu="main" links={nav.main} pages={pages} onChange={(updater) => updateMenu('main', updater)} />
      <MenuEditor title="Footer navigation" menu="footer" links={nav.footer} pages={pages} onChange={(updater) => updateMenu('footer', updater)} />

      <button
        onClick={handleSave}
        disabled={saving || !dirty}
        className="w-full rounded-md bg-[#D4AF37] py-2 text-xs font-semibold text-[#1a1a1a] transition hover:bg-[#c7a233] disabled:opacity-50"
      >
        {saving ? 'Saving…' : dirty ? 'Save navigation' : 'Saved'}
      </button>
    </div>
  );
}

function MenuEditor({
  title,
  links,
  pages,
  onChange,
}: {
  title: string;
  menu: MenuKey;
  links: NavLink[];
  pages: Page[];
  onChange: (updater: (links: NavLink[]) => NavLink[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]/80">{title}</h3>
        <button
          onClick={() =>
            onChange((list) => [...list, newNavLink('New link', pages[0] ? { type: 'page', pageId: pages[0].id } : { type: 'external', href: '/' })])
          }
          title="Add link"
          className="rounded p-1 text-[#9a9a9a] hover:bg-white/5 hover:text-[#D4AF37]"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {links.length === 0 && <p className="text-[11px] text-[#6b6b6b]">No links yet.</p>}

      {links.map((link, index) => (
        <LinkRow
          key={link.id}
          link={link}
          pages={pages}
          isFirst={index === 0}
          isLast={index === links.length - 1}
          onMove={(delta) => onChange((list) => moveItem(list, index, delta))}
          onUpdate={(next) => onChange((list) => list.map((l, i) => (i === index ? next : l)))}
          onDelete={() => onChange((list) => list.filter((_, i) => i !== index))}
        />
      ))}
    </div>
  );
}

function LinkRow({
  link,
  pages,
  isFirst,
  isLast,
  onMove,
  onUpdate,
  onDelete,
  depth = 0,
}: {
  link: NavLink;
  pages: Page[];
  isFirst: boolean;
  isLast: boolean;
  onMove: (delta: number) => void;
  onUpdate: (next: NavLink) => void;
  onDelete: () => void;
  /** 0 = a top-level link (can have a dropdown of its own); 1 = already inside a dropdown -- deliberately not recursive beyond that, see NavLink's doc comment. */
  depth?: number;
}) {
  const href = resolveNavHref(link, pages);
  const unsafe = !isSafeNavTarget(link.target);

  return (
    <div className="space-y-2 rounded-md border border-[#D4AF37]/15 bg-[#161616] p-2.5">
      <div className="flex items-center gap-1">
        <button onClick={() => onMove(-1)} disabled={isFirst} className="rounded p-0.5 text-[#9a9a9a] hover:text-[#E5E5E5] disabled:opacity-30">
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onMove(1)} disabled={isLast} className="rounded p-0.5 text-[#9a9a9a] hover:text-[#E5E5E5] disabled:opacity-30">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1">
          <TextField value={link.label} onChange={(v) => onUpdate({ ...link, label: v })} />
        </div>
        <button onClick={onDelete} title="Delete link" className="rounded p-1 text-[#9a9a9a] hover:bg-red-500/10 hover:text-red-400">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={link.target.type}
          onChange={(e) =>
            onUpdate({
              ...link,
              target: e.target.value === 'page' ? { type: 'page', pageId: pages[0]?.id ?? '' } : { type: 'external', href: '/' },
            })
          }
          className="rounded-md border border-[#D4AF37]/20 bg-[#121212] px-2 py-1 text-xs text-[#E5E5E5] outline-none focus:border-[#D4AF37]"
        >
          <option value="page">Page</option>
          <option value="external">External URL</option>
        </select>

        {link.target.type === 'page' ? (
          <select
            value={link.target.pageId}
            onChange={(e) => onUpdate({ ...link, target: { type: 'page', pageId: e.target.value } })}
            className="min-w-0 flex-1 rounded-md border border-[#D4AF37]/20 bg-[#121212] px-2 py-1 text-xs text-[#E5E5E5] outline-none focus:border-[#D4AF37]"
          >
            {pages.length === 0 && <option value="">No pages yet</option>}
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        ) : (
          <div className="min-w-0 flex-1">
            <TextField value={link.target.href} onChange={(v) => onUpdate({ ...link, target: { type: 'external', href: v } })} />
          </div>
        )}
      </div>

      <p className="flex items-center gap-1 text-[11px] text-[#6b6b6b]">
        {link.target.type === 'external' ? <ExternalLink className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
        {unsafe ? <span className="text-red-400">Unsafe or empty URL -- won&apos;t be saved as a working link</span> : href ? href : 'This page no longer exists'}
      </p>

      {depth === 0 && (
        <div className="space-y-2 border-t border-white/5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide text-[#6b6b6b]">Dropdown items</span>
            <button
              onClick={() =>
                onUpdate({
                  ...link,
                  children: [...(link.children ?? []), newNavLink('New item', pages[0] ? { type: 'page', pageId: pages[0].id } : { type: 'external', href: '/' })],
                })
              }
              title="Add dropdown item"
              className="rounded p-0.5 text-[#9a9a9a] hover:text-[#D4AF37]"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          {(link.children ?? []).map((child, childIndex) => (
            <div key={child.id} className="ml-3 border-l border-[#D4AF37]/15 pl-2">
              <LinkRow
                link={child}
                pages={pages}
                depth={1}
                isFirst={childIndex === 0}
                isLast={childIndex === (link.children?.length ?? 0) - 1}
                onMove={(delta) => onUpdate({ ...link, children: moveItem(link.children ?? [], childIndex, delta) })}
                onUpdate={(next) => onUpdate({ ...link, children: (link.children ?? []).map((c, i) => (i === childIndex ? next : c)) })}
                onDelete={() => onUpdate({ ...link, children: (link.children ?? []).filter((_, i) => i !== childIndex) })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
