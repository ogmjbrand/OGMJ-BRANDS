'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare, Plus, Search, AlertCircle, Sparkles } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { getSupportTickets, createSupportTicket } from '@/lib/services/support.service';
import type { SupportTicket } from '@/lib/services/support.service';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards';

export default function SupportPage() {
  const { currentBusiness } = useBusinessContext();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTicketCategory, setNewTicketCategory] = useState('General');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  async function handleCreateTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentBusiness) {
      setFormError('Please select a business before creating a ticket.');
      return;
    }

    setCreatingTicket(true);
    setFormError(null);

    const result = await createSupportTicket(currentBusiness.id, {
      subject: newTicketSubject,
      description: newTicketDescription,
      priority: newTicketPriority,
      category: newTicketCategory,
    });

    if (!result.success) {
      setFormError(result.error?.message || 'Failed to create ticket.');
      setCreatingTicket(false);
      return;
    }

    setNewTicketSubject('');
    setNewTicketDescription('');
    setNewTicketPriority('medium');
    setNewTicketCategory('General');
    setIsDialogOpen(false);
    setCreatingTicket(false);
    loadTickets();
  }

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

  const filteredTickets = tickets.filter((t) => {
    const contactName = [t.contact?.firstName, t.contact?.lastName].filter(Boolean).join(' ').toLowerCase();
    return (
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      contactName.includes(search.toLowerCase()) ||
      t.contact?.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const stats = {
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#D4AF37]/20 border-t-[#D4AF37]" />
          <p className="text-[#D4AF37]/70">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="space-y-4 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <p className="text-red-400">{error}</p>
          <button onClick={loadTickets} className="rounded-lg bg-[#D4AF37] px-4 py-2 font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#D4AF37]/10 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
              <Sparkles className="h-4 w-4" /> Care system
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Support flow that feels responsive, calm and premium.</h1>
            <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Every request stays visible, categorized and ready for the next best reply.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2 font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90" size="sm">
                <Plus className="h-4 w-4" /> New ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create new support ticket</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTicket} className="space-y-4 pt-2">
                <div className="space-y-4">
                  {formError && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{formError}</div>}
                  <label className="space-y-2 text-sm text-[#D4AF37]/70">
                    Subject
                    <input type="text" value={newTicketSubject} onChange={(e) => setNewTicketSubject(e.target.value)} className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#D4AF37]" placeholder="Enter the ticket title" required />
                  </label>
                  <label className="space-y-2 text-sm text-[#D4AF37]/70">
                    Description
                    <textarea value={newTicketDescription} onChange={(e) => setNewTicketDescription(e.target.value)} className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#D4AF37]" rows={5} placeholder="Describe the issue, request, or question." />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-[#D4AF37]/70">
                      Priority
                      <select value={newTicketPriority} onChange={(e) => setNewTicketPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')} className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#D4AF37]">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </label>
                    <label className="space-y-2 text-sm text-[#D4AF37]/70">
                      Category
                      <input type="text" value={newTicketCategory} onChange={(e) => setNewTicketCategory(e.target.value)} className="w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#D4AF37]" placeholder="e.g. Billing, Product, Technical" />
                    </label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creatingTicket}>{creatingTicket ? 'Creating...' : 'Create ticket'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Open" value={stats.open.toString()} description="Requests awaiting attention" icon={MessageSquare} accent="gold" trend="Active" />
        <MetricCard title="In progress" value={stats.inProgress.toString()} description="Tickets already being worked" icon={MessageSquare} accent="emerald" trend="Flow" />
        <MetricCard title="Resolved" value={stats.resolved.toString()} description="Issues completed successfully" icon={MessageSquare} accent="slate" trend="Healthy" />
        <MetricCard title="Closed" value={stats.closed.toString()} description="Completed and archived" icon={MessageSquare} accent="gold" trend="Done" />
      </div>

      <SectionPanel title="Ticket queue" subtitle="Search, filter and stay on top of every customer request">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#D4AF37]/50" />
            <input type="text" placeholder="Search by ticket number, title, or contact..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-full border border-[#D4AF37]/10 bg-[#07070A] py-2 pl-10 pr-4 text-white outline-none focus:border-[#D4AF37]" />
          </div>
          <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-full border border-[#D4AF37]/10 bg-[#07070A] px-4 py-2 text-white outline-none focus:border-[#D4AF37]">
            <option value="">All status</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="waiting_for_customer">Waiting for customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select id="priority-filter" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="rounded-full border border-[#D4AF37]/10 bg-[#07070A] px-4 py-2 text-white outline-none focus:border-[#D4AF37]">
            <option value="">All priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-[1.35rem] border border-[#D4AF37]/10 bg-[#11151E]">
          <table className="w-full">
            <thead className="border-b border-[#D4AF37]/10 bg-[#07070A]">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#D4AF37]">Ticket</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#D4AF37]">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#D4AF37]">Priority</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#D4AF37]">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#D4AF37]">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#D4AF37]">Created</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#D4AF37]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {filteredTickets.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-[#F8F9FA]/60">No tickets found.</td></tr>
              ) : filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="transition hover:bg-[#0E1116]/50">
                  <td className="px-6 py-3 font-mono text-sm text-[#D4AF37]">{ticket.ticketNumber}</td>
                  <td className="px-6 py-3"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-[#D4AF37]/50" /><span className="text-white">{ticket.subject}</span></div></td>
                  <td className="px-6 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span></td>
                  <td className="px-6 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusColor(ticket.status)}`}>{ticket.status.replace('_', ' ')}</span></td>
                  <td className="px-6 py-3 text-white">{ticket.contact ? `${ticket.contact.firstName} ${ticket.contact.lastName}` : 'N/A'}</td>
                  <td className="px-6 py-3 text-sm text-[#F8F9FA]/60">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3"><button className="text-sm font-medium text-[#D4AF37] transition hover:text-white">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  );
}

