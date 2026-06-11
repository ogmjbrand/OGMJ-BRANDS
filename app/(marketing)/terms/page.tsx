import type { Metadata } from 'next'
import { SITE } from '@/lib/marketing/content'

export const metadata: Metadata = {
  title: 'Terms of Service — OGMJ BRANDS',
  description: 'Terms and conditions for using the OGMJ BRANDS platform and services.',
}

export default function TermsPage() {
  return (
    <div className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: June 1, 2026</p>

        <div className="mt-12 space-y-8 text-slate-300 leading-7">
          <section>
            <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p className="mt-3">By accessing or using OGMJ BRANDS (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">2. Services</h2>
            <p className="mt-3">OGMJ BRANDS provides a business operating system including CRM, invoicing, website builder, AI automation, and professional services (branding, development, launch operations). Service scope for professional packages is defined in individual statements of work.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">3. Accounts</h2>
            <p className="mt-3">You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate information during registration.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">4. Payment & Billing</h2>
            <p className="mt-3">Platform subscriptions are billed monthly or annually. Service packages are billed per milestone as defined in your proposal. All fees are non-refundable except as stated in our 14-day money-back guarantee for platform subscriptions.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">5. Intellectual Property</h2>
            <p className="mt-3">The Platform and its original content remain the property of OGMJ BRANDS. Deliverables from service packages (logos, websites, etc.) are transferred to you upon full payment, as specified in your statement of work.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">6. Limitation of Liability</h2>
            <p className="mt-3">OGMJ BRANDS is provided &quot;as is&quot; without warranties. Our liability is limited to the amount you paid in the 12 months preceding any claim.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">7. Contact</h2>
            <p className="mt-3">Questions about these terms: {SITE.email}</p>
          </section>
        </div>
      </div>
    </div>
  )
}
