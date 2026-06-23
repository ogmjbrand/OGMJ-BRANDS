// app/page.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { DM_Sans, Syne } from 'next/font/google'
import { motion, useMotionValue, useSpring, useTransform, type Variants } from 'framer-motion'
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Bot,
  BrainCircuit,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  Code2,
  CreditCard,
  Cpu,
  FileText,
  Gauge,
  Globe2,
  GraduationCap,
  Handshake,
  Layers3,
  Megaphone,
  MessageSquare,
  Network,
  Rocket,
  Scale,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  UsersRound,
  Workflow,
  PenTool,
  Zap,
  type LucideIcon,
} from 'lucide-react'

const syne = Syne({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-syne',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-dm-sans',
})

interface NavItem {
  label: string
  href: string
}

interface HeroMetric {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone: 'emerald' | 'gold'
}

interface SystemDivision {
  title: string
  description: string
  icon: LucideIcon
}

interface MarketplaceItem {
  label: string
  value: string
}

interface CommandSignal {
  label: string
  state: string
  icon: LucideIcon
}

interface BuilderFeature {
  title: string
  description: string
  icon: LucideIcon
}

interface LaunchPhase {
  phase: string
  title: string
  description: string
}

interface ConciergeCommand {
  prompt: string
  outcome: string
}

interface IntegrationRail {
  title: string
  description: string
  icon: LucideIcon
}

interface FooterColumn {
  title: string
  links: NavItem[]
}

interface PageContent {
  navItems: NavItem[]
  eyebrow: string
  headline: string[]
  highlightedHeadline: string
  subheadline: string
  body: string
  primaryCta: NavItem
  secondaryCta: NavItem
  metrics: HeroMetric[]
  divisions: SystemDivision[]
  marketplace: MarketplaceItem[]
  commandSignals: CommandSignal[]
  builderFeatures: BuilderFeature[]
  launchPhases: LaunchPhase[]
  conciergeCommands: ConciergeCommand[]
  integrations: IntegrationRail[]
  footerColumns: FooterColumn[]
}

