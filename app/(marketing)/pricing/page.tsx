import type { Metadata } from 'next'
import Link from 'next/link'
import PricingCards from '@/components/marketing/PricingCards'
import FAQSection from '@/components/marketing/FAQSection'

export const metadata: Metadata = {
  title: 'Pricing — OGMJ BRANDS',
  description: 'Transparent pricing for the OGMJ premium business OS. Plans from $29/mo with a 14-day free trial.',
}

export default function PricingPage() {
  return (
    <div className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Pricing</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Invest in a platform built for premium growth
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Start with a 14-day free trial on Professional. No credit card required. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        <PricingCards />

        <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-white">Need a custom enterprise package?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            We offer bundled service packages (branding, launch, automation) alongside platform access. Get a tailored proposal for your business.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex rounded-full bg-gold px-8 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
          >
            Request a Custom Quote
          </Link>
        </div>
      </div>

      <FAQSection
        title="Billing questions"
        subtitle="Common questions about plans, payments, and trials."
        limit={4}
      />
    </div>
  )
}
