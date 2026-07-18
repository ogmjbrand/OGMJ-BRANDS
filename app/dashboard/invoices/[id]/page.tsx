'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Send, CheckCircle2, CircleDollarSign } from 'lucide-react';
import {
  getInvoice,
  markInvoiceAsSent,
  markInvoiceAsPaid,
} from '@/lib/services/invoices.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadInvoice() {
      if (!params.id) return;
      setLoading(true);
      try {
        const data = await getInvoice(params.id);
        setInvoice(data);
      } catch (err) {
        console.error('Failed to load invoice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [params.id]);

  async function handleSendInvoice() {
    if (!invoice) return;

    setActionLoading(true);
    try {
      const updated = await markInvoiceAsSent(invoice.id);
      setInvoice(updated as any);
    } catch (err) {
      console.error('Failed to send invoice:', err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkPaid() {
    if (!invoice || invoice.status === 'paid') return;
    if (!window.confirm(`Mark invoice ${invoice.invoice_number} as fully paid?`)) return;

    setActionLoading(true);
    try {
      const updated = await markInvoiceAsPaid(invoice.id);
      setInvoice(updated as any);
    } catch (err) {
      console.error('Failed to mark payment:', err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownloadPdf() {
    const invoiceNode = document.getElementById('invoice-preview');
    if (!invoiceNode) return;

    setActionLoading(true);
    try {
      const canvas = await html2canvas(invoiceNode, { backgroundColor: '#0E1116', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      pdf.save(`${invoice.invoice_number}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="inline-block w-8 h-8 animate-spin rounded-full border-4 border-[#C8FF00]/20 border-t-[#C8FF00]"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center p-12 text-[#C8FF00]/70">Invoice not found.</div>
    );
  }

  const outstanding = invoice.status === 'paid' ? 0 : Number(invoice.total) || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push('/dashboard/invoices')}
          className="inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/20 bg-[#0E1116] px-4 py-2 text-sm text-[#C8FF00] hover:bg-[#C8FF00]/10 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to invoices
        </button>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-full bg-[#C8FF00] px-5 py-3 text-sm font-semibold text-[#07070A] hover:bg-[#C8FF00]/90 transition disabled:opacity-60"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button
            onClick={handleSendInvoice}
            disabled={actionLoading || invoice.status === 'sent' || invoice.status === 'paid'}
            className="inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/20 bg-[#07070A] px-5 py-3 text-sm font-semibold text-[#C8FF00] hover:bg-[#C8FF00]/10 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Mark as Sent
          </button>
          <button
            onClick={handleMarkPaid}
            disabled={actionLoading || outstanding <= 0}
            className="inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/20 bg-[#07070A] px-5 py-3 text-sm font-semibold text-[#C8FF00] hover:bg-[#C8FF00]/10 transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark as Paid
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section id="invoice-preview" className="space-y-6 rounded-3xl border border-[#C8FF00]/10 bg-[#0E1116] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#C8FF00]/70">Invoice</p>
              <h1 className="text-3xl font-bold text-white">{invoice.invoice_number}</h1>
              <p className="text-[#C8FF00]/70 mt-2">Created on {new Date(invoice.created_at).toLocaleDateString()}</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#11151E] px-4 py-2 text-sm text-[#C8FF00]">
              <CircleDollarSign className="w-4 h-4" /> {invoice.status?.toUpperCase()}
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl bg-[#11151E] p-4">
              <p className="text-sm text-[#C8FF00]/60">Subtotal</p>
              <p className="text-xl font-semibold text-white">₦{Number(invoice.subtotal).toLocaleString('en-NG')}</p>
            </div>
            <div className="rounded-3xl bg-[#11151E] p-4">
              <p className="text-sm text-[#C8FF00]/60">Total Amount</p>
              <p className="text-xl font-semibold text-white">₦{Number(invoice.total).toLocaleString('en-NG')}</p>
            </div>
            <div className="rounded-3xl bg-[#11151E] p-4">
              <p className="text-sm text-[#C8FF00]/60">Outstanding</p>
              <p className="text-xl font-semibold text-white">₦{outstanding.toLocaleString('en-NG')}</p>
            </div>
          </div>

          <div className="rounded-3xl bg-[#11151E] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Invoice Summary</h2>
            <p className="text-[#C8FF00]/70 whitespace-pre-wrap">{invoice.notes || 'No additional notes provided.'}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-[#C8FF00]/60">Due Date</p>
                <p className="text-white">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <p className="text-sm text-[#C8FF00]/60">Client</p>
                <p className="text-white">{invoice.clients?.name || 'Unassigned'}</p>
              </div>
            </div>
          </div>

          {invoice.invoice_items?.length > 0 && (
            <div className="rounded-3xl bg-[#11151E] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Line Items</h2>
              <div className="space-y-3">
                {invoice.invoice_items.map((item: any) => (
                  <div key={item.id} className="rounded-3xl border border-[#C8FF00]/10 bg-[#0E1116] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-white font-medium">{item.description}</p>
                      <p className="text-sm text-[#C8FF00]/70">₦{Number(item.total).toLocaleString('en-NG')}</p>
                    </div>
                    <p className="text-[#C8FF00]/60 text-sm mt-2">Qty: {item.quantity || 1} × ₦{Number(item.unit_price).toLocaleString('en-NG')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6 rounded-3xl border border-[#C8FF00]/10 bg-[#0E1116] p-6">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.24em] text-[#C8FF00]/70">Payment status</p>
            <p className="text-3xl font-semibold text-white">{invoice.status?.toUpperCase()}</p>
          </div>
          <div className="rounded-3xl bg-[#11151E] p-4">
            <p className="text-sm text-[#C8FF00]/60">Next step</p>
            <p className="text-white mt-2">{invoice.status === 'paid' ? 'Invoice settled' : 'Send the invoice or collect payment.'}</p>
          </div>
          <div className="rounded-3xl bg-[#11151E] p-4">
            <p className="text-sm text-[#C8FF00]/60">Client</p>
            <p className="text-white mt-2">{invoice.clients?.name || 'Unassigned'}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
