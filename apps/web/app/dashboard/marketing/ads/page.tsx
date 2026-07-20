'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, Trash2, Megaphone, Play, Pause, CheckCircle2 } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import {
  listAdCampaigns,
  createAdCampaign,
  updateAdCampaign,
  deleteAdCampaign,
  generateAdCopy,
  AD_PLATFORMS,
  AD_OBJECTIVES,
  type AdCampaign,
  type AdCopy,
} from '@/lib/services/ads-marketing.service';

const STATUS_STYLE: Record<string, string> = {
  draft: 'text-[#F8F9FA]/40',
  active: 'text-[#10B981]',
  paused: 'text-[#C8FF00]',
  completed: 'text-[#F8F9FA]/60',
};

export default function AdsMarketingPage() {
  const { currentBusiness } = useBusinessContext();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adCopy, setAdCopy] = useState<AdCopy | null>(null);

  const [form, setForm] = useState({
    name: '',
    platform: 'meta',
    objective: 'traffic',
    product: '',
    audience: '',
    budgetAmount: '',
  });

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    const result = await listAdCampaigns(currentBusiness.id);
    if (result.success && result.data) setCampaigns(result.data);
    setLoading(false);
  }, [currentBusiness]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerateAI() {
    if (!currentBusiness || !form.product.trim()) return;
    setGeneratingAI(true);
    setError(null);
    const result = await generateAdCopy({
      businessId: currentBusiness.id,
      platform: form.platform,
      objective: form.objective,
      product: form.product,
      audience: form.audience,
    });
    if (result.success && result.data) {
      setAdCopy(result.data);
    } else {
      setError(result.error?.message || 'Failed to generate ad copy');
    }
    setGeneratingAI(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentBusiness || !form.name.trim()) return;
    setCreating(true);
    setError(null);
    const result = await createAdCampaign({
      businessId: currentBusiness.id,
      name: form.name,
      platform: form.platform,
      objective: form.objective,
      budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : undefined,
      adCopy: adCopy || undefined,
    });
    if (result.success) {
      setForm({ name: '', platform: form.platform, objective: form.objective, product: '', audience: '', budgetAmount: '' });
      setAdCopy(null);
      load();
    } else {
      setError(result.error?.message || 'Failed to create campaign');
    }
    setCreating(false);
  }

  async function handleStatusChange(id: string, status: string) {
    await updateAdCampaign(id, { status });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this campaign?')) return;
    await deleteAdCampaign(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Advertising</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">
          Plan campaigns and generate AI ad copy for Meta, Google, LinkedIn, and TikTok. Launching runs on each
          platform's own ad manager — track status and results here.
        </p>
      </div>

      <SectionPanel title="Plan a campaign">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              required
              placeholder="Campaign name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Daily budget (optional)"
              value={form.budgetAmount}
              onChange={(e) => setForm((f) => ({ ...f, budgetAmount: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
            <select
              value={form.platform}
              onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white focus:border-[#C8FF00]/40 focus:outline-none"
            >
              {AD_PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <select
              value={form.objective}
              onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white focus:border-[#C8FF00]/40 focus:outline-none"
            >
              {AD_OBJECTIVES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Product / offer (for AI copy)"
              value={form.product}
              onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Target audience (optional)"
              value={form.audience}
              onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={generatingAI || !form.product.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 py-2 text-xs font-medium text-[#C8FF00] transition hover:bg-[#C8FF00]/20 disabled:opacity-60"
          >
            <Sparkles className={`h-3.5 w-3.5 ${generatingAI ? 'animate-pulse' : ''}`} />
            {generatingAI ? 'Writing…' : 'Generate ad copy'}
          </button>

          {adCopy ? (
            <div className="space-y-2 rounded-xl bg-[#11151E] p-4 text-sm">
              {adCopy.primaryText ? <p className="text-white">{adCopy.primaryText}</p> : null}
              {adCopy.headlines?.length ? (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#F8F9FA]/40">Headlines</p>
                  <ul className="mt-1 space-y-0.5 text-[#F8F9FA]/70">
                    {adCopy.headlines.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {adCopy.descriptions?.length ? (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#F8F9FA]/40">Descriptions</p>
                  <ul className="mt-1 space-y-0.5 text-[#F8F9FA]/70">
                    {adCopy.descriptions.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {adCopy.cta ? (
                <p className="text-xs text-[#C8FF00]">CTA: {adCopy.cta}</p>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
          >
            <Megaphone className="h-4 w-4" />
            {creating ? 'Saving…' : 'Save campaign'}
          </button>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </form>
      </SectionPanel>

      <SectionPanel title="Campaigns" subtitle={loading ? undefined : `${campaigns.length} campaign${campaigns.length === 1 ? '' : 's'}`}>
        {loading ? (
          <p className="text-sm text-[#F8F9FA]/50">Loading…</p>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-[#F8F9FA]/50">No campaigns yet.</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-xl bg-[#11151E] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#C8FF00]">
                      {AD_PLATFORMS.find((p) => p.value === c.platform)?.label || c.platform}
                    </p>
                    <p className="mt-1 text-sm text-white">{c.name}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#F8F9FA]/40">
                      <span className={STATUS_STYLE[c.status] || 'text-[#F8F9FA]/40'}>{c.status}</span>
                      {c.budget_amount ? ` · ${c.currency} ${c.budget_amount}/${c.budget_type}` : ''}
                      {c.metrics ? ` · ${c.metrics.impressions} impr. · ${c.metrics.clicks} clicks · ${c.currency} ${c.metrics.spend} spent` : ''}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {c.status === 'draft' || c.status === 'paused' ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(c.id, 'active')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 px-2.5 py-1 text-xs font-medium text-[#10B981] transition hover:bg-[#10B981]/20"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Activate
                      </button>
                    ) : null}
                    {c.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(c.id, 'paused')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-2.5 py-1 text-xs font-medium text-[#C8FF00] transition hover:bg-[#C8FF00]/20"
                      >
                        <Pause className="h-3.5 w-3.5" />
                        Pause
                      </button>
                    ) : null}
                    {c.status !== 'completed' ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(c.id, 'completed')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-[#F8F9FA]/60 transition hover:bg-white/5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Complete
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
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
