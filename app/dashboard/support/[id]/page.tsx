'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import {
  getSupportTicket,
  getTicketReplies,
  createTicketReply,
  updateSupportTicket,
  type SupportTicket,
  type TicketReply,
} from '@/lib/services/support.service';
import { getCurrentUser } from '@/lib/auth';

const STATUS_OPTIONS = ['open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed'] as const;
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const;

function getStatusColor(status: string) {
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
      return 'bg-[#C8FF00]/20 text-[#C8FF00]';
  }
}

function getPriorityColor(priority: string) {
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
      return 'bg-[#C8FF00]/20 text-[#C8FF00]';
  }
}

export default function SupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function loadTicket() {
    try {
      setLoading(true);
      setError(null);

      const [ticketResult, repliesResult, user] = await Promise.all([
        getSupportTicket(ticketId),
        getTicketReplies(ticketId),
        getCurrentUser(),
      ]);

      if (ticketResult.success && ticketResult.data) {
        setTicket(ticketResult.data);
      } else {
        setError(ticketResult.error?.message || 'Failed to load ticket');
      }

      if (repliesResult.success && repliesResult.data) {
        setReplies(repliesResult.data);
      }

      setCurrentUserId(user?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ticketId) loadTicket();
  }, [ticketId]);

  async function handleSendReply() {
    if (!replyText.trim() || sendingReply) return;
    setSendingReply(true);
    const result = await createTicketReply(ticketId, { body: replyText.trim() });
    if (result.success && result.data) {
      setReplies((prev) => [...prev, result.data!]);
      setReplyText('');
    } else {
      alert(result.error?.message || 'Failed to send reply');
    }
    setSendingReply(false);
  }

  async function handleStatusChange(status: string) {
    if (!ticket) return;
    setUpdatingStatus(true);
    const result = await updateSupportTicket(ticket.id, { status: status as any });
    if (result.success && result.data) {
      setTicket(result.data);
    } else {
      alert(result.error?.message || 'Failed to update status');
    }
    setUpdatingStatus(false);
  }

  async function handlePriorityChange(priority: string) {
    if (!ticket) return;
    setUpdatingStatus(true);
    const result = await updateSupportTicket(ticket.id, { priority: priority as any });
    if (result.success && result.data) {
      setTicket(result.data);
    } else {
      alert(result.error?.message || 'Failed to update priority');
    }
    setUpdatingStatus(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#C8FF00]/20 border-t-[#C8FF00]" />
          <p className="text-[#C8FF00]/70">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="space-y-4 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <p className="text-red-400">{error || 'Ticket not found'}</p>
          <button onClick={() => router.push('/dashboard/support')} className="rounded-lg bg-[#C8FF00] px-4 py-2 font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90">
            Back to tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/support" className="inline-flex items-center gap-2 text-sm text-[#C8FF00]/70 transition hover:text-[#C8FF00]">
        <ArrowLeft className="h-4 w-4" /> Back to tickets
      </Link>

      <div className="rounded-[1.6rem] border border-[#C8FF00]/10 bg-[#0E1116] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-sm text-[#C8FF00]/70">{ticket.ticketNumber}</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">{ticket.subject}</h1>
            {ticket.description && <p className="mt-3 whitespace-pre-wrap text-sm text-[#F8F9FA]/70">{ticket.description}</p>}
            <p className="mt-3 text-xs text-[#F8F9FA]/50">Opened {new Date(ticket.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <select
              value={ticket.status}
              disabled={updatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`rounded-full border-none px-3 py-1.5 text-xs font-medium capitalize outline-none disabled:opacity-60 ${getStatusColor(ticket.status)}`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-[#0E1116] text-white">{s.replace('_', ' ')}</option>
              ))}
            </select>
            <select
              value={ticket.priority}
              disabled={updatingStatus}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className={`rounded-full border-none px-3 py-1.5 text-xs font-medium capitalize outline-none disabled:opacity-60 ${getPriorityColor(ticket.priority)}`}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p} className="bg-[#0E1116] text-white">{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-[#C8FF00]/10 bg-[#0E1116] p-6">
        <h2 className="text-lg font-semibold text-white">Conversation</h2>
        <div className="mt-4 space-y-4">
          {replies.length === 0 ? (
            <p className="text-sm text-[#F8F9FA]/50">No replies yet. Start the conversation below.</p>
          ) : (
            replies.map((reply) => {
              const isMine = reply.createdBy === currentUserId;
              return (
                <div key={reply.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-[1.1rem] px-4 py-3 text-sm leading-6 ${
                      isMine ? 'bg-[#C8FF00]/15 text-white' : 'border border-[#C8FF00]/10 bg-[#11151E] text-[#F8F9FA]/85'
                    }`}
                  >
                    <p>{reply.body}</p>
                    <p className="mt-1 text-xs text-[#F8F9FA]/40">{new Date(reply.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
            placeholder="Write a reply..."
            className="flex-1 rounded-full border border-[#C8FF00]/10 bg-[#07070A] px-4 py-2 text-white outline-none placeholder:text-[#F8F9FA]/40 focus:border-[#C8FF00]"
          />
          <button
            onClick={handleSendReply}
            disabled={sendingReply || !replyText.trim()}
            className="rounded-full bg-[#C8FF00] px-4 py-2 font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
