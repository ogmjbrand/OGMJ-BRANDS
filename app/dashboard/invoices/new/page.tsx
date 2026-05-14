'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { createInvoice, generateInvoiceNumber } from '@/lib/services/invoices.service';

export default function InvoiceCreatePage() {
  const router = useRouter();
  const { currentBusiness } = useBusinessContext();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [status, setStatus] = useState('draft');
  const [totalAmount, setTotalAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      if (!currentBusiness) return;
      const number = await generateInvoiceNumber(currentBusiness.id);
      setInvoiceNumber(number);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 14);
      setDueDate(tomorrow.toISOString().split('T')[0]);
    }
    initialize();
  }, [currentBusiness]);

  async function handleCreateInvoice(event: React.FormEvent) {
    event.preventDefault();
    if (!currentBusiness) return;

    setSaving(true);
    setError(null);

    try {
      await createInvoice(currentBusiness.id, {
        invoice_number: invoiceNumber,
        status: status as any,
        due_date: dueDate,
        total_amount: totalAmount,
        paid_amount: 0,
        metadata: { notes },
      });
      router.push('/dashboard/invoices');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white">Create New Invoice</h1>
        <p className="text-[#D4AF37]/70 mt-2 max-w-2xl">
          Create a polished invoice and keep billing organized for your clients.
        </p>
      </div>

      <form onSubmit={handleCreateInvoice} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6 rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2 text-sm text-[#D4AF37]/70">
              Invoice Number
              <input
                value={invoiceNumber}
                onChange={(event) => setInvoiceNumber(event.target.value)}
                className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
              />
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
              </select>
            </label>
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
          </div>

          <label className="space-y-2 text-sm text-[#D4AF37]/70">
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={5}
              placeholder="Add any payment instructions or line item summary."
              className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#07070A] hover:bg-[#D4AF37]/90 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Creating invoice...' : 'Create Invoice'}
          </button>
        </div>

        <aside className="space-y-6 rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6">
          <div className="space-y-3">
            <p className="text-sm text-[#D4AF37]/70">Invoice preview</p>
            <div className="rounded-3xl bg-[#11151E] p-4">
              <p className="text-sm text-[#D4AF37]/50">Invoice number</p>
              <p className="text-lg font-semibold text-white">{invoiceNumber}</p>
            </div>
            <div className="rounded-3xl bg-[#11151E] p-4">
              <p className="text-sm text-[#D4AF37]/50">Expected collection</p>
              <p className="text-lg font-semibold text-white">₦{(totalAmount / 1000000).toFixed(1)}M</p>
            </div>
          </div>
          <div className="rounded-3xl bg-[#11151E] p-4">
            <p className="text-sm text-[#D4AF37]/50">Payment terms</p>
            <p className="text-sm text-white">Due on {dueDate || 'next billing date'}</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
