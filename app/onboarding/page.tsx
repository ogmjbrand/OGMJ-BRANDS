'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building, ArrowRight, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step === 2) {
      checkExistingBusiness();
    }
  }, [step]);

  const checkExistingBusiness = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      type ExistingBusinessData = {
        name?: string | null;
        industry?: string | null;
        country?: string | null;
        currency?: string | null;
      };

      const { data: existing } = (await supabase
        .from('businesses')
        .select('name, industry, country, currency')
        .eq('created_by', user.id)
        .single()) as { data: ExistingBusinessData | null };

      if (existing) {
        setBusinessName(existing.name || '');
        setIndustry(existing.industry || '');
        setCountry(existing.country || '');
        setCurrency(existing.currency || 'USD');
      }
    } catch (error) {
      console.error('Error checking existing business:', error);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!businessName.trim()) {
      setError('Business name is required');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      type CreateBusinessInput = {
        created_by: string;
        name: string;
        industry?: string;
        country?: string;
        currency?: string;
      };

      const businessInput: CreateBusinessInput = {
        created_by: user.id,
        name: businessName,
        industry,
        country,
        currency,
      };

      const { error } = (await (supabase
        .from('businesses') as any)
        .upsert(businessInput, { onConflict: 'created_by' })
        .select()
        .single()) as { data: any; error: any };

      if (error) {
        throw new Error(error.message || 'Failed to create or update business');
      }

      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = Math.round((step / 4) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07070A] via-[#0E1116] to-[#07070A] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-[#D4AF37]">Step {step} of 4</span>
            <span className="text-sm text-[#D4AF37]/50">{progressPercent}%</span>
          </div>
          <div className="h-1 bg-[#0E1116] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D4AF37] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Onboarding progress"
            />
          </div>
        </div>

        <div className="backdrop-blur-md bg-[#0E1116]/80 border border-[#D4AF37]/10 rounded-2xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Welcome to OGMJ BRANDS</h1>
                <p className="text-[#D4AF37]/70 mt-2">Let&apos;s set up your business account</p>
              </div>

              <div className="space-y-4">
                {[
                  { n: 1, title: 'Create your business', sub: 'Set up your workspace' },
                  { n: 2, title: 'Add team members', sub: 'Invite your colleagues' },
                  { n: 3, title: 'Set up payments', sub: 'Choose your billing plan' },
                  { n: 4, title: "You're all set!", sub: 'Start building your growth' },
                ].map(({ n, title, sub }) => (
                  <div
                    key={n}
                    className={`flex items-start gap-4 p-4 bg-[#07070A] rounded-lg border border-[#D4AF37]/10 ${n !== 1 ? 'opacity-50' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 text-[#D4AF37] text-sm font-bold">
                      {n}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{title}</h3>
                      <p className="text-sm text-[#D4AF37]/50 mt-1">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#07070A] font-semibold py-3 rounded-lg transition"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleCreateBusiness} className="space-y-6" noValidate>
              <div>
                <h2 className="text-2xl font-bold text-white">Create Your Business</h2>
                <p className="text-[#D4AF37]/70 mt-1">Tell us about your business</p>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 border rounded-lg bg-red-500/10 border-red-500/20" role="alert">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="business-name" className="block mb-2 text-sm font-medium text-white">
                    Business Name *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-5 w-5 text-[#D4AF37]/50" aria-hidden="true" />
                    <input
                      id="business-name"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Your business name"
                      aria-required="true"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]/60 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="industry" className="block mb-2 text-sm font-medium text-white">
                      Industry
                    </label>
                    <input
                      id="industry"
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g., Tech, Marketing"
                      className="w-full px-4 py-2.5 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]/60 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block mb-2 text-sm font-medium text-white">
                      Country
                    </label>
                    <input
                      id="country"
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g., Nigeria"
                      className="w-full px-4 py-2.5 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]/60 transition"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="currency-select" className="block mb-2 text-sm font-medium text-white">
                    Currency
                  </label>
                  <select
                    id="currency-select"
                    title="Select currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white focus:outline-none focus:border-[#D4AF37]/60 transition"
                  >
                    <option value="USD">USD</option>
                    <option value="NGN">NGN</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-[#07070A] hover:bg-[#07070A]/80 border border-[#D4AF37]/20 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 disabled:bg-[#D4AF37]/50 text-[#07070A] font-semibold py-2.5 rounded-lg transition"
                >
                  {loading ? 'Creating...' : 'Create Business'}
                  {!loading && <ArrowRight className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Add Team Members</h2>
                <p className="text-[#D4AF37]/70 mt-1">Invite your colleagues to collaborate</p>
              </div>

              <div className="bg-[#07070A] border border-[#D4AF37]/20 rounded-lg p-6 text-center">
                <p className="text-[#D4AF37]/70">You can add team members later from your dashboard settings</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-[#07070A] hover:bg-[#07070A]/80 border border-[#D4AF37]/20 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#07070A] font-semibold py-2.5 rounded-lg transition"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white">You&apos;re All Set!</h2>
                <p className="text-[#D4AF37]/70 mt-2">Your workspace is ready. Let&apos;s start building your growth.</p>
              </div>

              <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg p-6 text-center">
                <p className="font-semibold text-white">Welcome to OGMJ BRANDS</p>
                <p className="text-[#D4AF37]/70 text-sm mt-2">Access all features from your dashboard</p>
              </div>

              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#07070A] font-semibold py-3 rounded-lg transition"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

