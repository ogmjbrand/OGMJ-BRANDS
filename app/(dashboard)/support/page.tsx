'use client';

import React, { useState } from 'react';
import { MessageSquare, Plus, Search, AlertCircle } from 'lucide-react';

interface Ticket {
  id: string;
  number: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created: string;
  replies: number;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: '1',
      number: 'TKT-1726750422-A1B2C',
      title: 'Cannot create new contact',
      status: 'open',
      priority: 'high',
      created: '2 hours ago',
      replies: 2,
    },
    {
      id: '2',
      number: 'TKT-1726664022-D3E4F',
      title: 'Payment processing error',
      status: 'in_progress',
      priority: 'urgent',
      created: '1 day ago',
      replies: 5,
    },
    {
      id: '3',
      number: 'TKT-1726577622-G5H6I',
      title: 'Feature request: bulk export',
      status: 'resolved',
      priority: 'low',
      created: '2 days ago',
      replies: 3,
    },
  ]);
  const [search, setSearch] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/20 text-blue-400';
      case 'in_progress':
        return 'bg-amber-500/20 text-amber-400';
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
      t.number.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase())
  );

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
          { label: 'Open', value: '3', color: 'text-blue-400' },
          { label: 'In Progress', value: '1', color: 'text-amber-400' },
          { label: 'Resolved', value: '12', color: 'text-green-400' },
          { label: 'Closed', value: '45', color: 'text-gray-400' },
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
            placeholder="Search by ticket number or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
        <select className="px-4 py-2 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white focus:outline-none focus:border-[#D4AF37]">
          <option>All Status</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
          <option>Closed</option>
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
                Replies
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
                    {ticket.number}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#D4AF37]/50" />
                      <span className="text-white">{ticket.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
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
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-white">{ticket.replies}</td>
                  <td className="px-6 py-3 text-[#D4AF37]/70 text-sm">{ticket.created}</td>
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
