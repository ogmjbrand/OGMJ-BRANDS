'use client';

import React, { useEffect, useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { getCurrentUser } from '@/lib/auth';

// Paystack is the primary provider (listed first, styled as the default
// action); Flutterwave remains available as a secondary option — kept
// configured and working, not removed. Flip to false to hide it instantly
// without touching the underlying integration if it's ever needed. Also
// gated on the public key actually being set, so a deployment that never
// configured Flutterwave doesn't show a button that only fails at click-time.
const FLUTTERWAVE_ENABLED = true;
const FLUTTERWAVE_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY);

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_ngn: string | number;
  billing_period: string;
  features: string[];
  is_popular: boolean;
}

export default function BillingPage() {
  const { currentBusiness } = useBusinessContext();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadFlutterwaveScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).FlutterwaveCheckout) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[data-flutterwave-inline]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Flutterwave')));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      script.dataset.flutterwaveInline = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Flutterwave'));
      document.body.appendChild(script);
    });
  }

  useEffect(() => {
    async function loadPlansAndSubscription() {
      setPlansLoading(true);
      try {
        const plansResponse = await fetch('/api/plans');
        const plansResult = await plansResponse.json();
        if (plansResult.success) {
          setPlans(plansResult.data || []);
        }

        if (currentBusiness) {
          const subResponse = await fetch(`/api/subscriptions?businessId=${currentBusiness.id}`);
          const subResult = await subResponse.json();
          if (subResult.success && subResult.data?.status === 'active') {
            setCurrentPlanId(subResult.data.plan_id);
          }
        }
      } catch {
        setError('Failed to load plans');
      } finally {
        setPlansLoading(false);
      }
    }
    loadPlansAndSubscription();
  }, [currentBusiness]);

  const handlePaystackCheckout = async (planId: string) => {
    if (!currentBusiness) {
      setError('No business selected');
      return;
    }

    if (planId === currentPlanId) {
      // Already on this plan
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current user
      const user = await getCurrentUser();
      if (!user?.email) {
        throw new Error('User not authenticated');
      }

      // Initialize payment (amount is derived server-side from the plan)
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: currentBusiness.id, planId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Payment initialization failed');
      }

      const { accessCode } = result.data;
      if (!accessCode) {
        throw new Error('No payment access code received');
      }

      const { default: PaystackPop } = await import('@paystack/inline-js');
      const popup = new PaystackPop();

      popup.resumeTransaction(accessCode, {
        onSuccess: async (transaction: { reference: string }) => {
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference: transaction.reference }),
            });
            const verifyResult = await verifyResponse.json();

            if (!verifyResult.success) {
              throw new Error(verifyResult.error || 'Payment verification failed');
            }

            window.location.reload();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed');
            setLoading(false);
          }
        },
        onCancel: () => {
          setLoading(false);
        },
        onError: (err: { message: string }) => {
          setError(err.message || 'Payment failed');
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
      setLoading(false);
    }
  };

  const handleFlutterwaveCheckout = async (planId: string) => {
    if (!currentBusiness) {
      setError('No business selected');
      return;
    }

    if (planId === currentPlanId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error('Flutterwave is not configured on this deployment');
      }

      // Initialize payment (amount is derived server-side from the plan)
      const response = await fetch('/api/payments/flutterwave/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: currentBusiness.id, planId }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Payment initialization failed');
      }

      const { txRef, amount, currency, email, meta } = result.data;

      await loadFlutterwaveScript();

      (window as any).FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: txRef,
        amount,
        currency,
        customer: { email },
        meta,
        customizations: { title: 'OGMJ BRANDS', description: 'Subscription payment' },
        callback: async (transaction: { transaction_id: number; status: string }) => {
          try {
            if (transaction.status !== 'successful') {
              throw new Error('Payment was not successful');
            }
            const verifyResponse = await fetch('/api/payments/flutterwave/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transactionId: transaction.transaction_id }),
            });
            const verifyResult = await verifyResponse.json();

            if (!verifyResult.success) {
              throw new Error(verifyResult.error || 'Payment verification failed');
            }

            window.location.reload();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed');
            setLoading(false);
          }
        },
        onclose: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Billing & Plans</h1>
        <p className="text-[#C8FF00]/70 mt-2">Choose the perfect plan for your business</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
          <p className="text-[#FF6B6B]">{error}</p>
        </div>
      )}

      {/* Billing Period Tabs */}
      <div className="flex gap-4 border-b border-[#C8FF00]/10">
        <button className="px-4 py-3 font-medium text-[#C8FF00] border-b-2 border-[#C8FF00]">
          Monthly
        </button>
        <button className="px-4 py-3 font-medium text-[#C8FF00]/50 hover:text-[#C8FF00]/70">
          Annual (Save 20%)
        </button>
      </div>

      {/* Plans Grid */}
      {plansLoading ? (
        <p className="text-[#C8FF00]/70">Loading plans...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border transition-all ${
                  plan.is_popular
                    ? 'border-[#C8FF00] bg-[#0E1116]/80 ring-2 ring-[#C8FF00]/20 transform md:scale-105'
                    : 'border-[#C8FF00]/10 bg-[#0E1116]'
                }`}
              >
                {/* Popular Badge */}
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="px-3 py-1 bg-[#C8FF00] text-[#07070A] text-xs font-semibold rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Current Badge */}
                {isCurrent && (
                  <div className="p-4 bg-green-500/10 border-b border-green-500/20">
                    <p className="text-sm font-medium text-green-400">✓ Current Plan</p>
                  </div>
                )}

                <div className="p-6 space-y-6">
                  {/* Plan Name */}
                  <div>
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-[#C8FF00]/70 mt-1">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-[#C8FF00]">
                        ₦{Number(plan.price_ngn).toLocaleString('en-NG')}
                      </span>
                      <span className="text-[#C8FF00]/50">/{plan.billing_period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#C8FF00] flex-shrink-0 mt-0.5" />
                        <span className="text-[#C8FF00]/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {/* A plan priced at 0 (e.g. Enterprise) is sold by quote, not
                      self-serve — /api/payments/initialize rejects a zero-value
                      checkout server-side, so route it to Contact instead of a
                      dead-end "Select Plan" that always errors. */}
                  {Number(plan.price_ngn) <= 0 ? (
                    <a
                      href="/contact"
                      className="block w-full py-3 rounded-lg font-semibold text-center bg-[#C8FF00] text-[#07070A] hover:bg-[#C8FF00]/90 transition"
                    >
                      Contact sales
                    </a>
                  ) : isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-lg font-semibold bg-[#C8FF00]/20 text-[#C8FF00] cursor-default"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => handlePaystackCheckout(plan.id)}
                        disabled={loading}
                        className="w-full py-3 rounded-lg font-semibold bg-[#C8FF00] text-[#07070A] hover:bg-[#C8FF00]/90 disabled:opacity-50 transition"
                      >
                        {loading ? 'Processing...' : 'Pay with Paystack'}
                      </button>
                      {FLUTTERWAVE_ENABLED && FLUTTERWAVE_CONFIGURED ? (
                        <button
                          onClick={() => handleFlutterwaveCheckout(plan.id)}
                          disabled={loading}
                          className="w-full py-3 rounded-lg font-semibold bg-transparent border border-[#C8FF00]/40 text-[#C8FF00] hover:bg-[#C8FF00]/10 disabled:opacity-50 transition"
                        >
                          {loading ? 'Processing...' : 'Pay with Flutterwave'}
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>

        <div className="space-y-4">
          {[
            {
              q: 'Can I change my plan anytime?',
              a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit and debit cards via Paystack, with Flutterwave available as an alternative — both processed securely.',
            },
            {
              q: 'Do you offer refunds?',
              a: 'Yes, we offer a 14-day money-back guarantee if you\'re not satisfied with your plan.',
            },
            {
              q: 'Is there a free trial?',
              a: 'Yes, you can get a 14-day free trial with access to all Professional features.',
            },
          ].map((faq, idx) => (
            <details
              key={idx}
              className="group p-4 bg-[#0E1116] border border-[#C8FF00]/10 rounded-lg cursor-pointer hover:border-[#C8FF00]/30 transition"
            >
              <summary className="font-semibold text-white flex items-center justify-between">
                {faq.q}
                <span className="transform group-open:rotate-180 transition">▼</span>
              </summary>
              <p className="mt-3 text-[#C8FF00]/70">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}