const content: PageContent = {
  navItems: [
    { label: 'Divisions', href: '#divisions' },
    { label: 'Marketplace', href: '#marketplace' },
    { label: 'Command Center', href: '#command-center' },
    { label: 'Investors', href: '#investors' },
  ],
  eyebrow: 'From Idea To Empire',
  headline: ['Build.', 'Automate.'],
  highlightedHeadline: 'Scale.',
  subheadline: "The World's First AI-Powered Business Operating System.",
  body:
    'Build your business. Launch your brand. Automate operations. Manage clients. Generate revenue. Scale globally. All from one intelligent platform.',
  primaryCta: { label: 'Start Building', href: '/signup' },
  secondaryCta: { label: 'Explore Services', href: '#divisions' },
  metrics: [
    {
      label: 'Revenue Growth',
      value: '+412.5%',
      detail: 'Predictive growth systems active',
      icon: TrendingUp,
      tone: 'emerald',
    },
    {
      label: 'Automation Speed',
      value: '0.04s',
      detail: 'Decision latency',
      icon: Zap,
      tone: 'gold',
    },
    {
      label: 'Global Readiness',
      value: '24/7',
      detail: 'Command intelligence online',
      icon: Globe2,
      tone: 'emerald',
    },
  ],
  divisions: [
    {
      title: 'AI Command Center',
      description: 'Executive dashboard for decisions, revenue, operations, and strategic alerts.',
      icon: Gauge,
    },
    {
      title: 'Business Formation',
      description: 'Entity launch, legal workflow, compliance routing, and document generation.',
      icon: Building2,
    },
    {
      title: 'Brand Identity Studio',
      description: 'Premium naming, voice, visual systems, offers, content, and campaign strategy.',
      icon: Sparkles,
    },
    {
      title: 'Website & Funnel Architect',
      description: 'AI-generated sites, funnels, conversion copy, checkout flows, and analytics.',
      icon: Layers3,
    },
    {
      title: 'Automation Engine',
      description: 'Workflow builder for sales, CRM, approvals, fulfillment, support, and finance.',
      icon: Workflow,
    },
    {
      title: 'Global CRM',
      description: 'Pipeline, orders, client intelligence, approvals, follow-ups, and revenue control.',
      icon: UsersRound,
    },
    {
      title: 'AI Ads Manager',
      description: 'Google, Meta, TikTok, YouTube, retargeting, campaign insights, and creative testing.',
      icon: Megaphone,
    },
    {
      title: 'Finance Gateway',
      description: 'Payments, ledgers, payouts, subscriptions, invoices, and financial command visibility.',
      icon: BadgeDollarSign,
    },
    {
      title: 'Legal Architect',
      description: 'AI-guided policies, agreements, compliance packets, and approval-safe document suites.',
      icon: Scale,
    },
    {
      title: 'Academy Hub',
      description: 'Knowledge base, training paths, community intelligence, and founder education.',
      icon: GraduationCap,
    },
    {
      title: 'Startup Launchpad',
      description: 'Validation, pitch decks, GTM plans, investor readiness, and launch sequencing.',
      icon: Rocket,
    },
    {
      title: 'Client Portal',
      description: 'Approvals, files, conversations, invoices, project status, and client-facing clarity.',
      icon: FileText,
    },
  ],
  marketplace: [
    { label: 'Launch tracks', value: '18' },
    { label: 'Service categories', value: '42' },
    { label: 'Automations', value: '120+' },
    { label: 'Operating regions', value: 'Global' },
  ],
  commandSignals: [
    { label: 'Client pipeline intelligence', icon: Search, state: 'Scanning' },
    { label: 'Revenue system forecast', icon: BarChart3, state: 'Optimized' },
    { label: 'Workflow execution mesh', icon: Network, state: 'Live' },
    { label: 'Risk and compliance guardrails', icon: ShieldCheck, state: 'Protected' },
  ],
  builderFeatures: [
    {
      title: 'One-prompt website generation',
      description: 'AI turns a business idea into copy, sections, hierarchy, SEO structure, and launch-ready pages.',
      icon: Code2,
    },
    {
      title: 'Funnel architecture',
      description: 'Squeeze pages, tripwires, upsells, booking funnels, lead magnets, and conversion flow logic.',
      icon: Workflow,
    },
    {
      title: 'Brand kit application',
      description: 'Colors, typography, logo placement, CTA tone, offer language, and visual rhythm stay unified.',
      icon: PenTool,
    },
    {
      title: 'Checkout-ready commerce',
      description: 'Paystack, Flutterwave, Stripe, subscriptions, order bumps, service payments, and digital products.',
      icon: ShoppingCart,
    },
  ],
  launchPhases: [
    {
      phase: '01',
      title: 'Diagnose',
      description: 'OGMJ AI understands the business model, audience, offer, geography, payment needs, and growth goal.',
    },
    {
      phase: '02',
      title: 'Assemble',
      description: 'The OS configures brand, CRM, funnel, service catalog, automation, documents, and finance paths.',
    },
    {
      phase: '03',
      title: 'Launch',
      description: 'Publish the website, activate payment rails, route leads, start campaigns, and open the client portal.',
    },
    {
      phase: '04',
      title: 'Optimize',
      description: 'Predictive analytics surfaces weak services, content gaps, upsells, pricing issues, and growth plays.',
    },
  ],
  conciergeCommands: [
    {
      prompt: 'Build me a website for my catering business.',
      outcome: 'Creates site structure, copy, menu sections, inquiry flow, WhatsApp CTA, and payment-ready packages.',
    },
    {
      prompt: 'Register my business in Nigeria.',
      outcome: 'Routes CAC setup, required documents, compliance steps, status tracking, and post-incorporation tasks.',
    },
    {
      prompt: 'Generate a 30-day content calendar for Instagram.',
      outcome: 'Builds hooks, captions, campaign themes, posting rhythm, repurposing notes, and performance targets.',
    },
    {
      prompt: 'Identify which of my services is underperforming.',
      outcome: 'Reads CRM, orders, revenue, ads, and conversion signals to suggest pricing, offer, or funnel changes.',
    },
  ],
  integrations: [
    {
      title: 'African-first payments',
      description: 'Paystack and Flutterwave are primary rails, with Stripe for international expansion.',
      icon: CreditCard,
    },
    {
      title: 'WhatsApp-native funnels',
      description: 'Lead capture, broadcasts, follow-up sequences, order updates, and client communication.',
      icon: MessageSquare,
    },
    {
      title: 'Scheduled intelligence',
      description: 'Daily, weekly, and monthly reports turn platform activity into executive operating rhythm.',
      icon: CalendarDays,
    },
    {
      title: 'Global localization',
      description: 'Multi-currency, regional payment support, timezone handling, and emerging-market workflows.',
      icon: Globe2,
    },
  ],
  footerColumns: [
    {
      title: 'Platform',
      links: [
        { label: 'Divisions', href: '#divisions' },
        { label: 'Marketplace', href: '#marketplace' },
        { label: 'Intelligence', href: '#command-center' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'Investor Relations', href: '#investors' },
        { label: 'Newsletter', href: '/contact' },
        { label: 'Legal', href: '/terms' },
      ],
    },
  ],
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] },
  },
}

