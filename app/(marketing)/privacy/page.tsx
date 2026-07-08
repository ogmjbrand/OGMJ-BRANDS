import type { Metadata } from 'next'
import { SITE } from '@/lib/marketing/content'

export const metadata: Metadata = {
  title: 'Privacy Policy — OGMJ BRANDS',
  description: 'How OGMJ BRANDS collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="June 1, 2026">
      <Section title="1. Information We Collect">
        <p>We collect information you provide directly: name, email, company name, phone number, and payment details when you create an account or contact us. We also collect usage data including pages visited, features used, and device information.</p>
      </Section>
      <Section title="2. How We Use Your Information">
        <p>We use your information to provide and improve our services, process payments, send transactional communications, respond to inquiries, and comply with legal obligations. We do not sell your personal data to third parties.</p>
      </Section>
      <Section title="3. Data Storage & Security">
        <p>Your data is stored on secure servers with encryption at rest and in transit. We use Supabase for authentication and database services, and Paystack/Flutterwave for payment processing. Access to personal data is restricted to authorized personnel.</p>
      </Section>
      <Section title="4. Cookies">
        <p>We use essential cookies for authentication and session management, and analytics cookies to understand how our platform is used. See our <a href="/cookies" className="text-gold hover:underline">Cookie Policy</a> for details.</p>
      </Section>
      <Section title="5. Your Rights">
        <p>You may request access to, correction of, or deletion of your personal data at any time by contacting {SITE.email}. EU and UK residents have additional rights under GDPR including data portability and the right to object to processing.</p>
      </Section>
      <Section title="6. Contact">
        <p>For privacy-related inquiries, contact us at {SITE.email} or {SITE.address}, {SITE.city}.</p>
      </Section>
    </LegalPage>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 text-slate-300 leading-7">{children}</div>
    </div>
  )
}

function LegalPage({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: {lastUpdated}</p>
        <div className="mt-12">{children}</div>
      </div>
    </div>
  )
}


