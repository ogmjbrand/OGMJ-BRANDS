import type { Metadata } from 'next'
import FAQSection from '@/components/marketing/FAQSection'

export const metadata: Metadata = {
  title: 'FAQ — OGMJ BRANDS',
  description: 'Answers to common questions about OGMJ BRANDS platform, services, pricing, and onboarding.',
}

export default function FAQPage() {
  return <FAQSection />
}


