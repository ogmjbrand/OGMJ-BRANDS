'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { getInvoice, updateInvoice, listClients, type InvoiceClient } from '@/lib/services/invoices.service';

export default function InvoiceEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentBusiness } = useBusinessContext();
  const [invoice, setInvoice] = useState<any>(null);
  const [clients, setClients] = useState<InvoiceClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('draft');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function loadInvoice() {
      if (!params.id) return;
      setLoading(true);
      try {
        const data = await getInvoice(params.id);
        setInvoice(data);
        setClientId(data.client_id || '');
        setTitle(data.title || '');
        setTotalAmount(Number(data.total) || 0);
        setDueDate(data.due_date ? data.due_date.split('T')[0] : '');
        setStatus(data.status || 'draft');
        setNotes(data.notes || '');
        if (currentBusiness) {
          setClients(await listClients(currentBusiness.id));
        }
      } catch (err) {
        console.error('Failed to load invoice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [params.id, currentBusiness]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!invoice) return;
    setSaving(true);
    setError(null);

    try {
      await updateInvoice(invoice.id, {
        clientId: clientId || null,
        title,
        dueDate,
        status,
        notes,
        amount: totalAmount,
      });
      router.push(`/dashboard/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update invoice');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="inline-block w-8 h-8 animate-spin rounded-full border-4 border-[#D4AF37]/20 border-t-[#D4AF37]"></div>
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center p-12 text-[#D4AF37]/70">Invoice not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
          className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#0E1116] px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to invoice
        </button>
        <div className="text-sm text-[#D4AF37]/70">Editing {invoice.invoice_number}</div>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6 rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2 text-sm text-[#D4AF37]/70">
              Client
              <select
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
              >
                <option value="">No client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-[#D4AF37]/70">
              Due Date
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2 text-sm text-[#D4AF37]/70">
              Title / Description
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
              />
            </label>
            <label className="space-y-2 text-sm text-[#D4AF37]/70">
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>

          <label className="space-y-2 text-sm text-[#D4AF37]/70">
            Total Amount (NGN)
            <input
              type="number"
              min={0}
              value={totalAmount}
              onChange={(event) => setTotalAmount(Number(event.target.value))}
              className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
            />
          </label>

          <label className="space-y-2 text-sm text-[#D4AF37]/70">
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={5}
              className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#07070A] hover:bg-[#D4AF37]/90 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {saving ? 'Updating...' : 'Save Invoice'}
          </button>
        </div>

        <aside className="space-y-6 rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6">
          <div className="rounded-3xl bg-[#11151E] p-4">
            <p className="text-sm text-[#D4AF37]/60">Current status</p>
            <p className="text-xl font-semibold text-white mt-2">{status.toUpperCase()}</p>
          </div>
          <div className="rounded-3xl bg-[#11151E] p-4">
            <p className="text-sm text-[#D4AF37]/60">Created</p>
            <p className="text-white mt-2">{new Date(invoice.created_at).toLocaleDateString()}</p>
          </div>
          <div className="rounded-3xl bg-[#11151E] p-4">
            <p className="text-sm text-[#D4AF37]/60">Client</p>
            <p className="text-white mt-2">{invoice.clients?.name || 'Unassigned'}</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
