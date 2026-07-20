'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Handshake, Copy, Check, MousePointerClick, UserPlus, TrendingUp, Wallet } from 'lucide-react';
import { SectionPanel, MetricCard } from '@/components/dashboard/EmpireCards';
import {
  getPartnerStatus,
  joinPartnerProgram,
  requestPayout,
  type PartnerStatus,
} from '@/lib/services/partner.service';

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function PartnerPage() {
  const [status, setStatus] = useState<PartnerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [payoutForm, setPayoutForm] = useState({ amount: '', bankName: '', accountNumber: '', accountName: '' });
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getPartnerStatus();
    if (result.success && result.data) setStatus(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleJoin() {
    setJoining(true);
    setError(null);
    const result = await joinPartnerProgram();
    if (result.success) {
      await load();
    } else {
      setError(result.error?.message || 'Failed to join');
    }
    setJoining(false);
  }

  async function handleCopy() {
    if (!status?.referral) return;
    await navigator.clipboard.writeText(status.referral.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRequestPayout(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(payoutForm.amount);
    if (!amount || amount <= 0) {
      setError('Enter a valid payout amount');
      return;
    }
    setRequesting(true);
    setError(null);
    setMessage(null);
    const result = await requestPayout({
      amount,
      bankName: payoutForm.bankName,
      accountNumber: payoutForm.accountNumber,
      accountName: payoutForm.accountName,
    });
    if (result.success) {
      setMessage('Payout requested. It will be processed by the OGMJ team.');
      setPayoutForm({ amount: '', bankName: '', accountNumber: '', accountName: '' });
      await load();
    } else {
      setError(result.error?.message || 'Failed to request payout');
    }
    setRequesting(false);
  }

  if (loading) {
    return <div className="text-sm text-[#F8F9FA]/60">Loading…</div>;
  }

  if (!status?.program) {
    return <div className="text-sm text-[#F8F9FA]/60">The partner program isn't available right now.</div>;
  }

  const { program, referral, commissions, payouts, availableBalance, enrolled } = status;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Partner Hub</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">
          Share your link, earn {program.commission_type === 'percentage' ? `${program.commission_value}%` : formatMoney(program.commission_value, program.payout_currency)} commission on every business you bring to OGMJ.
        </p>
      </div>

      {!enrolled ? (
        <SectionPanel title={program.name} subtitle={program.description ?? undefined}>
          <div className="space-y-4">
            <div className="grid gap-3 text-sm text-[#F8F9FA]/70 sm:grid-cols-3">
              <div className="rounded-xl bg-[#11151E] px-3 py-2.5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#F8F9FA]/40">Commission</p>
                <p className="mt-1 font-medium text-[#C8FF00]">
                  {program.commission_type === 'percentage' ? `${program.commission_value}%` : formatMoney(program.commission_value, program.payout_currency)}
                </p>
              </div>
              <div className="rounded-xl bg-[#11151E] px-3 py-2.5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#F8F9FA]/40">Cookie window</p>
                <p className="mt-1 font-medium text-white">{program.cookie_days} days</p>
              </div>
              <div className="rounded-xl bg-[#11151E] px-3 py-2.5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#F8F9FA]/40">Minimum payout</p>
                <p className="mt-1 font-medium text-white">{formatMoney(program.min_payout, program.payout_currency)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
            >
              <Handshake className="h-4 w-4" />
              {joining ? 'Joining…' : 'Join the Partner Program'}
            </button>
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
          </div>
        </SectionPanel>
      ) : (
        <>
          <SectionPanel title="Your referral link" subtitle="Share it anywhere — earn when it converts.">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <code className="flex-1 truncate rounded-xl border border-white/10 bg-[#11151E] px-3 py-2.5 text-sm text-[#C8FF00]">
                {referral?.link}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-4 py-2.5 text-sm font-medium text-[#C8FF00] transition hover:bg-[#C8FF00]/20"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </SectionPanel>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Clicks" value={String(referral?.clicks ?? 0)} description="Total link visits" icon={MousePointerClick} accent="slate" />
            <MetricCard title="Signups" value={String(referral?.signups ?? 0)} description="Attributed signups" icon={UserPlus} accent="gold" />
            <MetricCard title="Conversions" value={String(referral?.conversions ?? 0)} description="Paying customers" icon={TrendingUp} accent="emerald" />
            <MetricCard
              title="Available balance"
              value={formatMoney(availableBalance, program.payout_currency)}
              description={`${formatMoney(referral?.total_earned ?? 0, program.payout_currency)} earned total`}
              icon={Wallet}
              accent="gold"
            />
          </div>

          <SectionPanel title="Commission history" subtitle="Credited when a referred business pays">
            {commissions.length === 0 ? (
              <p className="text-sm text-[#F8F9FA]/50">No commissions yet.</p>
            ) : (
              <div className="space-y-2">
                {commissions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl bg-[#11151E] px-3 py-2.5 text-sm">
                    <span className="text-white">{formatMoney(c.amount, c.currency)}</span>
                    <span className="capitalize text-[#F8F9FA]/50">{c.status}</span>
                    <span className="text-xs text-[#F8F9FA]/40">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>

          <SectionPanel title="Request a payout" subtitle={`Minimum ${formatMoney(program.min_payout, program.payout_currency)}`}>
            <form onSubmit={handleRequestPayout} className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                min={program.min_payout}
                step="1"
                required
                placeholder="Amount"
                value={payoutForm.amount}
                onChange={(e) => setPayoutForm((f) => ({ ...f, amount: e.target.value }))}
                className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
              />
              <input
                type="text"
                required
                placeholder="Bank name"
                value={payoutForm.bankName}
                onChange={(e) => setPayoutForm((f) => ({ ...f, bankName: e.target.value }))}
                className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
              />
              <input
                type="text"
                required
                placeholder="Account number"
                value={payoutForm.accountNumber}
                onChange={(e) => setPayoutForm((f) => ({ ...f, accountNumber: e.target.value }))}
                className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
              />
              <input
                type="text"
                required
                placeholder="Account name"
                value={payoutForm.accountName}
                onChange={(e) => setPayoutForm((f) => ({ ...f, accountName: e.target.value }))}
                className="rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={requesting || availableBalance < program.min_payout}
                className="sm:col-span-2 inline-flex w-fit items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
              >
                {requesting ? 'Requesting…' : 'Request payout'}
              </button>
            </form>
            {message ? <p className="mt-3 text-xs text-[#10B981]">{message}</p> : null}
            {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}

            {payouts.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                {payouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-[#11151E] px-3 py-2.5 text-sm">
                    <span className="text-white">{formatMoney(p.amount, p.currency)}</span>
                    <span className="capitalize text-[#F8F9FA]/50">{p.status}</span>
                    <span className="text-xs text-[#F8F9FA]/40">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>
        </>
      )}
    </div>
  );
}
