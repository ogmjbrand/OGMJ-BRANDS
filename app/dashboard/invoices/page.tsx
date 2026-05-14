'use client';

import React, { useEffect, useState } from 'react';
import { Plus, MoreVertical, Eye, Download, Send, Trash2, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { listInvoices, deleteInvoice, getInvoiceStats } from '@/lib/services/invoices.service';

interface Invoice {
  id: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Invoices</h1>
          <p className="text-[#D4AF37]/70">Manage and track client invoices</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/invoices/new')}
          className="flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#D4AF37]/90 transition"
        >
          <Plus className="w-5 h-5" />
          New Invoice
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-[#D4AF37]/20 rounded-xl p-6">
            <p className="text-[#D4AF37]/70 text-sm font-medium mb-2">Total Invoices</p>
            <p className="text-3xl font-bold text-white">{stats.total_invoices}</p>
          </div>
          <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-[#D4AF37]/20 rounded-xl p-6">
            <p className="text-[#D4AF37]/70 text-sm font-medium mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-white">₦{(stats.total_revenue / 1000000).toFixed(1)}M</p>
          </div>
          <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-green-500/20 rounded-xl p-6">
            <p className="text-green-400/70 text-sm font-medium mb-2">Paid</p>
            <p className="text-3xl font-bold text-green-300">₦{(stats.paid_revenue / 1000000).toFixed(1)}M</p>
          </div>
          <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-red-500/20 rounded-xl p-6">
            <p className="text-red-400/70 text-sm font-medium mb-2">Outstanding</p>
            <p className="text-3xl font-bold text-red-300">₦{(stats.outstanding / 1000000).toFixed(1)}M</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-3 border-b border-[#D4AF37]/10">
        {['all', 'draft', 'sent', 'paid', 'overdue'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-3 font-medium transition ${
              filter === status
                ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                : 'text-[#D4AF37]/50 hover:text-[#D4AF37]'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-[#D4AF37]/20 rounded-xl p-12 text-center">
          <p className="text-[#D4AF37]/70 mb-4">No invoices found</p>
          <button
            onClick={() => router.push('/dashboard/invoices/new')}
            className="text-[#D4AF37] hover:text-white transition font-medium"
          >
            Create your first invoice →
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-[#D4AF37]/20 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-[#D4AF37]/10">
              <tr>
                <th className="px-6 py-4 text-left text-[#D4AF37]/70 text-sm font-medium">Invoice</th>
                <th className="px-6 py-4 text-left text-[#D4AF37]/70 text-sm font-medium">Amount</th>
                <th className="px-6 py-4 text-left text-[#D4AF37]/70 text-sm font-medium">Status</th>
                <th className="px-6 py-4 text-left text-[#D4AF37]/70 text-sm font-medium">Due Date</th>
                <th className="px-6 py-4 text-right text-[#D4AF37]/70 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-[#D4AF37]/5 hover:bg-[#0E1116]/50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">{invoice.invoice_number}</p>
                      <p className="text-[#D4AF37]/50 text-sm">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">₦{(invoice.total_amount / 1000000).toFixed(1)}M</p>
                      <p className="text-[#D4AF37]/50 text-sm">
                        Paid: ₦{(invoice.paid_amount / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status] || statusColors.draft}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#D4AF37]/70 text-sm">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                        className="p-2 hover:bg-[#D4AF37]/10 rounded transition"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-[#D4AF37]" />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/invoices/${invoice.id}/edit`)}
                        className="p-2 hover:bg-[#D4AF37]/10 rounded transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-[#D4AF37]" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(invoice.id)}
                        className="p-2 hover:bg-red-500/10 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0E1116] border border-[#D4AF37]/20 rounded-xl p-6 max-w-sm">
            <p className="text-white font-semibold mb-4">Delete invoice?</p>
            <p className="text-[#D4AF37]/70 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-[#D4AF37]/20 rounded-lg text-[#D4AF37] hover:bg-[#D4AF37]/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteInvoice(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 hover:bg-red-500/30 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
