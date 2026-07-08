'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Eye, Trash2, Edit2, Sparkles, Receipt, CircleDollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { listInvoices, deleteInvoice, getInvoiceStats } from '@/lib/services/invoices.service';
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards';

interface Invoice {
  id: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'partially_paid';
  contact_id?: string;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  created_at: string;
}

interface Stats {
  total_invoices: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  total_revenue: number;
  paid_revenue: number;
  outstanding: number;
}

export default function InvoicesPage() {
  const router = useRouter();
  const { currentBusiness } = useBusinessContext();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!currentBusiness) return;
    loadInvoices();
  }, [currentBusiness, filter]);

  async function loadInvoices() {
    try {
      setLoading(true);
      const [invoiceData, statsData] = await Promise.all([
        listInvoices(currentBusiness!.id, {
          status: filter === 'all' ? undefined : filter,
          limit: 100,
        }),
        getInvoiceStats(currentBusiness!.id),
      ]);

      setInvoices(invoiceData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteInvoice(invoiceId: string) {
    try {
      await deleteInvoice(invoiceId);
      setInvoices(invoices.filter((inv) => inv.id !== invoiceId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    }
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-500/20 text-slate-300',
    sent: 'bg-blue-500/20 text-blue-300',
    viewed: 'bg-purple-500/20 text-purple-300',
    paid: 'bg-green-500/20 text-green-300',
    overdue: 'bg-red-500/20 text-red-300',
    cancelled: 'bg-gray-500/20 text-gray-300',
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#D4AF37]/10 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
              <Sparkles className="h-4 w-4" /> Revenue operations
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Invoice management that keeps cash flow visible and confident.</h1>
            <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Create, review and monitor invoices with the same polish as the rest of your empire operations.</p>
          </div>
          <button onClick={() => router.push('/dashboard/invoices/new')} className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90">
            <Plus className="h-4 w-4" /> New invoice
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total invoices" value={stats.total_invoices.toString()} description="All invoices in your records" icon={Receipt} accent="gold" trend="Live" />
          <MetricCard title="Total revenue" value={`₦${(stats.total_revenue / 1000000).toFixed(1)}M`} description="Invoice value created" icon={CircleDollarSign} accent="emerald" trend="Tracked" />
          <MetricCard title="Paid" value={`₦${(stats.paid_revenue / 1000000).toFixed(1)}M`} description="Revenue already collected" icon={CircleDollarSign} accent="slate" trend="Healthy" />
          <MetricCard title="Outstanding" value={`₦${(stats.outstanding / 1000000).toFixed(1)}M`} description="Pending collection balance" icon={CircleDollarSign} accent="gold" trend="Watch" />
        </div>
      )}

      <SectionPanel title="Invoice overview" subtitle="Filter by status and stay on top of collection health">
        <div className="flex flex-wrap gap-2 border-b border-[#D4AF37]/10 pb-3">
          {['all', 'draft', 'sent', 'paid', 'overdue'].map((status) => (
            <button key={status} onClick={() => setFilter(status)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === status ? 'bg-[#D4AF37] text-[#07070A]' : 'bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20'}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#D4AF37]/20 border-t-[#D4AF37]" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-[1.35rem] border border-[#D4AF37]/10 bg-[#11151E] p-12 text-center">
            <p className="mb-4 text-[#D4AF37]/70">No invoices found</p>
            <button onClick={() => router.push('/dashboard/invoices/new')} className="font-medium text-[#D4AF37] transition hover:text-white">
              Create your first invoice →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[1.35rem] border border-[#D4AF37]/10 bg-[#11151E]">
            <table className="w-full">
              <thead className="border-b border-[#D4AF37]/10 bg-[#07070A]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#D4AF37]/70">Invoice</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#D4AF37]/70">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#D4AF37]/70">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#D4AF37]/70">Due date</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-[#D4AF37]/70">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-[#D4AF37]/5 transition hover:bg-[#0E1116]/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{invoice.invoice_number}</p>
                        <p className="text-sm text-[#D4AF37]/50">{new Date(invoice.created_at).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">₦{(invoice.total_amount / 1000000).toFixed(1)}M</p>
                        <p className="text-sm text-[#D4AF37]/50">Paid: ₦{(invoice.paid_amount / 1000000).toFixed(1)}M</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[invoice.status] || statusColors.draft}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#D4AF37]/70">{new Date(invoice.due_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)} className="rounded p-2 transition hover:bg-[#D4AF37]/10" title="View">
                          <Eye className="h-4 w-4 text-[#D4AF37]" />
                        </button>
                        <button onClick={() => router.push(`/dashboard/invoices/${invoice.id}/edit`)} className="rounded p-2 transition hover:bg-[#D4AF37]/10" title="Edit">
                          <Edit2 className="h-4 w-4 text-[#D4AF37]" />
                        </button>
                        <button onClick={() => setDeleteConfirm(invoice.id)} className="rounded p-2 transition hover:bg-red-500/10" title="Delete">
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionPanel>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-sm rounded-[1.35rem] border border-[#D4AF37]/20 bg-[#0E1116] p-6">
            <p className="mb-4 font-semibold text-white">Delete invoice?</p>
            <p className="mb-6 text-sm text-[#D4AF37]/70">This action cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-lg border border-[#D4AF37]/20 px-4 py-2 text-[#D4AF37] transition hover:bg-[#D4AF37]/10">
                Cancel
              </button>
              <button onClick={() => handleDeleteInvoice(deleteConfirm)} className="flex-1 rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-2 text-red-300 transition hover:bg-red-500/30">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


