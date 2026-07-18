'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, DollarSign } from 'lucide-react';
import { createDeal, updateDeal } from '@/lib/services/crm';
import { listContacts } from '@/lib/services/crm';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import type { CreateDealInput, Contact, Deal } from '@/lib/types';

interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deal?: Deal | null;
  initialStage?: string;
}

const emptyForm = {
  contactId: '',
  title: '',
  value: '',
  currency: 'NGN' as const,
  stage: 'prospecting' as const,
  expectedCloseDate: '',
  description: '',
};

export function CreateDealModal({
  isOpen,
  onClose,
  onSuccess,
  deal,
  initialStage,
}: CreateDealModalProps) {
  const { currentBusiness } = useBusinessContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const isEditing = Boolean(deal);

  const loadContacts = async () => {
    if (!currentBusiness) return;

    setLoadingContacts(true);
    try {
      const result = await listContacts(currentBusiness.id, { pageSize: 100 });
      if (result.success && result.data) {
        setContacts(result.data.items);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Load contacts when modal opens
  useEffect(() => {
    if (isOpen && currentBusiness) {
      loadContacts();
    }
  }, [isOpen, currentBusiness]);

  useEffect(() => {
    if (!isOpen) return;
    if (deal) {
      setFormData({
        contactId: deal.contact_id || '',
        title: deal.title || '',
        value: deal.value != null ? String(deal.value) : '',
        currency: (deal.currency as any) || 'NGN',
        stage: (deal.stage as any) || 'prospecting',
        expectedCloseDate: deal.expected_close_date || '',
        description: deal.description || '',
      });
    } else {
      setFormData({ ...emptyForm, stage: (initialStage as any) || emptyForm.stage });
    }
    setError(null);
  }, [isOpen, deal, initialStage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentBusiness) {
      setError('No business selected');
      return;
    }

    if (!formData.contactId || !formData.title || !formData.value) {
      setError('Contact, title, and value are required');
      return;
    }

    const value = parseFloat(formData.value);
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid deal value');
      return;
    }

    setLoading(true);

    try {
      const result = isEditing && deal
        ? await updateDeal(currentBusiness.id, deal.id, {
            contact_id: formData.contactId,
            title: formData.title,
            value,
            currency: formData.currency,
            stage: formData.stage,
            expected_close_date: formData.expectedCloseDate || undefined,
            description: formData.description || undefined,
          })
        : await createDeal(currentBusiness.id, {
            business_id: currentBusiness.id,
            contact_id: formData.contactId,
            title: formData.title,
            value,
            currency: formData.currency,
            stage: formData.stage,
            expected_close_date: formData.expectedCloseDate || undefined,
            description: formData.description || undefined,
          } as CreateDealInput);

      if (result.success) {
        setFormData(emptyForm);
        onSuccess();
        onClose();
      } else {
        setError(result.error?.message || `Failed to ${isEditing ? 'update' : 'create'} deal`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#0E1116] border border-[#C8FF00]/20 rounded-xl p-6 max-w-lg w-full mx-4 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{isEditing ? 'Edit Deal' : 'Create Deal'}</h2>
          <button
            onClick={onClose}
            className="p-1 text-[#C8FF00]/50 hover:text-[#C8FF00] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-lg flex gap-2">
            <AlertCircle className="w-4 h-4 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#FF6B6B]">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Selection */}
          <div>
            <label className="block text-xs font-medium text-[#C8FF00] mb-1">
              Contact *
            </label>
            <select
              name="contactId"
              value={formData.contactId}
              onChange={handleChange}
              disabled={loadingContacts}
              className="w-full px-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-lg text-white focus:outline-none focus:border-[#C8FF00] disabled:opacity-50"
            >
              <option value="">
                {loadingContacts ? 'Loading contacts...' : 'Select a contact'}
              </option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name} - {contact.email}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[#C8FF00] mb-1">
              Deal Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Website Development Project"
              className="w-full px-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-lg text-white placeholder-[#C8FF00]/30 focus:outline-none focus:border-[#C8FF00]"
            />
          </div>

          {/* Value and Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#C8FF00] mb-1">
                Value *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#C8FF00]/50" />
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  placeholder="50000"
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-lg text-white placeholder-[#C8FF00]/30 focus:outline-none focus:border-[#C8FF00]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C8FF00] mb-1">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-lg text-white focus:outline-none focus:border-[#C8FF00]"
              >
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Stage and Expected Close Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#C8FF00] mb-1">
                Stage
              </label>
              <select
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-lg text-white focus:outline-none focus:border-[#C8FF00]"
              >
                <option value="prospecting">Prospecting</option>
                <option value="qualification">Qualification</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="decision">Decision</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C8FF00] mb-1">
                Expected Close Date
              </label>
              <input
                type="date"
                name="expectedCloseDate"
                value={formData.expectedCloseDate}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-lg text-white focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#C8FF00] mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Deal details and requirements..."
              rows={3}
              className="w-full px-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-lg text-white placeholder-[#C8FF00]/30 focus:outline-none focus:border-[#C8FF00] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#C8FF00]/10 text-[#C8FF00]/70 rounded-lg font-medium hover:bg-[#C8FF00]/20 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#C8FF00] text-[#07070A] rounded-lg font-semibold hover:bg-[#C8FF00]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isEditing ? 'Saving...' : 'Creating...') : isEditing ? 'Save Changes' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

