'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import { getBrandStrategy, generateBrandStrategy, type BrandStrategy } from '@/lib/services/marketing.service';

const FIELDS: { key: string; label: string; placeholder: string; area?: boolean }[] = [
  { key: 'industry', label: 'Industry', placeholder: 'e.g. Fast fashion' },
  { key: 'productsServices', label: 'Products / Services', placeholder: 'What do you sell?', area: true },
  { key: 'budget', label: 'Marketing budget', placeholder: 'e.g. ₦500,000/month' },
  { key: 'targetAudience', label: 'Target audience', placeholder: 'Who buys from you?', area: true },
  { key: 'competitors', label: 'Competitors', placeholder: 'Who are you up against?' },
  { key: 'usp', label: 'Unique selling proposition', placeholder: 'What makes you different?', area: true },
  { key: 'brandStory', label: 'Brand story', placeholder: 'How did this business start?', area: true },
  { key: 'mission', label: 'Mission', placeholder: 'Why does this business exist?' },
  { key: 'vision', label: 'Vision', placeholder: 'Where is this going?' },
  { key: 'coreValues', label: 'Core values', placeholder: 'What do you stand for?' },
  { key: 'brandVoice', label: 'Brand voice', placeholder: 'e.g. Bold, direct, playful' },
  { key: 'brandTone', label: 'Brand tone', placeholder: 'e.g. Warm but authoritative' },
  { key: 'goals', label: 'Goals', placeholder: 'What does success look like this year?' },
  { key: 'market', label: 'Market', placeholder: 'e.g. Nigeria, pan-African, global' },
];

export default function BrandStrategyPage() {
  const { currentBusiness } = useBusinessContext();
  const [form, setForm] = useState<Record<string, string>>({});
  const [strategy, setStrategy] = useState<BrandStrategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    const result = await getBrandStrategy(currentBusiness.id);
    if (result.success && result.data) {
      setStrategy(result.data);
      setForm({
        industry: result.data.industry || '',
        productsServices: result.data.products_services || '',
        budget: result.data.budget || '',
        targetAudience: result.data.target_audience || '',
        competitors: result.data.competitors || '',
        usp: result.data.usp || '',
        brandStory: result.data.brand_story || '',
        mission: result.data.mission || '',
        vision: result.data.vision || '',
        coreValues: result.data.core_values || '',
        brandVoice: result.data.brand_voice || '',
        brandTone: result.data.brand_tone || '',
        goals: result.data.goals || '',
        market: result.data.market || '',
      });
    }
    setLoading(false);
  }, [currentBusiness]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentBusiness) return;
    setGenerating(true);
    setError(null);
    const result = await generateBrandStrategy({ businessId: currentBusiness.id, ...form });
    if (result.success && result.data) {
      setStrategy(result.data);
    } else {
      setError(result.error?.message || 'Failed to generate strategy');
    }
    setGenerating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#F8F9FA]/60">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  const generated = strategy?.generated;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Brand Strategy</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">
          Answer what you know — Empire AI fills in a complete strategy from it. Everything is editable and regenerable.
        </p>
      </div>

      <SectionPanel title="Tell us about your business" subtitle="Leave anything blank and AI will make its best call">
        <form onSubmit={handleGenerate} className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key} className={field.area ? 'sm:col-span-2' : ''}>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">
                {field.label}
              </label>
              {field.area ? (
                <textarea
                  value={form[field.key] || ''}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={2}
                  className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
                />
              ) : (
                <input
                  type="text"
                  value={form[field.key] || ''}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={generating}
            className="sm:col-span-2 inline-flex w-fit items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
          >
            <Sparkles className={`h-4 w-4 ${generating ? 'animate-pulse' : ''}`} />
            {generating ? 'Generating…' : strategy ? 'Regenerate strategy' : 'Generate strategy'}
          </button>
          {error ? <p className="sm:col-span-2 text-xs text-red-400">{error}</p> : null}
        </form>
      </SectionPanel>

      {generated ? (
        <>
          <SectionPanel title="Positioning & Messaging">
            <p className="text-sm text-[#F8F9FA]/80">{generated.positioning}</p>
            <p className="mt-2 text-sm text-[#F8F9FA]/60">{generated.messaging}</p>
          </SectionPanel>

          {generated.personas && generated.personas.length > 0 ? (
            <SectionPanel title="Customer Personas">
              <div className="grid gap-3 sm:grid-cols-2">
                {generated.personas.map((p, i) => (
                  <div key={i} className="rounded-xl bg-[#11151E] px-4 py-3">
                    <p className="text-sm font-semibold text-[#C8FF00]">{p.name}</p>
                    <p className="mt-1 text-sm text-[#F8F9FA]/70">{p.summary}</p>
                  </div>
                ))}
              </div>
            </SectionPanel>
          ) : null}

          {generated.swot ? (
            <SectionPanel title="SWOT Analysis">
              <div className="grid gap-3 sm:grid-cols-2">
                {(['strengths', 'weaknesses', 'opportunities', 'threats'] as const).map((key) => (
                  <div key={key} className="rounded-xl bg-[#11151E] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F8F9FA]/50">{key}</p>
                    <ul className="mt-2 space-y-1 text-sm text-[#F8F9FA]/70">
                      {(generated.swot?.[key] || []).map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </SectionPanel>
          ) : null}

          <div className="grid gap-6 sm:grid-cols-2">
            <SectionPanel title="Offer & Pricing Strategy">
              <p className="text-sm text-[#F8F9FA]/70">{generated.offerStrategy}</p>
              <p className="mt-2 text-sm text-[#F8F9FA]/70">{generated.pricingStrategy}</p>
            </SectionPanel>
            <SectionPanel title="Competitive Analysis">
              <p className="text-sm text-[#F8F9FA]/70">{generated.competitiveAnalysis}</p>
            </SectionPanel>
          </div>

          {generated.contentPillars && generated.contentPillars.length > 0 ? (
            <SectionPanel title="Content Pillars">
              <div className="flex flex-wrap gap-2">
                {generated.contentPillars.map((pillar, i) => (
                  <span key={i} className="rounded-full border border-[#C8FF00]/20 bg-[#C8FF00]/10 px-3 py-1.5 text-xs text-[#C8FF00]">
                    {pillar}
                  </span>
                ))}
              </div>
            </SectionPanel>
          ) : null}

          {generated.roadmap && generated.roadmap.length > 0 ? (
            <SectionPanel title="12-Month Roadmap">
              <div className="space-y-2">
                {generated.roadmap.map((item, i) => (
                  <div key={i} className="flex gap-3 rounded-xl bg-[#11151E] px-4 py-2.5 text-sm">
                    <span className="w-24 flex-shrink-0 font-medium text-[#C8FF00]">{item.month}</span>
                    <span className="text-[#F8F9FA]/70">{item.focus}</span>
                  </div>
                ))}
              </div>
            </SectionPanel>
          ) : null}

          {generated.kpis && generated.kpis.length > 0 ? (
            <SectionPanel title="KPIs to track">
              <div className="flex flex-wrap gap-2">
                {generated.kpis.map((kpi, i) => (
                  <span key={i} className="rounded-full border border-white/10 bg-[#11151E] px-3 py-1.5 text-xs text-[#F8F9FA]/70">
                    {kpi}
                  </span>
                ))}
              </div>
            </SectionPanel>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
