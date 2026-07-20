'use client';

import React, { useState } from 'react';
import { Sparkles, Search, TrendingUp } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import { generateSEOMeta, analyzeContentGaps, type SEOMeta, type ContentGapAnalysis } from '@/lib/services/seo.service';

export default function SEOPage() {
  const { currentBusiness } = useBusinessContext();
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [meta, setMeta] = useState<SEOMeta | null>(null);
  const [generatingMeta, setGeneratingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [gaps, setGaps] = useState<ContentGapAnalysis | null>(null);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);
  const [gapsError, setGapsError] = useState<string | null>(null);

  async function handleGenerateMeta(e: React.FormEvent) {
    e.preventDefault();
    if (!currentBusiness || !topic.trim()) return;
    setGeneratingMeta(true);
    setMetaError(null);
    const result = await generateSEOMeta({ businessId: currentBusiness.id, topic, content: content || undefined });
    if (result.success && result.data) {
      setMeta(result.data);
    } else {
      setMetaError(result.error?.message || 'Failed to generate SEO meta');
    }
    setGeneratingMeta(false);
  }

  async function handleAnalyzeGaps() {
    if (!currentBusiness) return;
    setAnalyzingGaps(true);
    setGapsError(null);
    const result = await analyzeContentGaps(currentBusiness.id);
    if (result.success && result.data) {
      setGaps(result.data);
    } else {
      setGapsError(result.error?.message || 'Failed to analyze content gaps');
    }
    setAnalyzingGaps(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">SEO Assistant</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">
          AI-generated meta tags, keywords, and content gap analysis. Live rank tracking and Search Console data require
          connecting a Google account — not available yet.
        </p>
      </div>

      <SectionPanel title="Meta tags & keywords" subtitle="For a page, article, or topic">
        <form onSubmit={handleGenerateMeta} className="space-y-3">
          <input
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Page topic or URL purpose"
            className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Paste existing content (optional) for more accurate suggestions"
            className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={generatingMeta}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
          >
            <Search className={`h-4 w-4 ${generatingMeta ? 'animate-pulse' : ''}`} />
            {generatingMeta ? 'Analyzing…' : 'Generate'}
          </button>
          {metaError ? <p className="text-xs text-red-400">{metaError}</p> : null}
        </form>

        {meta ? (
          <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">Meta title</p>
              <p className="mt-1 text-sm text-white">{meta.metaTitle}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">Meta description</p>
              <p className="mt-1 text-sm text-[#F8F9FA]/70">{meta.metaDescription}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">Keywords</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {meta.keywords.map((k, i) => (
                  <span key={i} className="rounded-full border border-[#C8FF00]/20 bg-[#C8FF00]/10 px-2.5 py-1 text-xs text-[#C8FF00]">
                    {k}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">Suggested headings</p>
              <ul className="mt-1.5 space-y-1 text-sm text-[#F8F9FA]/70">
                {meta.headingSuggestions.map((h, i) => (
                  <li key={i}>• {h}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </SectionPanel>

      <SectionPanel title="Content gap analysis" subtitle="Against your brand strategy's content pillars">
        <button
          type="button"
          onClick={handleAnalyzeGaps}
          disabled={analyzingGaps}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-4 py-2 text-sm font-medium text-[#C8FF00] transition hover:bg-[#C8FF00]/20 disabled:opacity-60"
        >
          <TrendingUp className={`h-4 w-4 ${analyzingGaps ? 'animate-pulse' : ''}`} />
          {analyzingGaps ? 'Analyzing…' : 'Analyze content gaps'}
        </button>
        {gapsError ? <p className="mt-2 text-xs text-red-400">{gapsError}</p> : null}

        {gaps ? (
          <div className="mt-4 space-y-4 border-t border-white/5 pt-4">
            <p className="text-sm text-[#F8F9FA]/80">{gaps.summary}</p>

            {gaps.wellCovered.length > 0 ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#10B981]">Well covered</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {gaps.wellCovered.map((item, i) => (
                    <span key={i} className="rounded-full border border-[#10B981]/20 bg-[#10B981]/10 px-2.5 py-1 text-xs text-[#10B981]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {gaps.gaps.length > 0 ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">Gaps</p>
                <div className="mt-1.5 space-y-2">
                  {gaps.gaps.map((g, i) => (
                    <div key={i} className="rounded-xl bg-[#11151E] px-4 py-2.5">
                      <p className="text-xs font-semibold text-[#C8FF00]">{g.pillar}</p>
                      <p className="mt-1 text-sm text-[#F8F9FA]/70">{g.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {gaps.quickWins.length > 0 ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">Quick wins</p>
                <ul className="mt-1.5 space-y-1 text-sm text-[#F8F9FA]/70">
                  {gaps.quickWins.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </SectionPanel>
    </div>
  );
}
