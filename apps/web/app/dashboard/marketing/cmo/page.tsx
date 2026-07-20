'use client';

import React, { useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import { generateCMOBriefing, type CMOBriefing } from '@/lib/services/cmo.service';

export default function CMOPage() {
  const { currentBusiness } = useBusinessContext();
  const [briefing, setBriefing] = useState<CMOBriefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!currentBusiness) return;
    setLoading(true);
    setError(null);
    const result = await generateCMOBriefing(currentBusiness.id);
    if (result.success && result.data) {
      setBriefing(result.data);
    } else {
      setError(result.error?.message || 'Failed to generate briefing');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">AI CMO Briefing</h1>
          <p className="mt-1 text-sm text-[#F8F9FA]/60">
            A weekly-style briefing synthesized across your brand strategy, content, campaigns, and reviews — the
            state of your marketing, in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
        >
          <Sparkles className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
          {loading ? 'Briefing…' : briefing ? 'Regenerate' : 'Generate briefing'}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : null}

      {!briefing && !loading ? (
        <SectionPanel title="No briefing yet">
          <p className="text-sm text-[#F8F9FA]/50">
            Generate a briefing to get an executive summary of everything happening across your marketing modules.
          </p>
        </SectionPanel>
      ) : null}

      {briefing ? (
        <div className="space-y-4">
          {briefing.headline ? (
            <SectionPanel title="State of marketing">
              <p className="text-base text-white">{briefing.headline}</p>
            </SectionPanel>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <SectionPanel title="Wins">
              {briefing.wins?.length ? (
                <ul className="space-y-2">
                  {briefing.wins.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#F8F9FA]/80">
                      <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#10B981]" />
                      {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#F8F9FA]/50">Nothing notable yet.</p>
              )}
            </SectionPanel>

            <SectionPanel title="Concerns">
              {briefing.concerns?.length ? (
                <ul className="space-y-2">
                  {briefing.concerns.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#F8F9FA]/80">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#F8F9FA]/50">No concerns flagged.</p>
              )}
            </SectionPanel>
          </div>

          <SectionPanel title="Priorities this week">
            {briefing.priorities?.length ? (
              <ol className="space-y-2">
                {briefing.priorities.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#F8F9FA]/80">
                    <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#C8FF00]" />
                    {p}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[#F8F9FA]/50">No priorities suggested.</p>
            )}
          </SectionPanel>
        </div>
      ) : null}
    </div>
  );
}
