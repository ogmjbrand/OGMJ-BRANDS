'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { savePageSettings } from '@/lib/services/document-editor.service';
import { Portal } from '@/components/ui/portal';

interface SettingsDrawerProps {
  pageId: string;
  initial: { title: string; slug: string; seo: { title?: string; description?: string } };
  onClose: () => void;
  onSaved: (next: { title: string; slug: string; version: number }) => void;
}

export function SettingsDrawer({ pageId, initial, onClose, onSaved }: SettingsDrawerProps) {
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [seoTitle, setSeoTitle] = useState(initial.seo.title ?? '');
  const [seoDescription, setSeoDescription] = useState(initial.seo.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const { version } = await savePageSettings(pageId, { title, slug, seo: { title: seoTitle || undefined, description: seoDescription || undefined } });
      onSaved({ title, slug, version });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    // Portaled: see components/ui/portal.tsx's doc comment -- this drawer
    // is a `fixed`-positioned descendant of PageTransition's animated
    // motion.div on the Visual Editor route, whose content overflows a
    // mobile viewport and would otherwise break this drawer's positioning.
    <Portal>
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div className="h-full w-full space-y-4 overflow-y-auto bg-[#101010] p-5 text-sm text-[#E5E5E5] sm:w-96" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#D4AF37]">Page settings</h2>
          <button onClick={onClose} className="text-[#9a9a9a] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="rounded-md border border-[#B91C1C]/30 bg-[#B91C1C]/10 p-2 text-xs text-[#f09a9a]">{error}</p>}

        <label className="block space-y-1">
          <span className="text-[11px] uppercase tracking-wide text-[#9a9a9a]">Page title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-[#D4AF37]/20 bg-[#121212] px-2.5 py-1.5 text-sm outline-none focus:border-[#D4AF37]"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] uppercase tracking-wide text-[#9a9a9a]">Slug</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-md border border-[#D4AF37]/20 bg-[#121212] px-2.5 py-1.5 text-sm outline-none focus:border-[#D4AF37]"
          />
        </label>

        <div className="border-t border-white/5 pt-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#D4AF37]/80">SEO</h3>
          <label className="mb-3 block space-y-1">
            <span className="text-[11px] uppercase tracking-wide text-[#9a9a9a]">SEO title</span>
            <input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="w-full rounded-md border border-[#D4AF37]/20 bg-[#121212] px-2.5 py-1.5 text-sm outline-none focus:border-[#D4AF37]"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] uppercase tracking-wide text-[#9a9a9a]">SEO description</span>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-[#D4AF37]/20 bg-[#121212] px-2.5 py-1.5 text-sm outline-none focus:border-[#D4AF37]"
            />
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-md bg-[#D4AF37] py-2 text-xs font-semibold text-[#1a1a1a] transition hover:bg-[#c7a233] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </div>
    </Portal>
  );
}
