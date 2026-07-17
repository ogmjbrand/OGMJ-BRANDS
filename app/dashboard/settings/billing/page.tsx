'use client';

import React, { useEffect, useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { getCurrentUser } from '@/lib/auth';

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

  const handleSelectPlan = async (planId: string) => {
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
      // Get plan details
      const plan = plans.find((p) => p.id === planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Billing & Plans</h1>
        <p className="text-[#D4AF37]/70 mt-2">Choose the perfect plan for your business</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
          <p className="text-[#FF6B6B]">{error}</p>
        </div>
      )}

      {/* Billing Period Tabs */}
      <div className="flex gap-4 border-b border-[#D4AF37]/10">
        <button className="px-4 py-3 font-medium text-[#D4AF37] border-b-2 border-[#D4AF37]">
          Monthly
        </button>
        <button className="px-4 py-3 font-medium text-[#D4AF37]/50 hover:text-[#D4AF37]/70">
          Annual (Save 20%)
        </button>
      </div>

      {/* Plans Grid */}
      {plansLoading ? (
        <p className="text-[#D4AF37]/70">Loading plans...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border transition-all ${
                  plan.is_popular
                    ? 'border-[#D4AF37] bg-[#0E1116]/80 ring-2 ring-[#D4AF37]/20 transform md:scale-105'
                    : 'border-[#D4AF37]/10 bg-[#0E1116]'
                }`}
              >
                {/* Popular Badge */}
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="px-3 py-1 bg-[#D4AF37] text-[#07070A] text-xs font-semibold rounded-full">
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
                    <p className="text-sm text-[#D4AF37]/70 mt-1">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-[#D4AF37]">
                        ₦{Number(plan.price_ngn).toLocaleString('en-NG')}
                      </span>
                      <span className="text-[#D4AF37]/50">/{plan.billing_period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                        <span className="text-[#D4AF37]/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrent || loading}
                    className={`w-full py-3 rounded-lg font-semibold transition ${
                      isCurrent
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37] cursor-default'
                        : 'bg-[#D4AF37] text-[#07070A] hover:bg-[#D4AF37]/90 disabled:opacity-50'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : loading ? 'Processing...' : 'Select Plan'}
                  </button>
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
              a: 'We accept all major credit cards via Paystack and Flutterwave, ensuring secure payments globally.',
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
              className="group p-4 bg-[#0E1116] border border-[#D4AF37]/10 rounded-lg cursor-pointer hover:border-[#D4AF37]/30 transition"
            >
              <summary className="font-semibold text-white flex items-center justify-between">
                {faq.q}
                <span className="transform group-open:rotate-180 transition">▼</span>
              </summary>
              <p className="mt-3 text-[#D4AF37]/70">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}


