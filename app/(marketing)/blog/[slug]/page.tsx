import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { BLOG_POSTS, getBlogPost } from '@/lib/marketing/content'

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getBlogPost(params.slug)
  if (!post) return { title: 'Post Not Found' }
  return {
    title: `${post.title} — OGMJ BRANDS`,
    description: post.excerpt,
  }
}

const POST_CONTENT: Record<string, string[]> = {
  'luma-ventures-case-study': [
    'When Marcelo Santos founded Luma Ventures, he was juggling three separate tools for CRM, invoicing, and project management. His team spent more time switching between platforms than closing deals.',
    'After migrating to OGMJ BRANDS, Luma unified their entire operation — contacts, deals, invoices, and automation — in a single dashboard. Within 90 days, they reported a 42% increase in revenue, driven primarily by automated follow-up sequences that recovered previously lost leads.',
    'The key was OGMJ\'s AI workflow engine, which automatically nurtured prospects through personalized email sequences based on deal stage and engagement signals. Marcelo\'s team went from manually following up with 30% of leads to automatically engaging 100%.',
    'Today, Luma Ventures operates across two markets with a team of eight, all managed through the OGMJ platform.',
  ],
  'verge-collective-launch': [
    'Ava Morgan had a vision for Verge Collective — a premium creative agency — but her previous agency quoted 6 months and $80,000 for branding, website, and launch operations.',
    'OGMJ BRANDS delivered the full package in 6 weeks: brand identity, conversion-ready website, CRM setup, and automated client onboarding workflows. The total investment was less than half the original quote.',
    'The launch strategy included a coordinated announcement across email, social, and a dedicated landing page — all built and deployed on the OGMJ platform. Verge Collective signed their first three clients within two weeks of going live.',
    'Ava credits the speed to having every service — branding, development, and operations — under one roof with a single team accountable for outcomes.',
  ],
  'atlas-digital-ops': [
    'Atlas Digital Group was paying five different vendors for business registration, branding, website hosting, CRM, and marketing. The lack of integration created data silos and communication overhead that slowed every decision.',
    'James Okonkwo, COO of Atlas Digital, made the decision to consolidate everything onto OGMJ BRANDS. The migration took two weeks, and the team adoption rate hit 96% within the first month.',
    'The biggest win was visibility: for the first time, leadership could see revenue pipeline, marketing performance, and client health in a single dashboard. Automated reporting replaced weekly manual spreadsheet updates.',
    'Atlas Digital has since expanded into two new markets, using OGMJ\'s registration and compliance services to establish entities without hiring additional legal counsel.',
  ],
  'ai-automation-for-founders': [
    'Most founders know they should automate — but few know where to start. After working with 200+ businesses, we\'ve identified the workflows that deliver the highest ROI in the first 30 days.',
    'Start with lead follow-up: configure an automated sequence that sends a personalized welcome email within 5 minutes of a new contact, followed by value-add touchpoints on days 2, 5, and 10. This alone typically recovers 15-25% of leads that would otherwise go cold.',
    'Next, automate invoice reminders. Set up a workflow that sends friendly payment reminders at 3 days before due, on due date, and 3 days after. Businesses using this workflow report 30% faster payment collection.',
    'Finally, build an onboarding sequence for new clients: automated welcome packets, milestone check-ins, and satisfaction surveys. This reduces churn and generates testimonials without manual effort.',
  ],
  'premium-brand-launch-checklist': [
    'Launching a premium brand in 2026 requires more than a logo and a website. Here\'s the complete checklist we use with every OGMJ client.',
    'Entity & Legal: Choose the right business structure, register in your target jurisdiction, obtain EIN/tax ID, and draft operating agreements. Budget 1-2 weeks.',
    'Brand Foundation: Complete a positioning workshop, develop logo suite and brand guidelines, create social media templates, and prepare a press kit. Budget 4-8 weeks.',
    'Digital Presence: Build a conversion-ready website with SEO, analytics, and CRM integration. Set up email infrastructure and social profiles. Budget 4-10 weeks.',
    'Operations: Configure CRM pipeline, set up automation workflows, create invoice templates, and establish client onboarding processes. Budget 1-2 weeks.',
    'Launch: Coordinate announcement timing, prepare email and social campaigns, set up tracking dashboards, and schedule post-launch review at 30 and 90 days.',
  ],
  'crm-best-practices': [
    'A CRM is only as good as the system behind it. Here are the practices we implement for every high-growth startup on OGMJ.',
    'Structure your pipeline with 4-6 stages maximum. More stages create confusion; fewer lose nuance. Our recommended stages: Lead → Qualified → Proposal → Negotiation → Won/Lost.',
    'Automate stage transitions where possible. When a contact opens a proposal email three times, auto-move them to Negotiation. When a deal sits in Proposal for 14 days, trigger a follow-up task.',
    'Score your leads based on engagement signals: email opens, website visits, form submissions, and meeting attendance. Focus your team\'s energy on contacts scoring above 70.',
    'Review your pipeline weekly. Deals that haven\'t moved in 21 days need a decision: advance, nurture, or close. Stagnant pipelines are the #1 cause of missed revenue targets.',
  ],
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug)
  if (!post) notFound()

  const paragraphs = POST_CONTENT[params.slug] || [post.excerpt]

  return (
    <article className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        <div className="mt-8 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
          <span className="rounded-full bg-gold/10 px-3 py-1 text-gold">{post.category}</span>
          <span>{post.date}</span>
          <span>{post.readTime}</span>
        </div>

        <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">{post.title}</h1>
        <p className="mt-4 text-slate-400">By {post.author}</p>

        <div className="mt-12 space-y-6">
          {paragraphs.map((paragraph, i) => (
            <p key={i} className="text-lg leading-8 text-slate-300">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
          <h2 className="text-xl font-bold text-white">Ready to see similar results?</h2>
          <p className="mt-2 text-slate-300">Start your 14-day free trial or talk to our team.</p>
          <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/signup" className="rounded-full bg-gold px-8 py-3 text-sm font-semibold text-black transition hover:bg-amber-400">
              Start Free Trial
            </Link>
            <Link href="/contact" className="rounded-full border border-white/15 px-8 py-3 text-sm font-semibold text-white transition hover:border-gold/50">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
