'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building, ArrowRight, AlertCircle } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessName,
          industry,
          country,
          currency,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create business');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07070A] via-[#0E1116] to-[#07070A] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-[#D4AF37]">Step {step} of 4</span>
            <span className="text-sm text-[#D4AF37]/50">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="h-1 bg-[#0E1116] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D4AF37] transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="backdrop-blur-md bg-[#0E1116]/80 border border-[#D4AF37]/10 rounded-2xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Welcome to OGMJ BRANDS</h1>
                <p className="text-[#D4AF37]/70 mt-2">Let's set up your business account</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-[#07070A] rounded-lg border border-[#D4AF37]/10">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 text-[#D4AF37] text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Create your business</h3>
                    <p className="text-sm text-[#D4AF37]/50 mt-1">
                      Set up your workspace
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-[#07070A] rounded-lg border border-[#D4AF37]/10 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 text-[#D4AF37] text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Add team members</h3>
                    <p className="text-sm text-[#D4AF37]/50 mt-1">
                      Invite your colleagues
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-[#07070A] rounded-lg border border-[#D4AF37]/10 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 text-[#D4AF37] text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Set up payments</h3>
                    <p className="text-sm text-[#D4AF37]/50 mt-1">
                      Choose your billing plan
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-[#07070A] rounded-lg border border-[#D4AF37]/10 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 text-[#D4AF37] text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">You're all set!</h3>
                    <p className="text-sm text-[#D4AF37]/50 mt-1">
                      Start building your growth
                    </p>
                  </div>
                </div>
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
            <form onSubmit={handleCreateBusiness} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Create Your Business</h2>
                <p className="text-[#D4AF37]/70 mt-1">Tell us about your business</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Business Name *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-5 w-5 text-[#D4AF37]/50" />
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Your business name"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]/60 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Industry</label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g., Tech, Marketing"
                      className="w-full px-4 py-2.5 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]/60 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g., Nigeria"
                      className="w-full px-4 py-2.5 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]/60 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Currency</label>
                  <select
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
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
