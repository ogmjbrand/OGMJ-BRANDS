'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, Send, Trash2, Mail } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import {
  listEmailCampaigns,
  createEmailCampaign,
  deleteEmailCampaign,
  sendEmailCampaign,
  generateEmailContent,
  type EmailCampaign,
} from '@/lib/services/email-marketing.service';

export default function EmailMarketingPage() {
  const { currentBusiness } = useBusinessContext();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', subject: '', body: '', topic: '', statusFilter: '' });

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    const result = await listEmailCampaigns(currentBusiness.id);
    if (result.success && result.data) setCampaigns(result.data);
    setLoading(false);
  }, [currentBusiness]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerateAI() {
    if (!currentBusiness || !form.topic.trim()) return;
    setGeneratingAI(true);
    setError(null);
    const result = await generateEmailContent(currentBusiness.id, form.topic);
    if (result.success && result.data) {
      setForm((f) => ({ ...f, subject: result.data!.subject, body: result.data!.body }));
    } else {
      setError(result.error?.message || 'Failed to generate content');
    }
    setGeneratingAI(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentBusiness || !form.name.trim() || !form.subject.trim() || !form.body.trim()) return;
    setCreating(true);
    setError(null);
    const result = await createEmailCampaign({
      businessId: currentBusiness.id,
      name: form.name,
      subject: form.subject,
      emailBody: form.body,
      recipientFilter: form.statusFilter ? { status: form.statusFilter } : {},
    });
    if (result.success) {
      setForm({ name: '', subject: '', body: '', topic: '', statusFilter: '' });
      setMessage('Campaign saved as draft.');
      load();
    } else {
      setError(result.error?.message || 'Failed to create campaign');
    }
    setCreating(false);
  }

  async function handleSend(id: string) {
    if (!confirm('Send this campaign now? This cannot be undone.')) return;
    setSendingId(id);
    setError(null);
    const result = await sendEmailCampaign(id);
    if (result.success && result.data) {
      setMessage(`Sent to ${result.data.sent} of ${result.data.total} recipients.`);
      load();
    } else {
      setError(result.error?.message || 'Failed to send campaign');
    }
    setSendingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this draft campaign?')) return;
    await deleteEmailCampaign(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Email Marketing</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">Create and send campaigns to your contacts, with AI-assisted copy.</p>
      </div>

      <SectionPanel title="New campaign">
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
              type="text"
              placeholder="Recipient status filter (optional, e.g. lead)"
              value={form.statusFilter}
              onChange={(e) => setForm((f) => ({ ...f, statusFilter: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="AI topic (e.g. 'New collection launch')"
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
              {generatingAI ? 'Writing…' : 'AI draft'}
            </button>
          </div>

          <input
            type="text"
            required
            placeholder="Subject line"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
          />
          <textarea
            required
            rows={6}
            placeholder="Email body"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
          />

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
          >
            <Mail className="h-4 w-4" />
            {creating ? 'Saving…' : 'Save as draft'}
          </button>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          {message ? <p className="text-xs text-[#10B981]">{message}</p> : null}
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
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#11151E] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{c.name}</p>
                  <p className="text-xs text-[#F8F9FA]/50">{c.subject}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#F8F9FA]/40">
                    <span
                      className={
                        c.status === 'sent'
                          ? 'text-[#10B981]'
                          : c.status === 'failed'
                            ? 'text-red-400'
                            : 'text-[#C8FF00]'
                      }
                    >
                      {c.status}
                    </span>
                    {c.recipient_count > 0 ? ` · ${c.recipient_count} recipients` : ''}
                  </p>
                </div>
                {c.status === 'draft' ? (
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSend(c.id)}
                      disabled={sendingId === c.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 py-1.5 text-xs font-medium text-[#C8FF00] transition hover:bg-[#C8FF00]/20 disabled:opacity-60"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {sendingId === c.id ? 'Sending…' : 'Send'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 text-red-400 transition hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
