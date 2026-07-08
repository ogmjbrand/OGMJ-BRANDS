'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Building2, Rocket } from 'lucide-react';
import { createBusiness, listUserBusinesses } from '@/lib/services/business';
import type { Currency } from '@/lib/types';

const INDUSTRIES = [
  'Fashion & Apparel',
  'Food & Beverage',
  'Beauty & Personal Care',
  'Retail & E-commerce',
  'Professional Services',
  'Health & Wellness',
  'Technology',
  'Education',
  'Real Estate',
  'Media & Entertainment',
  'Logistics & Transport',
  'Other',
];

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'NGN', label: '₦ Nigerian Naira (NGN)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [currency, setCurrency] = useState<Currency>('NGN');
  const [teamSize, setTeamSize] = useState('');

  // Users who already have a business don't belong here.
  useEffect(() => {
    let cancelled = false;

    async function checkExistingBusiness() {
      try {
        const result = await listUserBusinesses();
        if (!cancelled && result.success && result.data && result.data.length > 0) {
          router.replace('/dashboard');
          return;
        }
      } catch {
        // If the check fails, stay on the form — creating is still possible.
      }
      if (!cancelled) setChecking(false);
    }

    checkExistingBusiness();
    return () => { cancelled = true; };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Business name is required');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const result = await createBusiness({
        name: name.trim(),
        industry: industry || undefined,
        country: country || undefined,
        currency,
        team_size: teamSize ? parseInt(teamSize, 10) : undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (!result.success || !result.data) {
        setError(result.error?.message || 'Failed to create business');
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#07070A] flex items-center justify-center">
        <div className="animate-pulse h-8 w-48 rounded bg-[#D4AF37]/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070A] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
            <Rocket className="h-4 w-4" /> Welcome to OGMJ Brands
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            Set up your business
          </h1>
          <p className="mt-2 text-sm text-[#F8F9FA]/60">
            Tell us about your business and we&apos;ll prepare your workspace,
            CRM pipeline and dashboard.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[1.5rem] border border-[#D4AF37]/10 bg-[#0E1116] p-6 sm:p-8 space-y-5"
        >
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="business-name" className="block text-sm font-medium text-white mb-1.5">
              Business name <span className="text-[#D4AF37]">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D4AF37]/50" />
              <input
                id="business-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Likiya Fast Fashion"
                required
                className="w-full rounded-xl border border-[#D4AF37]/15 bg-[#07070A] py-2.5 pl-10 pr-3 text-sm text-white placeholder-[#F8F9FA]/30 focus:border-[#D4AF37]/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-white mb-1.5">
              Industry
            </label>
            <select
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-xl border border-[#D4AF37]/15 bg-[#07070A] py-2.5 px-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
            >
              <option value="">Select an industry…</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-white mb-1.5">
                Country
              </label>
              <input
                id="country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-[#D4AF37]/15 bg-[#07070A] py-2.5 px-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-white mb-1.5">
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full rounded-xl border border-[#D4AF37]/15 bg-[#07070A] py-2.5 px-3 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="team-size" className="block text-sm font-medium text-white mb-1.5">
              Team size
            </label>
            <input
              id="team-size"
              type="number"
              min="1"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              placeholder="e.g. 5"
              className="w-full rounded-xl border border-[#D4AF37]/15 bg-[#07070A] py-2.5 px-3 text-sm text-white placeholder-[#F8F9FA]/30 focus:border-[#D4AF37]/50 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-semibold text-[#07070A] transition hover:bg-[#e5c14d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating your workspace…' : 'Create business'}
          </button>
        </form>
      </div>
    </div>
  );
}
