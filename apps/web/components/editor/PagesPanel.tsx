'use client';

/**
 * Multi-page management for the website currently open in the editor.
 * Reuses the existing `/api/builder/pages` CRUD (via builder.service.ts)
 * as-is -- no new page table, no competing page model. "Duplicate" is a
 * real create call seeded with the source page's own content, not a
 * cosmetic copy.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Copy, Trash2, Loader2 } from 'lucide-react';
import { getPages, createPage, deletePage, type Page } from '@/lib/services/builder.service';

interface PagesPanelProps {
  businessId: string;
  websiteId: string;
  currentPageId: string;
}

export function PagesPanel({ businessId, websiteId, currentPageId }: PagesPanelProps) {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    const result = await getPages(businessId, websiteId);
    if (result.success && result.data) setPages(result.data);
    else setError(result.error?.message ?? 'Failed to load pages');
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websiteId]);

  function slugify(name: string): string {
    const s = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return s || `page-${Date.now().toString(36)}`;
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    setError(null);
    const result = await createPage({ businessId, websiteId, title: newTitle.trim(), slug: slugify(newTitle.trim()) });
    setCreating(false);
    if (result.success && result.data) {
      setNewTitle('');
      await reload();
      router.push(`/dashboard/builder/${websiteId}/${result.data.id}`);
    } else {
      setError(result.error?.message ?? 'Failed to create page');
    }
  }

  async function handleDuplicate(page: Page) {
    setBusyId(page.id);
    setError(null);
    // Re-fetch the source page's full content via a GET so the duplicate
    // starts from its actual current content, not a stale list snapshot.
    const res = await fetch(`/api/builder/pages/${page.id}`);
    const body = await res.json();
    const sourceContent = res.ok ? body.data?.content : undefined;
    const title = `${page.title} copy`;
    const result = await createPage({ businessId, websiteId, title, slug: slugify(title) });
    if (result.success && result.data && sourceContent !== undefined) {
      await fetch(`/api/builder/pages/${result.data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: sourceContent }),
      });
    }
    setBusyId(null);
    if (result.success) await reload();
    else setError(result.error?.message ?? 'Failed to duplicate page');
  }

  async function handleDelete(page: Page) {
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    setBusyId(page.id);
    const result = await deletePage(page.id);
    setBusyId(null);
    if (result.success) {
      await reload();
      if (page.id === currentPageId) router.push('/dashboard/builder');
    } else {
      setError(result.error?.message ?? 'Failed to delete page');
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[#D4AF37]/15 p-3">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New page title"
          className="min-w-0 flex-1 rounded-md border border-[#D4AF37]/15 bg-[#121212] px-2 py-1.5 text-xs text-[#E5E5E5] outline-none focus:border-[#D4AF37]"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newTitle.trim()}
          className="rounded-md bg-[#D4AF37]/15 p-1.5 text-[#D4AF37] transition hover:bg-[#D4AF37]/25 disabled:opacity-40"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {error && <p className="border-b border-[#B91C1C]/20 bg-[#B91C1C]/10 px-3 py-2 text-xs text-[#f09a9a]">{error}</p>}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
          </div>
        ) : (
          pages.map((page) => (
            <div
              key={page.id}
              className={`group flex items-center gap-2 px-3 py-2 text-sm ${
                page.id === currentPageId ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-[#E5E5E5] hover:bg-white/5'
              }`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <button
                onClick={() => router.push(`/dashboard/builder/${websiteId}/${page.id}`)}
                className="min-w-0 flex-1 truncate text-left"
                title={`/${page.slug}`}
              >
                {page.title}
              </button>
              {busyId === page.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <div className="hidden items-center gap-1 group-hover:flex">
                  <button onClick={() => handleDuplicate(page)} title="Duplicate page" className="text-[#9a9a9a] hover:text-[#D4AF37]">
                    <Copy className="h-3 w-3" />
                  </button>
                  <button onClick={() => handleDelete(page)} title="Delete page" className="text-[#9a9a9a] hover:text-[#B91C1C]">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
