'use client';

/**
 * Drop-in "draft it with AI" button for any dashboard module.
 *
 * Usage:
 *   <AIAssistButton
 *     task="invoice-reminder"
 *     context={{ client: 'Acme', amount: 1200, dueDate: '2026-07-20' }}
 *     onResult={(text) => setNote(text)}
 *   />
 *
 * Tasks understood by the backend: email-draft, deal-followup,
 * invoice-reminder, social-post, content-ideas, campaign-plan, summarize —
 * or any free-form instruction string.
 */

import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface AIAssistButtonProps {
  task: string;
  context: string | Record<string, unknown>;
  instructions?: string;
  agent?: string;
  label?: string;
  className?: string;
  onResult: (text: string) => void;
  onError?: (message: string) => void;
}

export function AIAssistButton({
  task,
  context,
  instructions,
  agent,
  label = 'Draft with AI',
  className = '',
  onResult,
  onError,
}: AIAssistButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, context, instructions, agent }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        const message = body?.hint
          ? `${body.error} — ${body.hint}`
          : body?.error ?? `AI request failed (${res.status})`;
        setError(message);
        onError?.(message);
        return;
      }
      onResult(body.data.text);
    } catch {
      const message = 'Could not reach the AI service.';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? 'Drafting…' : label}
      </button>
      {error && <span className="text-xs text-amber-400">{error}</span>}
    </div>
  );
}

export default AIAssistButton;

