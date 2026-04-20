'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare, Plus, Search, AlertCircle } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { getSupportTickets } from '@/lib/services/support.service';
import type { SupportTicket } from '@/lib/services/support.service';

export default function SupportPage() {
  const { currentBusiness } = useBusinessContext();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  async function loadTickets() {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getSupportTickets(currentBusiness.id, {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        limit: 100,
      });

      if (result.success && result.data) {
        setTickets(result.data.tickets || []);
      } else {
        setError(result.error?.message || 'Failed to load support tickets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to load support tickets:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, [currentBusiness, statusFilter, priorityFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/20 text-blue-400';
      case 'in_progress':
        return 'bg-amber-500/20 text-amber-400';
      case 'waiting_for_customer':
        return 'bg-purple-500/20 text-purple-400';
      case 'resolved':
        return 'bg-green-500/20 text-green-400';
      case 'closed':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-[#D4AF37]/20 text-[#D4AF37]';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400';
      case 'high':
        return 'bg-orange-500/20 text-orange-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'low':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-[#D4AF37]/20 text-[#D4AF37]';
    }
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      (t.contact?.firstName + ' ' + t.contact?.lastName).toLowerCase().includes(search.toLowerCase()) ||
      t.contact?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
          <p className="text-[#D4AF37]/70">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={loadTickets}
            className="px-4 py-2 bg-[#D4AF37] text-[#07070A] rounded-lg font-semibold hover:bg-[#D4AF37]/90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Support Tickets</h1>
          <p className="text-[#D4AF37]/70 mt-2">Manage your support requests</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#07070A] rounded-lg font-semibold hover:bg-[#D4AF37]/90 transition">
          <Plus className="w-5 h-5" />
          New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: stats.open.toString(), color: 'text-blue-400' },
          { label: 'In Progress', value: stats.inProgress.toString(), color: 'text-amber-400' },
          { label: 'Resolved', value: stats.resolved.toString(), color: 'text-green-400' },
          { label: 'Closed', value: stats.closed.toString(), color: 'text-gray-400' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-4 bg-[#0E1116] border border-[#D4AF37]/10 rounded-lg space-y-2"
          >
            <p className="text-sm text-[#D4AF37]/70">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#D4AF37]/50 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by ticket number, title, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white focus:outline-none focus:border-[#D4AF37]"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_for_customer">Waiting for Customer</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white focus:outline-none focus:border-[#D4AF37]"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D4AF37]/10">
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#D4AF37]">
                Ticket
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#D4AF37]">
                Title
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#D4AF37]">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#D4AF37]">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#D4AF37]">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#D4AF37]">
                Created
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#D4AF37]">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D4AF37]/10">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-[#D4AF37]/50">
                  No tickets found
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-[#0E1116]/50 transition cursor-pointer"
                >
                  <td className="px-6 py-3 font-mono text-sm text-[#D4AF37]">
                    {ticket.ticketNumber}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#D4AF37]/50" />
                      <span className="text-white">{ticket.subject}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium capitalize ${getPriorityColor(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-white">
                    {ticket.contact ? `${ticket.contact.firstName} ${ticket.contact.lastName}` : 'N/A'}
                  </td>
                  <td className="px-6 py-3 text-[#D4AF37]/70 text-sm">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <button className="text-[#D4AF37] hover:text-[#D4AF37]/70 font-medium text-sm">
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
