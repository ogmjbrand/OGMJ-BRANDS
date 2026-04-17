'use client';

import React, { useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individuals',
    price: 29,
    period: 'month',
    features: [
      'Up to 1,000 contacts',
      '5 team members',
      'Basic CRM',
      'Email support',
      '1 website',
    ],
    current: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing teams',
    price: 99,
    period: 'month',
    features: [
      'Up to 50,000 contacts',
      '25 team members',
      'Advanced CRM + Analytics',
      'Priority support',
      'Unlimited websites',
      'Video processing',
      'AI features',
    ],
    current: true,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 299,
    period: 'month',
    features: [
      'Unlimited contacts',
      'Unlimited team members',
      'All features included',
      '24/7 phone support',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    current: false,
  },
];

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'professional') {
      // Already on this plan
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get plan details
      const plan = PLANS.find((p) => p.id === planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // TODO: Get user email and business ID from context
      const userEmail = 'user@example.com';
      const businessId = 'business-id';

      // Initialize payment
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.price,
          email: userEmail,
          businessId,
          planId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Payment initialization failed');
      }

      // Redirect to Paystack
      window.location.href = result.data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-xl border transition-all ${
              plan.popular
                ? 'border-[#D4AF37] bg-[#0E1116]/80 ring-2 ring-[#D4AF37]/20 transform md:scale-105'
                : 'border-[#D4AF37]/10 bg-[#0E1116]'
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="px-3 py-1 bg-[#D4AF37] text-[#07070A] text-xs font-semibold rounded-full">
                  MOST POPULAR
                </span>
              </div>
            )}

            {/* Current Badge */}
            {plan.current && (
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
                  <span className="text-4xl font-bold text-[#D4AF37]">${plan.price}</span>
                  <span className="text-[#D4AF37]/50">/{plan.period}</span>
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
                disabled={plan.current || loading}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  plan.current
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] cursor-default'
                    : 'bg-[#D4AF37] text-[#07070A] hover:bg-[#D4AF37]/90 disabled:opacity-50'
                }`}
              >
                {plan.current ? 'Current Plan' : loading ? 'Processing...' : 'Select Plan'}
              </button>
            </div>
          </div>
        ))}
      </div>

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
