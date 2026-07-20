'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, Trash2, UserPlus } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import {
  listInfluencers,
  createInfluencer,
  updateInfluencer,
  deleteInfluencer,
  generateOutreachMessage,
  INFLUENCER_PLATFORMS,
  INFLUENCER_STATUSES,
  type Influencer,
} from '@/lib/services/influencer.service';

const STATUS_STYLE: Record<string, string> = {
  prospecting: 'text-[#F8F9FA]/40',
  contacted: 'text-[#C8FF00]',
  negotiating: 'text-[#C8FF00]',
  active: 'text-[#10B981]',
  completed: 'text-[#10B981]',
  declined: 'text-red-400',
};

export default function InfluencersPage() {
  const { currentBusiness } = useBusinessContext();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [outreach, setOutreach] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', handle: '', platform: 'instagram', followersCount: '', collabType: 'gifted' });

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    const result = await listInfluencers(currentBusiness.id);
    if (result.success && result.data) setInfluencers(result.data);
    setLoading(false);
  }, [currentBusiness]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentBusiness || !form.name.trim()) return;
    setCreating(true);
    setError(null);
    const result = await createInfluencer({
      businessId: currentBusiness.id,
      name: form.name,
      handle: form.handle || undefined,
      platform: form.platform,
      followersCount: form.followersCount ? Number(form.followersCount) : undefined,
      collabType: form.collabType,
    });
    if (result.success) {
      setForm({ name: '', handle: '', platform: form.platform, followersCount: '', collabType: form.collabType });
      load();
    } else {
      setError(result.error?.message || 'Failed to save influencer');
    }
    setCreating(false);
  }

  async function handleGenerateOutreach(inf: Influencer) {
    if (!currentBusiness) return;
    setGeneratingId(inf.id);
    setError(null);
    const result = await generateOutreachMessage({
      businessId: currentBusiness.id,
      influencerName: inf.name,
      platform: inf.platform,
      collabType: inf.collab_type,
    });
    if (result.success && result.data) {
      setOutreach((o) => ({ ...o, [inf.id]: result.data!.message }));
    } else {
      setError(result.error?.message || 'Failed to generate outreach message');
    }
    setGeneratingId(null);
  }

  async function handleStatusChange(id: string, status: string) {
    await updateInfluencer(id, { status });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this influencer?')) return;
    await deleteInfluencer(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Influencer Marketing</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">
          Track influencer relationships from first contact to collab, with AI-drafted outreach messages.
        </p>
      </div>

      <SectionPanel title="Add an influencer">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              type="text"
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
            <input
              type="text"
              placeholder="@handle"
              value={form.handle}
              onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
            <select
              value={form.platform}
              onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white focus:border-[#C8FF00]/40 focus:outline-none"
            >
              {INFLUENCER_PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              placeholder="Followers"
              value={form.followersCount}
              onChange={(e) => setForm((f) => ({ ...f, followersCount: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {creating ? 'Saving…' : 'Add influencer'}
          </button>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </form>
      </SectionPanel>

      <SectionPanel title="Pipeline" subtitle={loading ? undefined : `${influencers.length} influencer${influencers.length === 1 ? '' : 's'}`}>
        {loading ? (
          <p className="text-sm text-[#F8F9FA]/50">Loading…</p>
        ) : influencers.length === 0 ? (
          <p className="text-sm text-[#F8F9FA]/50">No influencers yet.</p>
        ) : (
          <div className="space-y-2">
            {influencers.map((inf) => (
              <div key={inf.id} className="rounded-xl bg-[#11151E] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#C8FF00]">
                      {INFLUENCER_PLATFORMS.find((p) => p.value === inf.platform)?.label || inf.platform}
                      {inf.followers_count ? ` · ${inf.followers_count.toLocaleString()} followers` : ''}
                    </p>
                    <p className="mt-1 text-sm text-white">
                      {inf.name} {inf.handle ? <span className="text-[#F8F9FA]/50">{inf.handle}</span> : null}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#F8F9FA]/40">
                      <span className={STATUS_STYLE[inf.status] || 'text-[#F8F9FA]/40'}>{inf.status}</span>
                      {` · ${inf.collab_type}`}
                    </p>
                    {outreach[inf.id] ? (
                      <div className="mt-2 rounded-lg bg-[#07070A] p-2.5 text-xs text-[#F8F9FA]/70">{outreach[inf.id]}</div>
                    ) : null}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleGenerateOutreach(inf)}
                      disabled={generatingId === inf.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 py-1.5 text-xs font-medium text-[#C8FF00] transition hover:bg-[#C8FF00]/20 disabled:opacity-60"
                    >
                      <Sparkles className={`h-3.5 w-3.5 ${generatingId === inf.id ? 'animate-pulse' : ''}`} />
                      {generatingId === inf.id ? 'Writing…' : 'Draft outreach'}
                    </button>
                    <select
                      value={inf.status}
                      onChange={(e) => handleStatusChange(inf.id, e.target.value)}
                      className="rounded-lg border border-white/10 bg-[#07070A] px-2 py-1 text-xs text-white focus:border-[#C8FF00]/40 focus:outline-none"
                    >
                      {INFLUENCER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleDelete(inf.id)}
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
