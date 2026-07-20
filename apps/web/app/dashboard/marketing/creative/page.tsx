'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, Trash2, Clapperboard, Film } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import {
  listCreativeBriefs,
  createCreativeBrief,
  updateCreativeBrief,
  deleteCreativeBrief,
  generateCreativeBrief,
  CREATIVE_FORMATS,
  type CreativeBrief,
  type CreativeBriefContent,
} from '@/lib/services/creative-studio.service';

const STATUS_STYLE: Record<string, string> = {
  draft: 'text-[#F8F9FA]/40',
  ready: 'text-[#C8FF00]',
  in_production: 'text-[#10B981]',
  complete: 'text-[#F8F9FA]/60',
};

export default function CreativeStudioPage() {
  const { currentBusiness } = useBusinessContext();
  const [briefs, setBriefs] = useState<CreativeBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CreativeBriefContent | null>(null);

  const [form, setForm] = useState({ title: '', format: 'video', platform: '', topic: '' });

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    const result = await listCreativeBriefs(currentBusiness.id);
    if (result.success && result.data) setBriefs(result.data);
    setLoading(false);
  }, [currentBusiness]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerateAI() {
    if (!currentBusiness || !form.topic.trim()) return;
    setGeneratingAI(true);
    setError(null);
    const result = await generateCreativeBrief({
      businessId: currentBusiness.id,
      format: form.format,
      platform: form.platform || undefined,
      topic: form.topic,
    });
    if (result.success && result.data) {
      setPreview(result.data);
    } else {
      setError(result.error?.message || 'Failed to generate brief');
    }
    setGeneratingAI(false);
  }

  async function handleSave() {
    if (!currentBusiness || !form.title.trim() || !preview) return;
    setSaving(true);
    setError(null);
    const result = await createCreativeBrief({
      businessId: currentBusiness.id,
      title: form.title,
      format: form.format,
      platform: form.platform || undefined,
      topic: form.topic || undefined,
      brief: preview,
    });
    if (result.success) {
      setForm({ title: '', format: form.format, platform: '', topic: '' });
      setPreview(null);
      load();
    } else {
      setError(result.error?.message || 'Failed to save brief');
    }
    setSaving(false);
  }

  async function handleStatusChange(id: string, status: string) {
    await updateCreativeBrief(id, { status });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this creative brief?')) return;
    await deleteCreativeBrief(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Creative Studio</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">
          Generate a creative brief — concept, visual direction, and shot list — for your next video or image
          campaign. Video scripts for social posts live in Content Studio; produced videos live under Videos.
        </p>
      </div>

      <SectionPanel title="New brief">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              placeholder="Brief title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
            <select
              value={form.format}
              onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white focus:border-[#C8FF00]/40 focus:outline-none"
            >
              {CREATIVE_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Platform (optional, e.g. Instagram Reels)"
              value={form.platform}
              onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Campaign / topic (e.g. 'Launch of the new collection')"
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              className="flex-1 rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={generatingAI || !form.topic.trim()}
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 py-2 text-xs font-medium text-[#C8FF00] transition hover:bg-[#C8FF00]/20 disabled:opacity-60"
            >
              <Sparkles className={`h-3.5 w-3.5 ${generatingAI ? 'animate-pulse' : ''}`} />
              {generatingAI ? 'Directing…' : 'Generate brief'}
            </button>
          </div>

          {preview ? (
            <div className="space-y-3 rounded-xl bg-[#11151E] p-4 text-sm">
              {preview.logline ? <p className="font-medium text-white">{preview.logline}</p> : null}
              {preview.visualDirection ? (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#F8F9FA]/40">Visual direction</p>
                  <p className="mt-1 text-[#F8F9FA]/70">{preview.visualDirection}</p>
                </div>
              ) : null}
              {preview.shotList?.length ? (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#F8F9FA]/40">Shot list</p>
                  <ol className="mt-1 space-y-1.5">
                    {preview.shotList.map((s, i) => (
                      <li key={i} className="text-[#F8F9FA]/70">
                        <span className="text-[#C8FF00]">{s.beat}</span>
                        {s.durationSeconds ? ` (${s.durationSeconds}s)` : ''} — {s.description}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
              <p className="text-xs text-[#F8F9FA]/50">
                {preview.aspectRatio ? `Aspect ratio: ${preview.aspectRatio}` : ''}
                {preview.musicMood ? ` · Music: ${preview.musicMood}` : ''}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !preview || !form.title.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
          >
            <Clapperboard className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save brief'}
          </button>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
      </SectionPanel>

      <SectionPanel title="Briefs" subtitle={loading ? undefined : `${briefs.length} brief${briefs.length === 1 ? '' : 's'}`}>
        {loading ? (
          <p className="text-sm text-[#F8F9FA]/50">Loading…</p>
        ) : briefs.length === 0 ? (
          <p className="text-sm text-[#F8F9FA]/50">No briefs yet.</p>
        ) : (
          <div className="space-y-2">
            {briefs.map((b) => (
              <div key={b.id} className="rounded-xl bg-[#11151E] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#C8FF00]">
                      {CREATIVE_FORMATS.find((f) => f.value === b.format)?.label || b.format}
                      {b.platform ? ` · ${b.platform}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-white">{b.title}</p>
                    {b.brief?.logline ? <p className="mt-1 text-xs text-[#F8F9FA]/60">{b.brief.logline}</p> : null}
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em]">
                      <span className={STATUS_STYLE[b.status] || 'text-[#F8F9FA]/40'}>{b.status.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {b.status !== 'complete' ? (
                      <select
                        value={b.status}
                        onChange={(e) => handleStatusChange(b.id, e.target.value)}
                        className="rounded-lg border border-white/10 bg-[#07070A] px-2 py-1 text-xs text-white focus:border-[#C8FF00]/40 focus:outline-none"
                      >
                        {['draft', 'ready', 'in_production', 'complete'].map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Film className="h-4 w-4 text-[#F8F9FA]/40" />
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 text-red-400 transition hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
