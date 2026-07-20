'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Trash2, UserPlus, Copy, Check } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import {
  listAffiliates,
  createAffiliate,
  updateAffiliate,
  deleteAffiliate,
  type AffiliatePartner,
} from '@/lib/services/affiliate.service';

export default function AffiliatesPage() {
  const { currentBusiness } = useBusinessContext();
  const [affiliates, setAffiliates] = useState<AffiliatePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', email: '', commissionType: 'percentage', commissionValue: '10' });

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    const result = await listAffiliates(currentBusiness.id);
    if (result.success && result.data) setAffiliates(result.data);
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
    const result = await createAffiliate({
      businessId: currentBusiness.id,
      name: form.name,
      email: form.email || undefined,
      commissionType: form.commissionType,
      commissionValue: Number(form.commissionValue),
    });
    if (result.success) {
      setForm({ name: '', email: '', commissionType: form.commissionType, commissionValue: form.commissionValue });
      load();
    } else {
      setError(result.error?.message || 'Failed to add affiliate');
    }
    setCreating(false);
  }

  function handleCopy(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleToggleStatus(a: AffiliatePartner) {
    await updateAffiliate(a.id, { status: a.status === 'active' ? 'paused' : 'active' });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this affiliate partner?')) return;
    await deleteAffiliate(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Affiliate Program</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">
          Run your own affiliate program — each partner gets a referral code and commission rate. Log sales and
          commission manually as they come in.
        </p>
      </div>

      <SectionPanel title="Add an affiliate partner">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              type="text"
              required
              placeholder="Partner name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
            <select
              value={form.commissionType}
              onChange={(e) => setForm((f) => ({ ...f, commissionType: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white focus:border-[#C8FF00]/40 focus:outline-none"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Commission value"
              value={form.commissionValue}
              onChange={(e) => setForm((f) => ({ ...f, commissionValue: e.target.value }))}
              className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {creating ? 'Saving…' : 'Add partner'}
          </button>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </form>
      </SectionPanel>

      <SectionPanel title="Partners" subtitle={loading ? undefined : `${affiliates.length} partner${affiliates.length === 1 ? '' : 's'}`}>
        {loading ? (
          <p className="text-sm text-[#F8F9FA]/50">Loading…</p>
        ) : affiliates.length === 0 ? (
          <p className="text-sm text-[#F8F9FA]/50">No affiliate partners yet.</p>
        ) : (
          <div className="space-y-2">
            {affiliates.map((a) => (
              <div key={a.id} className="rounded-xl bg-[#11151E] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-white">{a.name}</p>
                    <button
                      type="button"
                      onClick={() => handleCopy(a.referral_code, a.id)}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-[#C8FF00]/20 bg-[#C8FF00]/5 px-2 py-0.5 text-xs font-mono text-[#C8FF00]"
                    >
                      {a.referral_code}
                      {copiedId === a.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#F8F9FA]/40">
                      <span className={a.status === 'active' ? 'text-[#10B981]' : 'text-[#F8F9FA]/40'}>{a.status}</span>
                      {` · ${a.commission_value}${a.commission_type === 'percentage' ? '%' : ` ${a.currency}`} commission`}
                      {a.total_sales > 0 ? ` · ${a.currency} ${a.total_sales} sold · ${a.currency} ${a.total_commission} owed` : ''}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(a)}
                      className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-[#F8F9FA]/60 transition hover:bg-white/5"
                    >
                      {a.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
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