const staggerChildren: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex h-14 items-center justify-center rounded-sm bg-emerald-neon px-10 font-[family-name:var(--font-syne)] text-lg font-extrabold text-emerald-deep shadow-emerald-glow transition-all hover:scale-[1.02] hover:bg-emerald-bright hover:brightness-110 active:scale-95"
    >
      {children}
      <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
    </Link>
  )
}

function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-14 items-center justify-center rounded-sm border border-gold/60 bg-surface-glass px-10 font-[family-name:var(--font-syne)] text-lg font-extrabold text-gold backdrop-blur-xl transition-all hover:border-gold hover:bg-white/10"
    >
      {children}
    </Link>
  )
}

function IconButton({
  label,
  children,
  href,
}: {
  label: string
  children: React.ReactNode
  href?: string
}) {
  const className =
    'inline-flex size-10 items-center justify-center rounded-full border border-surface-border bg-surface-glass text-content-muted backdrop-blur-xl transition-all hover:bg-emerald-neon hover:text-emerald-deep'

  if (href) {
    return (
      <Link href={href} aria-label={label} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" aria-label={label} className={className}>
      {children}
    </button>
  )
}

function TopNavigation({ navItems }: { navItems: NavItem[] }) {
  return (
    <header className="fixed left-1/2 top-0 z-50 w-full max-w-[1440px] -translate-x-1/2 border-b border-surface-border bg-surface-glass shadow-2xl shadow-black/30 backdrop-blur-xl">
      <nav className="flex items-center justify-between px-4 py-4 md:px-6" aria-label="Primary navigation">
        <Link href="/" className="font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-normal text-content sm:text-2xl">
          OGMJ BRANDS 4.0
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navItems.map((item, index) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cx(
                  'font-[family-name:var(--font-dm-sans)] text-xs font-bold uppercase tracking-widest transition-colors',
                  index === 0
                    ? 'border-b-2 border-emerald-bright text-emerald-bright'
                    : 'text-content-muted hover:text-emerald-bright',
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-4">
          <IconButton label="AI assistant">
            <Bot className="size-5" />
          </IconButton>
          <IconButton label="Account" href="/login">
            <CircleUserRound className="size-5" />
          </IconButton>
          <Link
            href="/signup"
            className="hidden h-10 items-center justify-center rounded-sm bg-emerald-neon px-6 font-[family-name:var(--font-syne)] text-sm font-extrabold text-emerald-deep shadow-emerald-glow transition-transform hover:scale-[1.02] hover:bg-emerald-bright active:scale-95 lg:inline-flex"
          >
            Launch My Business
          </Link>
        </div>
      </nav>
    </header>
  )
}

function HeroSection({ pageContent }: { pageContent: PageContent }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { stiffness: 80, damping: 24 })
  const smoothY = useSpring(mouseY, { stiffness: 80, damping: 24 })
  const visualX = useTransform(smoothX, [-0.5, 0.5], [-14, 14])
  const visualY = useTransform(smoothY, [-0.5, 0.5], [-14, 14])

  return (
    <main
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-obsidian px-4 pt-24"
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect()
        mouseX.set((event.clientX - bounds.left) / bounds.width - 0.5)
        mouseY.set((event.clientY - bounds.top) / bounds.height - 0.5)
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-border to-transparent opacity-20" />
      <div className="absolute left-1/2 top-16 size-[520px] -translate-x-1/2 rounded-full bg-emerald-glow blur-[120px]" />

      <section className="relative z-10 grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 px-2 md:px-10 lg:grid-cols-12">
        <motion.article
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="flex flex-col items-start gap-8 lg:col-span-7"
        >
          <motion.p
            variants={fadeInUp}
            className="rounded-full border border-emerald/30 bg-surface-glass px-4 py-2 font-[family-name:var(--font-dm-sans)] text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-neon shadow-emerald-glow backdrop-blur-xl"
          >
            {pageContent.eyebrow}
          </motion.p>

          <motion.h1
            variants={fadeInUp}
            className="font-[family-name:var(--font-syne)] text-6xl font-extrabold uppercase italic leading-none tracking-normal text-white sm:text-7xl lg:text-8xl"
          >
            {pageContent.headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <span className="block text-emerald-bright">{pageContent.highlightedHeadline}</span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="max-w-2xl font-[family-name:var(--font-syne)] text-2xl font-semibold leading-snug text-content-muted">
            {pageContent.subheadline}
          </motion.p>

          <motion.p variants={fadeInUp} className="max-w-xl text-lg leading-8 text-content-muted/80">
            {pageContent.body}
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col gap-4 pt-2 sm:flex-row sm:gap-6">
            <PrimaryButton href={pageContent.primaryCta.href}>{pageContent.primaryCta.label}</PrimaryButton>
            <SecondaryButton href={pageContent.secondaryCta.href}>{pageContent.secondaryCta.label}</SecondaryButton>
          </motion.div>
        </motion.article>

        <motion.aside style={{ x: visualX, y: visualY }} className="relative flex items-center justify-center lg:col-span-5" aria-label="Business intelligence preview">
          <BusinessBrain metrics={pageContent.metrics} />
        </motion.aside>
      </section>

      <a
        href="#divisions"
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 opacity-60 transition-opacity hover:opacity-100"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-content-muted">Explore System</span>
        <span className="h-12 w-px bg-gradient-to-b from-emerald-bright to-transparent" />
      </a>
    </main>
  )
}

function BusinessBrain({ metrics }: { metrics: HeroMetric[] }) {
  return (
    <figure className="relative flex aspect-square w-full max-w-[560px] items-center justify-center">
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.06, 1], opacity: [0.35, 0.75, 0.35] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-8 rounded-full border border-emerald/30"
      />
      <motion.div
        aria-hidden
        animate={{ scale: [1.04, 1.12, 1.04], opacity: [0.2, 0.55, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        className="absolute inset-2 rounded-full border border-gold/20"
      />

      <motion.div
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-20 flex size-64 items-center justify-center overflow-hidden rounded-full border border-surface-border bg-surface-glass shadow-2xl shadow-emerald-glow backdrop-blur-xl"
      >
        <Image
          src="/aesthetic-dashboard.svg"
          alt=""
          fill
          className="object-cover opacity-20"
          sizes="256px"
          priority
        />
        <BrainCircuit className="relative z-10 size-28 text-emerald-bright" />
        <div className="absolute -inset-4 animate-[spin_18s_linear_infinite] rounded-full border border-emerald/30" />
        <div className="absolute inset-10 rounded-full border border-gold/20" />
      </motion.div>

      <FloatingMetric metric={metrics[0]} className="right-0 top-2" delay={0.1} />
      <FloatingMetric metric={metrics[1]} className="-left-2 bottom-10" delay={0.35} />
      <FloatingMetric metric={metrics[2]} className="bottom-0 right-6 hidden sm:block" delay={0.55} />
    </figure>
  )
}

function FloatingMetric({
  metric,
  className,
  delay,
}: {
  metric: HeroMetric
  className: string
  delay: number
}) {
  const Icon = metric.icon

  return (
    <motion.article
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: [0, -12, 0], scale: 1 }}
      transition={{
        opacity: { duration: 0.45, delay },
        scale: { duration: 0.45, delay },
        y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay },
      }}
      className={cx(
        'absolute z-30 max-w-[220px] rounded-lg border border-surface-border bg-surface-glass p-5 shadow-2xl shadow-black/30 backdrop-blur-xl',
        className,
      )}
    >
      <header className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-content-muted">{metric.label}</p>
        <Icon className={cx('size-4', metric.tone === 'gold' ? 'text-gold' : 'text-emerald-bright')} />
      </header>
      <p className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">{metric.value}</p>
      <p className="mt-2 text-xs text-content-muted">{metric.detail}</p>
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-obsidian-elevated">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '85%' }}
          transition={{ duration: 1.1, delay: delay + 0.3, ease: 'easeOut' }}
          className={cx('h-full', metric.tone === 'gold' ? 'bg-gold' : 'bg-emerald-bright')}
        />
      </div>
    </motion.article>
  )
}

function SectionHeader({
  label,
  title,
  description,
}: {
  label: string
  title: string
  description: string
}) {
  return (
    <motion.header
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeInUp}
      className="max-w-3xl"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-bright">{label}</p>
      <h2 className="mt-4 font-[family-name:var(--font-syne)] text-4xl font-extrabold leading-tight tracking-normal text-white md:text-6xl">
        {title}
      </h2>
      <p className="mt-6 text-lg leading-8 text-content-muted">{description}</p>
    </motion.header>
  )
}

function DivisionsSection({ divisions }: { divisions: SystemDivision[] }) {
  return (
    <section id="divisions" className="border-t border-surface-border bg-obsidian px-4 py-24 md:px-10 lg:py-32">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeader
          label="Operating Divisions"
          title="One intelligent system for every stage of business growth."
          description="OGMJ BRANDS 4.0 consolidates launch, brand, CRM, automation, finance, legal, learning, commerce, and marketplace operations into a single executive OS."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerChildren}
          className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {divisions.map((division) => {
            const Icon = division.icon

            return (
              <motion.article
                key={division.title}
                variants={fadeInUp}
                whileHover={{ y: -6 }}
                className="rounded-lg border border-surface-border bg-surface-glass p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
              >
                <div className="mb-6 flex size-12 items-center justify-center rounded-md border border-emerald/20 bg-emerald/10 text-emerald-bright">
                  <Icon className="size-6" />
                </div>
                <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">{division.title}</h3>
                <p className="mt-4 text-sm leading-6 text-content-muted">{division.description}</p>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

function CommandCenterSection({ signals }: { signals: CommandSignal[] }) {
  return (
    <section id="command-center" className="border-t border-surface-border bg-obsidian-soft px-4 py-24 md:px-10 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <SectionHeader
          label="Command Center"
          title="Executive visibility without the operational noise."
          description="The command layer turns fragmented business work into prioritized action, measurable progress, and fast founder decisions."
        />

        <motion.article
          initial={{ opacity: 0, x: 36 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border border-surface-border bg-obsidian p-4 shadow-2xl shadow-black/40"
        >
          <div className="rounded-lg border border-surface-border bg-surface-glass p-5 backdrop-blur-xl">
            <header className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-bright">Live Intelligence</p>
                <h3 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white">Business OS Pulse</h3>
              </div>
              <p className="flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-bright">
                <Cpu className="size-3" />
                Online
              </p>
            </header>

            <motion.ul initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerChildren} className="space-y-3">
              {signals.map((signal) => {
                const Icon = signal.icon

                return (
                  <motion.li
                    key={signal.label}
                    variants={fadeInUp}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-md border border-surface-border bg-white/5 p-4"
                  >
                    <div className="flex size-10 items-center justify-center rounded-sm bg-obsidian-elevated text-gold">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-sm font-semibold text-content">{signal.label}</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-content-muted">{signal.state}</span>
                  </motion.li>
                )
              })}
            </motion.ul>
          </div>
        </motion.article>
      </div>
    </section>
  )
}

function BuilderSection({ features }: { features: BuilderFeature[] }) {
  return (
    <section id="builder" className="border-t border-surface-border bg-obsidian px-4 py-24 md:px-10 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.article
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerChildren}
          className="rounded-xl border border-surface-border bg-surface-glass p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          <motion.div variants={fadeInUp} className="overflow-hidden rounded-lg border border-surface-border bg-obsidian">
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-bright">AI Builder</p>
                <h3 className="mt-1 font-[family-name:var(--font-syne)] text-xl font-bold text-white">Website + Funnel Architect</h3>
              </div>
              <div className="flex gap-1.5">
                <span className="size-2 rounded-full bg-gold" />
                <span className="size-2 rounded-full bg-emerald-bright" />
                <span className="size-2 rounded-full bg-content-muted" />
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-[0.85fr_1.15fr]">
              <section className="rounded-lg border border-surface-border bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-content-muted">Prompt</p>
                <p className="mt-4 text-sm leading-6 text-content">
                  Build a premium landing page, WhatsApp funnel, checkout flow, and launch campaign for a coaching brand selling a monthly membership.
                </p>
              </section>

              <section className="space-y-3 rounded-lg border border-surface-border bg-white/5 p-4">
                {['Hero copy generated', 'Offer stack configured', 'Paystack checkout attached', 'WhatsApp nurture sequence ready'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md bg-obsidian-soft px-3 py-3">
                    <CheckCircle2 className="size-4 text-emerald-bright" />
                    <span className="text-sm font-semibold text-content-muted">{item}</span>
                  </div>
                ))}
              </section>
            </div>
          </motion.div>
        </motion.article>

        <div>
          <SectionHeader
            label="Flagship Builder"
            title="Do not just build a website. Build a system that sells."
            description="The OGMJ AI Website and Funnel Builder converts business context into pages, copy, checkout, automation, CRM capture, and optimization loops."
          />

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerChildren} className="mt-10 grid gap-4 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon

              return (
                <motion.article key={feature.title} variants={fadeInUp} className="rounded-lg border border-surface-border bg-surface-glass p-5 backdrop-blur-xl">
                  <Icon className="mb-4 size-6 text-gold" />
                  <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-content-muted">{feature.description}</p>
                </motion.article>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function MarketplaceSection({ items }: { items: MarketplaceItem[] }) {
  const cards = [
    {
      title: 'Founder Launchpad',
      icon: Rocket,
      text: 'Turn raw ideas into organized offers, entities, brands, sites, and launch plans.',
    },
    {
      title: 'Asset Marketplace',
      icon: Store,
      text: 'Access services, templates, systems, contractors, and growth infrastructure.',
    },
    {
      title: 'Strategic Partnerships',
      icon: Handshake,
      text: 'Route investor, vendor, and collaboration opportunities through one global hub.',
    },
  ]

  return (
    <section id="marketplace" className="border-t border-surface-border bg-obsidian px-4 py-24 md:px-10 lg:py-32">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <SectionHeader
            label="Service Marketplace"
            title="A premium marketplace for business infrastructure."
            description="Deploy expert services, AI tools, and operating playbooks across the entire founder lifecycle."
          />

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerChildren} className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <motion.article
                key={item.label}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="rounded-lg border border-surface-border bg-surface-glass p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-content-muted">{item.label}</p>
                <p className="mt-4 font-[family-name:var(--font-syne)] text-4xl font-extrabold text-gold">{item.value}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerChildren} className="mt-14 grid gap-4 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon

            return (
              <motion.article key={card.title} variants={fadeInUp} className="rounded-lg border border-surface-border bg-surface-glass p-7 backdrop-blur-xl">
                <Icon className="mb-6 size-8 text-emerald-bright" />
                <h3 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">{card.title}</h3>
                <p className="mt-4 text-sm leading-6 text-content-muted">{card.text}</p>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

function OperatingStandardSection() {
  const standards = [
    'One platform for launch, brand, CRM, automation, finance, legal, academy, and marketplace.',
    'AI actively reduces manual work across every business module.',
    'Paystack, Flutterwave, Stripe, WhatsApp, and emerging-market growth workflows are first-class.',
    'Every experience is modular, premium, fast, and ready for enterprise upgrade paths.',
  ]

  return (
    <section className="border-t border-surface-border bg-obsidian-soft px-4 py-24 md:px-10 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeader
          label="Product Standard"
          title="Designed to feel IPO-ready from the first interaction."
          description="The system takes the best cues from Apple, Linear, Framer, Stripe, OpenAI, Shopify, HubSpot, and Vercel, then unifies them into a single business operating layer."
        />

        <motion.ul initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerChildren} className="space-y-4">
          {standards.map((standard) => (
            <motion.li key={standard} variants={fadeInUp} className="flex gap-4 rounded-lg border border-surface-border bg-surface-glass p-5 backdrop-blur-xl">
              <CheckCircle2 className="mt-1 size-5 shrink-0 text-emerald-bright" />
              <p className="text-base leading-7 text-content-muted">{standard}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

function InvestorsSection() {
  return (
    <section id="investors" className="border-t border-surface-border bg-obsidian px-4 py-20 md:px-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex max-w-[1440px] flex-col gap-8 rounded-xl border border-surface-border bg-surface-glass p-8 backdrop-blur-xl md:flex-row md:items-center md:justify-between"
      >
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-gold">Investor Signal</p>
          <h2 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-extrabold text-white md:text-5xl">
            From idea to empire, tracked in one operating layer.
          </h2>
        </header>
        <Link
          href="/contact"
          className="inline-flex h-12 items-center justify-center rounded-sm bg-gold px-7 font-[family-name:var(--font-syne)] font-extrabold text-black transition-all hover:bg-gold-400"
        >
          Request Access
          <ArrowRight className="ml-2 size-4" />
        </Link>
      </motion.div>
    </section>
  )
}

function FooterSection({ columns }: { columns: FooterColumn[] }) {
  return (
    <footer className="border-t border-surface-border bg-obsidian px-4 py-20 md:px-10 lg:py-28">
      <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-12 md:flex-row">
        <section aria-label="OGMJ Brands summary">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-extrabold text-content">OGMJ BRANDS 4.0</h2>
          <p className="mt-4 max-w-sm text-base leading-7 text-content-muted">
            The Intelligent Business Operating System for the next generation of global executives.
          </p>
        </section>

        <nav className="grid grid-cols-2 gap-10 lg:grid-cols-3" aria-label="Footer navigation">
          {columns.map((column) => (
            <section key={column.title} className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gold">{column.title}</h3>
              {column.links.map((link) => (
                <Link key={link.label} href={link.href} className="text-content-muted transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </section>
          ))}
          <section className="col-span-2 flex flex-col gap-4 lg:col-span-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gold">Connect</h3>
            <div className="flex gap-3">
              {[Network, Layers3, Globe2].map((Icon, index) => (
                <IconButton key={index} label={`Connect channel ${index + 1}`}>
                  <Icon className="size-4" />
                </IconButton>
              ))}
            </div>
          </section>
        </nav>
      </div>
    </footer>
  )
}

export default function Home() {
  return (
    <div className={`${syne.variable} ${dmSans.variable} min-h-screen overflow-hidden bg-obsidian font-[family-name:var(--font-dm-sans)] text-content`}>
      <TopNavigation navItems={content.navItems} />
      <HeroSection pageContent={content} />
      <DivisionsSection divisions={content.divisions} />
      <CommandCenterSection signals={content.commandSignals} />
      <MarketplaceSection items={content.marketplace} />
      <OperatingStandardSection />
      <InvestorsSection />
      <FooterSection columns={content.footerColumns} />
    </div>
  )
}
