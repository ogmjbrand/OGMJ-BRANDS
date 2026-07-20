'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Loader2, Check, X } from 'lucide-react';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import {
  getPlatformAdminStatus,
  claimFirstPlatformAdmin,
  listAllPayoutRequests,
  updatePayoutRequestStatus,
  type PlatformAdminStatus,
  type AdminPayoutRequest,
} from '@/lib/services/admin.service';

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function AdminPayoutsPage() {
  const [status, setStatus] = useState<PlatformAdminStatus | null>(null);
  const [payouts, setPayouts] = useState<AdminPayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const adminStatus = await getPlatformAdminStatus();
    setStatus(adminStatus);

    if (adminStatus.isCurrentUserAdmin) {
      const result = await listAllPayoutRequests();
      if (result.success && result.data) setPayouts(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleClaim() {
    setClaiming(true);
    setError(null);
    const result = await claimFirstPlatformAdmin();
    if (result.success) {
      await load();
    } else {
      setError(result.error || 'Failed to claim admin access');
    }
    setClaiming(false);
  }

  async function handleAction(id: string, next: 'processing' | 'paid' | 'rejected') {
    setActioningId(id);
    const result = await updatePayoutRequestStatus(id, next);
    if (result.success) {
      await load();
    } else {
      setError(result.error?.message || 'Failed to update payout');
    }
    setActioningId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#F8F9FA]/60">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  if (!status?.isCurrentUserAdmin) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-[1.75rem] border border-[#C8FF00]/10 bg-[#0E1116]/90 p-8 text-center">
        {status?.hasAnyAdmin ? (
          <>
            <ShieldAlert className="mx-auto h-8 w-8 text-red-400" />
            <h1 className="text-lg font-semibold text-white">Admin access required</h1>
            <p className="text-sm text-[#F8F9FA]/60">
              This area is restricted to OGMJ platform admins.
            </p>
          </>
        ) : (
          <>
            <ShieldCheck className="mx-auto h-8 w-8 text-[#C8FF00]" />
            <h1 className="text-lg font-semibold text-white">No platform admin yet</h1>
            <p className="text-sm text-[#F8F9FA]/60">
              Nobody has claimed admin access on this platform. Claim it now to review and approve payout requests.
            </p>
            <button
              type="button"
              onClick={handleClaim}
              disabled={claiming}
              className="w-full rounded-2xl bg-[#C8FF00] py-2.5 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
            >
              {claiming ? 'Claiming…' : 'Claim admin access'}
            </button>
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
          </>
        )}
      </div>
    );
  }

  const pending = payouts.filter((p) => p.status === 'pending' || p.status === 'processing');
  const resolved = payouts.filter((p) => p.status === 'paid' || p.status === 'rejected');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Payout Requests</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">Review and process partner payout requests across all businesses.</p>
      </div>

      {error ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div> : null}

      <SectionPanel title="Pending" subtitle={`${pending.length} awaiting action`}>
        {pending.length === 0 ? (
          <p className="text-sm text-[#F8F9FA]/50">Nothing pending.</p>
        ) : (
          <div className="space-y-2">
            {pending.map((payout) => (
              <div key={payout.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#11151E] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{formatMoney(payout.amount, payout.currency)}</p>
                  <p className="text-xs text-[#F8F9FA]/50">
                    {payout.bank_name} · {payout.account_name} · {payout.account_number}
                  </p>
                  <p className="text-[10px] text-[#F8F9FA]/40">{new Date(payout.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {payout.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => handleAction(payout.id, 'processing')}
                      disabled={actioningId === payout.id}
                      className="rounded-xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 py-1.5 text-xs font-medium text-[#C8FF00] transition hover:bg-[#C8FF00]/20 disabled:opacity-60"
                    >
                      Mark processing
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleAction(payout.id, 'paid')}
                    disabled={actioningId === payout.id}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-1.5 text-xs font-medium text-[#10B981] transition hover:bg-[#10B981]/20 disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark paid
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(payout.id, 'rejected')}
                    disabled={actioningId === payout.id}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionPanel>

      <SectionPanel title="History" subtitle={`${resolved.length} resolved`}>
        {resolved.length === 0 ? (
          <p className="text-sm text-[#F8F9FA]/50">No resolved payouts yet.</p>
        ) : (
          <div className="space-y-2">
            {resolved.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between rounded-xl bg-[#11151E] px-4 py-3 text-sm">
                <span className="text-white">{formatMoney(payout.amount, payout.currency)}</span>
                <span className={payout.status === 'paid' ? 'text-[#10B981]' : 'text-red-400'}>{payout.status}</span>
                <span className="text-xs text-[#F8F9FA]/40">
                  {payout.processed_at ? new Date(payout.processed_at).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
