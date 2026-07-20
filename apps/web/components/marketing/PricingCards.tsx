import Link from 'next/link'
import { Check } from 'lucide-react'
import { PRICING_PLANS } from '@/lib/marketing/content'

interface PricingCardsProps {
  showCta?: boolean
}

export default function PricingCards({ showCta = true }: PricingCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PRICING_PLANS.map((plan) => (
        <div
          key={plan.id}
          className={`relative rounded-[2rem] border p-8 backdrop-blur-xl transition hover:-translate-y-1 ${
            plan.popular
              ? 'border-gold bg-gold/5 shadow-gold-glow ring-1 ring-gold/30'
              : 'border-white/10 bg-white/5'
          }`}
        >
          {plan.popular && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold text-black">
              MOST POPULAR
            </span>
          )}

          <div>
            <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
          </div>

          <div className="mt-6">
            <span className="text-5xl font-black text-white">${plan.price}</span>
            <span className="text-slate-400">/{plan.period}</span>
            <p className="mt-1 text-xs text-slate-500">
              or ${plan.annualPrice}/year (save 20%)
            </p>
          </div>

          <ul className="mt-8 space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {feature}
              </li>
            ))}
          </ul>

          {showCta && (
            <Link
              href="/signup"
              className={`mt-8 block w-full rounded-full py-3 text-center text-sm font-semibold transition ${
                plan.popular
                  ? 'bg-gold text-black hover:bg-amber-400'
                  : 'border border-white/15 bg-white/5 text-white hover:border-gold/50'
              }`}
            >
              {plan.id === 'enterprise' ? 'Contact Sales' : 'Start Free Trial'}
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}

