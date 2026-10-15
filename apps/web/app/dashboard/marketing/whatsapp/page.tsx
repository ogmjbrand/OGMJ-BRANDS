'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, Send, Trash2, MessageCircle, FlaskConical } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import {
  listWhatsAppCampaigns,
  createWhatsAppCampaign,
  deleteWhatsAppCampaign,
  sendWhatsAppCampaign,
  generateWhatsAppContent,
  sendWhatsAppTestMessage,
  type WhatsAppCampaign,
} from '@/lib/services/whatsapp-marketing.service';

export default function WhatsAppMarketingPage() {
  const { currentBusiness } = useBusinessContext();
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', body: '', topic: '', statusFilter: '' });

  const [testForm, setTestForm] = useState({ to: '', message: '', confirmConsent: false });
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    const result = await listWhatsAppCampaigns(currentBusiness.id);
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
    const result = await generateWhatsAppContent(currentBusiness.id, form.topic);
    if (result.success && result.data) {
      setForm((f) => ({ ...f, body: result.data!.message }));
    } else {
      setError(result.error?.message || 'Failed to generate content');
    }
    setGeneratingAI(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentBusiness || !form.name.trim() || !form.body.trim()) return;
    setCreating(true);
    setError(null);
    const result = await createWhatsAppCampaign({
      businessId: currentBusiness.id,
      name: form.name,
      message: form.body,
      recipientFilter: form.statusFilter ? { status: form.statusFilter } : {},
    });
    if (result.success) {
      setForm({ name: '', body: '', topic: '', statusFilter: '' });
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
    const result = await sendWhatsAppCampaign(id);
    if (result.success && result.data) {
      setMessage(`Sent to ${result.data.sent} of ${result.data.total} recipients.`);
      load();
    } else {
      setError(result.error?.message || 'Failed to send campaign');
    }
    setSendingId(null);
  }

  async function handleTestSend(e: React.FormEvent) {
    e.preventDefault();
    if (!currentBusiness || !testForm.to.trim() || !testForm.message.trim() || !testForm.confirmConsent) return;
    setTestSending(true);
    setTestError(null);
    setTestResult(null);
    const result = await sendWhatsAppTestMessage({
      businessId: currentBusiness.id,
      to: testForm.to.trim(),
      message: testForm.message.trim(),
      confirmConsent: testForm.confirmConsent,
    });
    if (result.success && result.data) {
      setTestResult(`Submitted to Twilio (sid: ${result.data.sid ?? 'n/a'}). ${result.data.note}`);
    } else {
      setTestError(result.error?.message || 'Failed to send test message');
    }
    setTestSending(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this draft campaign?')) return;
    await deleteWhatsAppCampaign(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">WhatsApp Marketing</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">
          Broadcast short, personal messages to your contacts, with AI-assisted copy. Sending requires a connected
          Twilio WhatsApp Business number.
        </p>
      </div>

      <SectionPanel
        title={
          <span className="inline-flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-amber-400" />
            Test connection
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
              Sandbox / Testing
            </span>
          </span>
        }
        subtitle="Send a single message to verify the Twilio connection before using broadcasts. Requires sending to be explicitly enabled on the deployment, and a number that has joined the Twilio sandbox (or an approved WhatsApp sender)."
      >
        <form onSubmit={handleTestSend} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              required
              placeholder="Recipient phone, E.164 (e.g. +2348012345678)"
              value={testForm.to}
              onChange={(e) => setTestForm((f) => ({ ...f, to: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-hidden"
            />
          </div>
          <textarea
            required
            rows={2}
            maxLength={1600}
            placeholder="Test message"
            value={testForm.message}
            onChange={(e) => setTestForm((f) => ({ ...f, message: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-hidden"
          />
          <label className="flex items-start gap-2 text-xs text-[#F8F9FA]/60">
            <input
              type="checkbox"
              checked={testForm.confirmConsent}
              onChange={(e) => setTestForm((f) => ({ ...f, confirmConsent: e.target.checked }))}
              className="mt-0.5"
            />
            I confirm I have consent to message this recipient on WhatsApp.
          </label>
          <button
            type="submit"
            disabled={testSending || !testForm.confirmConsent}
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-60"
          >
            <FlaskConical className="h-4 w-4" />
            {testSending ? 'Sending…' : 'Send test message'}
          </button>
          {testError ? <p className="text-xs text-red-400">{testError}</p> : null}
          {testResult ? <p className="text-xs text-[#10B981]">{testResult}</p> : null}
        </form>
      </SectionPanel>

      <SectionPanel title="New broadcast">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              required
              placeholder="Broadcast name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-hidden"
            />
            <input
              type="text"
              placeholder="Recipient status filter (optional, e.g. lead)"
              value={form.statusFilter}
              onChange={(e) => setForm((f) => ({ ...f, statusFilter: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-hidden"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="AI topic (e.g. 'Flash sale this weekend')"
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              className="flex-1 rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={generatingAI || !form.topic.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 py-2 text-xs font-medium text-[#C8FF00] transition hover:bg-[#C8FF00]/20 disabled:opacity-60"
            >
              <Sparkles className={`h-3.5 w-3.5 ${generatingAI ? 'animate-pulse' : ''}`} />
              {generatingAI ? 'Writing…' : 'AI draft'}
            </button>
          </div>

          <textarea
            required
            rows={4}
            maxLength={500}
            placeholder="Message (keep it short — this is WhatsApp, not email)"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-hidden"
          />
          <p className="text-right text-[10px] text-[#F8F9FA]/40">{form.body.length}/500</p>

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4" />
            {creating ? 'Saving…' : 'Save as draft'}
          </button>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          {message ? <p className="text-xs text-[#10B981]">{message}</p> : null}
        </form>
      </SectionPanel>

      <SectionPanel title="Broadcasts" subtitle={loading ? undefined : `${campaigns.length} broadcast${campaigns.length === 1 ? '' : 's'}`}>
        {loading ? (
          <p className="text-sm text-[#F8F9FA]/50">Loading…</p>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-[#F8F9FA]/50">No broadcasts yet.</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#11151E] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{c.name}</p>
                  <p className="text-xs text-[#F8F9FA]/50">{c.message}</p>
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
                  <div className="flex shrink-0 items-center gap-2">
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
