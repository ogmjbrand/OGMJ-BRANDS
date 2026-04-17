'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, MoreHorizontal, AlertCircle } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { listContacts } from '@/lib/services/crm';
import { CreateContactModal } from '@/components/CreateContactModal';
import type { Contact } from '@/lib/types';

export default function ContactsPage() {
  const { currentBusiness } = useBusinessContext();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  async function loadContacts() {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await listContacts(currentBusiness.id, {
        page: 1,
        pageSize: 20,
        search: search || undefined,
      });

      if (result.success && result.data) {
        setContacts(result.data.items || []);
      } else {
        setError(result.error?.message || 'Failed to load contacts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadContacts();
    }, 300);

    return () => clearTimeout(timer);
  }, [currentBusiness, search]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Contacts</h1>
          <p className="text-[#D4AF37]/70 mt-2">Manage your CRM contacts</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#07070A] rounded-lg font-semibold hover:bg-[#D4AF37]/90 transition">
          <Plus className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-[#D4AF37]/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#0E1116] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]/60 transition"
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
          <p className="text-[#FF6B6B] text-sm">{error}</p>
        </div>
      )}

      {/* Contacts Table */}
      <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <div className="inline-block w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
              <p className="text-[#D4AF37]/70">Loading contacts...</p>
            </div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[#D4AF37]/70 mb-4">No contacts yet</p>
            <button className="px-4 py-2 bg-[#D4AF37]/20 text-[#D4AF37] rounded-lg font-medium hover:bg-[#D4AF37]/30 transition">
              Add your first contact
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D4AF37]/10 bg-[#07070A]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Lead Score</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-[#D4AF37]/10 hover:bg-[#07070A]/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-sm text-[#D4AF37]/50">{contact.job_title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#D4AF37]/70">{contact.email}</td>
                    <td className="px-6 py-4 text-sm text-[#D4AF37]/70">{contact.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#D4AF37]/70">{contact.lead_score || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-[#D4AF37]/50 hover:text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/10 transition">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Contact Modal */}
      <CreateContactModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => loadContacts()}
      />
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    lead: 'bg-blue-500/20 text-blue-400',
    prospect: 'bg-purple-500/20 text-purple-400',
    customer: 'bg-green-500/20 text-green-400',
    inactive: 'bg-gray-500/20 text-gray-400',
    archived: 'bg-red-500/20 text-red-400',
  };
  return colors[status] || 'bg-[#D4AF37]/20 text-[#D4AF37]';
}
