'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, Trash2, Star, Flag, Check, PlusCircle } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import {
  listReviews,
  createReview,
  updateReview,
  deleteReview,
  generateReviewResponse,
  REVIEW_PLATFORMS,
  type Review,
} from '@/lib/services/reviews.service';

const STATUS_STYLE: Record<string, string> = {
  new: 'text-[#C8FF00]',
  responded: 'text-[#10B981]',
  flagged: 'text-red-400',
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? 'fill-[#C8FF00] text-[#C8FF00]' : 'text-white/15'}`} />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const { currentBusiness } = useBusinessContext();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ platform: 'google', reviewerName: '', rating: '5', reviewText: '' });

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    const result = await listReviews(currentBusiness.id);
    if (result.success && result.data) setReviews(result.data);
    setLoading(false);
  }, [currentBusiness]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentBusiness || !form.reviewText.trim()) return;
    setCreating(true);
    setError(null);
    const result = await createReview({
      businessId: currentBusiness.id,
      platform: form.platform,
      reviewerName: form.reviewerName || undefined,
      rating: Number(form.rating),
      reviewText: form.reviewText,
    });
    if (result.success) {
      setForm({ platform: form.platform, reviewerName: '', rating: '5', reviewText: '' });
      load();
    } else {
      setError(result.error?.message || 'Failed to log review');
    }
    setCreating(false);
  }

  async function handleGenerateResponse(id: string) {
    setGeneratingId(id);
    setError(null);
    const result = await generateReviewResponse(id);
    if (result.success && result.data) {
      setDrafts((d) => ({ ...d, [id]: result.data!.response }));
    } else {
      setError(result.error?.message || 'Failed to generate response');
    }
    setGeneratingId(null);
  }

  async function handleSaveResponse(id: string) {
    const responseText = drafts[id];
    if (!responseText?.trim()) return;
    await updateReview(id, { responseText });
    setDrafts((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
    load();
  }

  async function handleFlag(id: string) {
    await updateReview(id, { status: 'flagged' });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this review record?')) return;
    await deleteReview(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Reviews &amp; Reputation</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">
          Log reviews from Google, Trustpilot, Yelp and more in one place, and draft on-brand responses with AI.
        </p>
      </div>

      <SectionPanel title="Log a review">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={form.platform}
              onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white focus:border-[#C8FF00]/40 focus:outline-none"
            >
              {REVIEW_PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Reviewer name (optional)"
              value={form.reviewerName}
              onChange={(e) => setForm((f) => ({ ...f, reviewerName: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
            <select
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white focus:border-[#C8FF00]/40 focus:outline-none"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </div>
          <textarea
            required
            rows={3}
            placeholder="Review text"
            value={form.reviewText}
            onChange={(e) => setForm((f) => ({ ...f, reviewText: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
          >
            <PlusCircle className="h-4 w-4" />
            {creating ? 'Saving…' : 'Log review'}
          </button>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </form>
      </SectionPanel>

      <SectionPanel title="Reviews" subtitle={loading ? undefined : `${reviews.length} review${reviews.length === 1 ? '' : 's'}`}>
        {loading ? (
          <p className="text-sm text-[#F8F9FA]/50">Loading…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-[#F8F9FA]/50">No reviews logged yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl bg-[#11151E] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#C8FF00]">
                      {REVIEW_PLATFORMS.find((p) => p.value === r.platform)?.label || r.platform}
                      {r.reviewer_name ? ` · ${r.reviewer_name}` : ''}
                    </p>
                    <div className="mt-1">
                      <Stars rating={r.rating} />
                    </div>
                    <p className="mt-1 text-sm text-white">{r.review_text}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em]">
                      <span className={STATUS_STYLE[r.status] || 'text-[#F8F9FA]/40'}>{r.status}</span>
                    </p>

                    {r.response_text ? (
                      <div className="mt-2 rounded-lg border border-[#10B981]/20 bg-[#10B981]/5 p-2.5 text-xs text-[#F8F9FA]/70">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#10B981]">Your response</p>
                        <p className="mt-1">{r.response_text}</p>
                      </div>
                    ) : drafts[r.id] !== undefined ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          rows={3}
                          value={drafts[r.id]}
                          onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                          className="w-full rounded-lg border border-white/10 bg-[#07070A] px-3 py-2 text-xs text-white focus:border-[#C8FF00]/40 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveResponse(r.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 px-2.5 py-1 text-xs font-medium text-[#10B981] transition hover:bg-[#10B981]/20"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Save response
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    {!r.response_text ? (
                      <button
                        type="button"
                        onClick={() => handleGenerateResponse(r.id)}
                        disabled={generatingId === r.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 py-1.5 text-xs font-medium text-[#C8FF00] transition hover:bg-[#C8FF00]/20 disabled:opacity-60"
                      >
                        <Sparkles className={`h-3.5 w-3.5 ${generatingId === r.id ? 'animate-pulse' : ''}`} />
                        {generatingId === r.id ? 'Writing…' : 'AI draft'}
                      </button>
                    ) : null}
                    {r.status !== 'flagged' ? (
                      <button
                        type="button"
                        onClick={() => handleFlag(r.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-[#F8F9FA]/50 transition hover:bg-white/5"
                        title="Flag for follow-up"
                      >
                        <Flag className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
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
