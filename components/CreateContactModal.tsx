'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createContact, updateContact } from '@/lib/services/crm';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import type { Contact, CreateContactInput } from '@/lib/types';

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contact?: Contact | null;
}

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  companyName: '',
};

export function CreateContactModal({
  isOpen,
  onClose,
  onSuccess,
  contact,
}: CreateContactModalProps) {
  const { currentBusiness } = useBusinessContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const isEditing = Boolean(contact);

  useEffect(() => {
    if (!isOpen) return;
    if (contact) {
      setFormData({
        firstName: contact.first_name || '',
        lastName: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        jobTitle: contact.job_title || '',
        companyName: contact.company_name || '',
      });
    } else {
      setFormData(emptyForm);
    }
    setError(null);
  }, [isOpen, contact]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!formData.firstName || !formData.email) {
      setError('First name and email are required');
      return;
    }

    setLoading(true);

    try {
      const result = isEditing && contact
        ? await updateContact(currentBusiness.id, contact.id, {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone || undefined,
            job_title: formData.jobTitle || undefined,
            company_name: formData.companyName || undefined,
          })
        : await createContact(currentBusiness.id, {
            business_id: currentBusiness.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone || undefined,
            job_title: formData.jobTitle || undefined,
            company_name: formData.companyName || undefined,
          } as CreateContactInput);

      if (result.success) {
        setFormData(emptyForm);
        onSuccess();
        onClose();
      } else {
        setError(result.error?.message || `Failed to ${isEditing ? 'update' : 'create'} contact`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0E1116] border border-[#C8FF00]/20 rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{isEditing ? 'Edit Contact' : 'Create Contact'}</h2>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#C8FF00] mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                className="w-full px-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-lg text-white placeholder-[#C8FF00]/30 focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C8FF00] mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                className="w-full px-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-lg text-white placeholder-[#C8FF00]/30 focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#C8FF00] mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full px-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-lg text-white placeholder-[#C8FF00]/30 focus:outline-none focus:border-[#C8FF00]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#C8FF00] mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-lg text-white placeholder-[#C8FF00]/30 focus:outline-none focus:border-[#C8FF00]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#C8FF00] mb-1">
                Job Title
              </label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="CEO"
                className="w-full px-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-lg text-white placeholder-[#C8FF00]/30 focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#C8FF00] mb-1">
                Company
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Company Inc"
                className="w-full px-3 py-2 bg-[#07070A] border border-[#C8FF00]/20 rounded-lg text-white placeholder-[#C8FF00]/30 focus:outline-none focus:border-[#C8FF00]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#C8FF00]/10 text-[#C8FF00] rounded-lg font-medium hover:bg-[#C8FF00]/20 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#C8FF00] text-[#07070A] rounded-lg font-medium hover:bg-[#C8FF00]/90 disabled:opacity-50 transition"
            >
              {loading ? (isEditing ? 'Saving...' : 'Creating...') : isEditing ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


