'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, Trash2, Copy, Check } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import {
  listContentItems,
  generateContentItem,
  updateContentItem,
  deleteContentItem,
  CONTENT_TYPES,
  type ContentItem,
} from '@/lib/services/marketing.service';

export default function ContentStudioPage() {
  const { currentBusiness } = useBusinessContext();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({ type: 'blog_article', platform: '', topic: '', instructions: '' });

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    const result = await listContentItems(currentBusiness.id);
    if (result.success && result.data) setItems(result.data);
    setLoading(false);
  }, [currentBusiness]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentBusiness || !form.topic.trim()) return;
    setGenerating(true);
    setError(null);
    const result = await generateContentItem({
      businessId: currentBusiness.id,
      type: form.type,
      platform: form.platform || undefined,
      topic: form.topic,
      instructions: form.instructions || undefined,
    });
    if (result.success) {
      setForm((f) => ({ ...f, topic: '', instructions: '' }));
      load();
    } else {
      setError(result.error?.message || 'Failed to generate content');
    }
    setGenerating(false);
  }

  async function handlePublish(id: string) {
    await updateContentItem(id, { status: 'published' });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this content item?')) return;
    await deleteContentItem(id);
    load();
  }

  async function handleCopy(item: ContentItem) {
    await navigator.clipboard.writeText(item.body);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Content Studio</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">Generate publish-ready content in any format, grounded in your brand strategy.</p>
      </div>

      <SectionPanel title="Generate content">
        <form onSubmit={handleGenerate} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white focus:border-[#C8FF00]/40 focus:outline-none"
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">
              Platform (optional)
            </label>
            <input
              type="text"
              value={form.platform}
              onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
              placeholder="e.g. Instagram"
              className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">Topic</label>
            <input
              type="text"
              required
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              placeholder="What's this about?"
              className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">
              Extra instructions (optional)
            </label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={generating}
            className="sm:col-span-2 inline-flex w-fit items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
          >
            <Sparkles className={`h-4 w-4 ${generating ? 'animate-pulse' : ''}`} />
            {generating ? 'Writing…' : 'Generate'}
          </button>
          {error ? <p className="sm:col-span-2 text-xs text-red-400">{error}</p> : null}
        </form>
      </SectionPanel>

      <SectionPanel title="Your content" subtitle={loading ? undefined : `${items.length} item${items.length === 1 ? '' : 's'}`}>
        {loading ? (
          <p className="text-sm text-[#F8F9FA]/50">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[#F8F9FA]/50">Nothing generated yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/5 bg-[#11151E] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs text-[#F8F9FA]/40">
                      {CONTENT_TYPES.find((t) => t.value === item.type)?.label || item.type}
                      {item.platform ? ` · ${item.platform}` : ''} ·{' '}
                      <span className={item.status === 'published' ? 'text-[#10B981]' : 'text-[#F8F9FA]/40'}>{item.status}</span>
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-[#F8F9FA]/60 transition hover:border-[#C8FF00]/40 hover:text-[#C8FF00]"
                    >
                      {copiedId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    {item.status !== 'published' ? (
                      <button
                        type="button"
                        onClick={() => handlePublish(item.id)}
                        className="rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 px-2.5 py-1 text-xs font-medium text-[#10B981] transition hover:bg-[#10B981]/20"
                      >
                        Publish
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 text-red-400 transition hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#F8F9FA]/70">{item.body}</p>
              </div>
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
