// app/page.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { DM_Sans, Syne } from 'next/font/google'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleUserRound,
  Cpu,
  CreditCard,
  FileText,
  Gauge,
  Globe2,
  GraduationCap,
  Handshake,
  Layers3,
  Megaphone,
  MessageSquare,
  Rocket,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { TESTIMONIALS } from '@/lib/marketing/content'

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

interface Division {
  title: string
  description: string
  icon: LucideIcon
  span: string
  accent: 'default' | 'feature'
}

interface StatItem {
  label: string
  value: string
}

interface CommandSignal {
  label: string
  state: string
  icon: LucideIcon
}

interface ModulePoint {
  name: string
  value: number
}

interface PulsePoint {
  month: string
  value: number
}

interface FunnelPoint {
  stage: string
  value: number
}

interface MarketplaceCard {
  title: string
  description: string
  icon: LucideIcon
  size: 'lg' | 'sm'
}

interface FactItem {
  label: string
  icon: LucideIcon
}

interface FooterColumn {
  title: string
  links: NavItem[]
}

interface PageContent {
  navItems: NavItem[]
  primaryCta: NavItem
  secondaryCta: NavItem
  hero: {
    eyebrow: string
    headline: string
    accent: string
    subtext: string
  }
  pulse: PulsePoint[]
  metrics: { label: string; value: string; detail: string }[]
  stats: StatItem[]
  divisions: Division[]
  commandSignals: CommandSignal[]
  modules: ModulePoint[]
  checklist: string[]
  funnel: FunnelPoint[]
  marketplaceCards: MarketplaceCard[]
  statementFacts: FactItem[]
  footerColumns: FooterColumn[]
}

const content: PageContent = {
  navItems: [
    { label: 'Divisions', href: '#divisions' },
    { label: 'Marketplace', href: '#marketplace' },
    { label: 'Command Center', href: '#command-center' },
    { label: 'Pricing', href: '/pricing' },
  ],
  primaryCta: { label: 'Start Your Empire', href: '/signup' },
  secondaryCta: { label: 'Walk through the journey', href: '#divisions' },
  hero: {
    eyebrow: 'From Idea To Empire',
    headline: 'You bring the idea.',
    accent: 'We build the empire.',
    subtext:
      'Every empire starts the same way — one founder, one idea, no team. OGMJ BRANDS gives you the AI operating system that carries you through every chapter: the brand, the funnel, the first sale, the thousandth.',
  },
  pulse: [
    { month: 'Jan', value: 38 },
    { month: 'Feb', value: 44 },
    { month: 'Mar', value: 41 },
    { month: 'Apr', value: 52 },
    { month: 'May', value: 61 },
    { month: 'Jun', value: 58 },
    { month: 'Jul', value: 72 },
    { month: 'Aug', value: 81 },
  ],
  metrics: [
    { label: 'Revenue growth', value: '+41.2%', detail: 'Predictive growth systems active' },
    { label: 'Automation speed', value: '0.04s', detail: 'Average decision latency' },
  ],
  stats: [
    { label: 'Launch tracks', value: '18' },
    { label: 'Service categories', value: '42' },
    { label: 'Automations', value: '120+' },
    { label: 'Operating regions', value: 'Global' },
  ],
  divisions: [
    {
      title: 'AI Command Center',
      description: 'Executive dashboard for decisions, revenue, operations, and strategic alerts.',
      icon: Gauge,
      span: 'md:col-span-2 md:row-span-2',
      accent: 'feature',
    },
    {
      title: 'Business Formation',
      description: 'Entity launch, legal workflow, compliance routing, and document generation.',
      icon: Building2,
      span: '',
      accent: 'default',
    },
    {
      title: 'Brand Identity Studio',
      description: 'Premium naming, voice, visual systems, offers, content, and campaign strategy.',
      icon: Sparkles,
      span: '',
      accent: 'default',
    },
    {
      title: 'Website & Funnel Architect',
      description: 'AI-generated sites, funnels, conversion copy, checkout flows, and analytics.',
      icon: Layers3,
      span: '',
      accent: 'default',
    },
    {
      title: 'Automation Engine',
      description: 'Workflow builder for sales, CRM, approvals, fulfillment, support, and finance.',
      icon: Workflow,
      span: '',
      accent: 'default',
    },
    {
      title: 'Global CRM',
      description: 'Pipeline, orders, client intelligence, approvals, follow-ups, and revenue control.',
      icon: UsersRound,
      span: '',
      accent: 'default',
    },
    {
      title: 'AI Ads Manager',
      description: 'Google, Meta, TikTok, YouTube, retargeting, campaign insights, and creative testing.',
      icon: Megaphone,
      span: '',
      accent: 'default',
    },
    {
      title: 'Finance Gateway',
      description: 'Payments, ledgers, payouts, subscriptions, invoices, and financial command visibility.',
      icon: BadgeDollarSign,
      span: '',
      accent: 'default',
    },
    {
      title: 'Legal Architect',
      description: 'AI-guided policies, agreements, compliance packets, and approval-safe document suites.',
      icon: Scale,
      span: '',
      accent: 'default',
    },
    {
      title: 'Academy Hub',
      description: 'Knowledge base, training paths, community intelligence, and founder education.',
      icon: GraduationCap,
      span: '',
      accent: 'default',
    },
    {
      title: 'Startup Launchpad',
      description: 'Validation, pitch decks, GTM plans, investor readiness, and launch sequencing.',
      icon: Rocket,
      span: '',
      accent: 'default',
    },
    {
      title: 'Client Portal',
      description: 'Approvals, files, conversations, invoices, project status, and client-facing clarity.',
      icon: FileText,
      span: 'md:col-span-2',
      accent: 'default',
    },
  ],
  commandSignals: [
    { label: 'Client pipeline intelligence', state: 'Scanning', icon: Search },
    { label: 'Revenue system forecast', state: 'Optimized', icon: BarChart3 },
    { label: 'Workflow execution mesh', state: 'Live', icon: Cpu },
    { label: 'Risk and compliance guardrails', state: 'Protected', icon: ShieldCheck },
  ],
  modules: [
    { name: 'CRM', value: 82 },
    { name: 'Finance', value: 74 },
    { name: 'Ads', value: 65 },
    { name: 'Legal', value: 58 },
    { name: 'Content', value: 70 },
  ],
  checklist: [
    'Hero copy generated',
    'Offer stack configured',
    'Paystack checkout attached',
    'WhatsApp nurture sequence live',
  ],
  funnel: [
    { stage: 'Visits', value: 100 },
    { stage: 'Leads', value: 46 },
    { stage: 'Customers', value: 18 },
  ],
  marketplaceCards: [
    {
      title: 'Founder Launchpad',
      description: 'Turn a raw idea into an organized offer, entity, brand, and launch plan.',
      icon: Rocket,
      size: 'lg',
    },
    {
      title: 'Asset Marketplace',
      description: 'Services, templates, and growth infrastructure from vetted partners.',
      icon: Store,
      size: 'sm',
    },
    {
      title: 'Strategic Partnerships',
      description: 'Route investor and collaboration opportunities through one hub.',
      icon: Handshake,
      size: 'sm',
    },
  ],
  statementFacts: [
    { label: 'Paystack and Flutterwave native', icon: CreditCard },
    { label: 'WhatsApp-first client conversations', icon: MessageSquare },
    { label: 'Built for emerging-market founders first', icon: Globe2 },
  ],
  footerColumns: [
    {
      title: 'Platform',
      links: [
        { label: 'Divisions', href: '#divisions' },
        { label: 'Marketplace', href: '#marketplace' },
        { label: 'Command Center', href: '#command-center' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Terms', href: '/terms' },
        { label: 'Privacy', href: '/privacy' },
      ],
    },
  ],
}

const EASE = [0.16, 1, 0.3, 1] as const

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

const staggerChildren: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function BentoCard({
  children,
  className,
  accent = 'default',
}: {
  children: React.ReactNode
  className?: string
  accent?: 'default' | 'feature'
}) {
  return (
    <div
      className={cx(
        'group relative rounded-[1.75rem] bg-white/[0.03] p-1.5 ring-1 ring-white/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-gold/30',
        className,
      )}
    >
      <div
        className={cx(
          'relative flex h-full flex-col overflow-hidden rounded-[1.4rem] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
          accent === 'feature' ? 'bg-gradient-to-br from-gold/[0.10] via-obsidian-soft to-obsidian-soft' : 'bg-obsidian-soft/60',
        )}
      >
        {children}
      </div>
    </div>
  )
}

function PillButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex h-12 items-center gap-3 rounded-full bg-gold py-1 pl-6 pr-1.5 font-[family-name:var(--font-syne)] text-sm font-bold text-obsidian transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-gold-400 active:scale-[0.98]"
    >
      {children}
      <span className="flex size-9 items-center justify-center rounded-full bg-obsidian/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
        <ArrowRight className="size-4" strokeWidth={2} />
      </span>
    </Link>
  )
}

function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-7 font-[family-name:var(--font-syne)] text-sm font-bold text-content transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-gold/50 hover:text-gold active:scale-[0.98]"
    >
      {children}
    </Link>
  )
}

function TopNav({ navItems, primaryCta }: { navItems: NavItem[]; primaryCta: NavItem }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        className="flex h-14 w-full max-w-[1400px] items-center justify-between rounded-full border border-white/10 bg-obsidian/70 px-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:px-6"
        aria-label="Primary navigation"
      >
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/ogmj-mark.png" alt="OGMJ Brands" width={20} height={20} className="size-5 rounded-full object-cover" priority />
          <span className="font-[family-name:var(--font-syne)] text-base font-bold text-content">OGMJ BRANDS</span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="text-xs font-bold uppercase tracking-wide text-content-muted transition-colors hover:text-gold"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            aria-label="Account"
            className="flex size-9 items-center justify-center rounded-full border border-white/10 text-content-muted transition-colors hover:border-gold/40 hover:text-gold"
          >
            <CircleUserRound className="size-4" strokeWidth={1.5} />
          </Link>
          <PillButton href={primaryCta.href}>{primaryCta.label}</PillButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open ? 'true' : 'false'}
          className="relative flex size-9 items-center justify-center lg:hidden"
        >
          <motion.span
            animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="absolute h-[1.5px] w-5 bg-content"
          />
          <motion.span
            animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="absolute h-[1.5px] w-5 bg-content"
          />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 top-0 z-40 flex flex-col bg-obsidian/95 backdrop-blur-2xl lg:hidden"
          >
            <div className="flex h-20 items-center justify-end px-6">
              <span className="text-xs uppercase tracking-widest text-content-muted">Menu</span>
            </div>
            <ul className="flex flex-1 flex-col items-start justify-center gap-6 px-8">
              {[...navItems, { label: 'Account', href: '/login' }].map((item, index) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.06, ease: EASE }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="font-[family-name:var(--font-syne)] text-3xl font-bold text-content"
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + navItems.length * 0.06, ease: EASE }}
                className="pt-4"
              >
                <PillButton href={primaryCta.href}>{primaryCta.label}</PillButton>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function PulsePanel({
  pulse,
  metrics,
}: {
  pulse: PulsePoint[]
  metrics: { label: string; value: string; detail: string }[]
}) {
  return (
    <div className="relative">
      <BentoCard accent="feature" className="shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-content-muted">Business OS Pulse</p>
            <p className="mt-1 font-[family-name:var(--font-syne)] text-xl font-bold text-content">Revenue &amp; Automation</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-gold">
            <span className="size-1.5 rounded-full bg-gold" />
            Live
          </span>
        </div>

        <div className="mt-6 h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pulse} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8FF00" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#C8FF00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
                contentStyle={{
                  background: '#0E1116',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#C8FF00"
                strokeWidth={2}
                fill="url(#pulseFill)"
                isAnimationActive
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </BentoCard>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <BentoCard key={metric.label}>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-content-muted">{metric.label}</p>
            <p className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-content">{metric.value}</p>
            <p className="mt-1 text-xs leading-5 text-content-muted">{metric.detail}</p>
          </BentoCard>
        ))}
      </div>
    </div>
  )
}

function Hero({
  eyebrow,
  headline,
  accent,
  subtext,
  primaryCta,
  secondaryCta,
  pulse,
  metrics,
}: {
  eyebrow: string
  headline: string
  accent: string
  subtext: string
  primaryCta: NavItem
  secondaryCta: NavItem
  pulse: PulsePoint[]
  metrics: { label: string; value: string; detail: string }[]
}) {
  const prefersReduced = useReducedMotion()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20 })
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [4, -4])
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-4, 4])

  return (
    <section
      className="relative flex min-h-[100dvh] w-full flex-col justify-center overflow-hidden bg-obsidian px-4 pb-16 pt-24"
      onMouseMove={(event) => {
        if (prefersReduced) return
        const bounds = event.currentTarget.getBoundingClientRect()
        mouseX.set((event.clientX - bounds.left) / bounds.width - 0.5)
        mouseY.set((event.clientY - bounds.top) / bounds.height - 0.5)
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/site/service-business.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.22]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/85 to-obsidian/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-obsidian/60" />
        <div className="absolute -left-40 -top-40 size-[520px] rounded-full bg-gold/10 blur-[140px]" />
        <div className="absolute -bottom-40 right-0 size-[480px] rounded-full bg-emerald/10 blur-[140px]" />
        <div className="absolute right-1/3 top-0 size-[280px] rounded-full bg-heritage/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] gap-14 lg:grid-cols-12 lg:items-center">
        <motion.div
          initial={prefersReduced ? false : 'hidden'}
          animate="visible"
          variants={staggerChildren}
          className="flex flex-col items-start gap-6 lg:col-span-7"
        >
          <motion.p
            variants={fadeInUp}
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold"
          >
            {eyebrow}
          </motion.p>

          <motion.h1
            variants={fadeInUp}
            className="font-[family-name:var(--font-syne)] text-5xl font-bold leading-[1.05] text-content sm:text-6xl lg:text-7xl"
          >
            <span className="block">{headline}</span>
            <span className="block text-gold">{accent}</span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="max-w-lg text-lg leading-8 text-content-muted">
            {subtext}
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
            <PillButton href={primaryCta.href}>{primaryCta.label}</PillButton>
            <GhostButton href={secondaryCta.href}>{secondaryCta.label}</GhostButton>
          </motion.div>
        </motion.div>

        <motion.div
          style={prefersReduced ? undefined : { rotateX, rotateY, transformPerspective: 1000 }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          className="relative lg:col-span-5"
        >
          <PulsePanel pulse={pulse} metrics={metrics} />
        </motion.div>
      </div>
    </section>
  )
}

function StatBand({ stats }: { stats: StatItem[] }) {
  const prefersReduced = useReducedMotion()

  return (
    <section className="border-t border-white/5 px-4 py-14 md:px-10">
      <motion.div
        initial={prefersReduced ? false : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerChildren}
        className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-white/5 md:grid-cols-4"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeInUp}
            className="px-4 py-2 text-center first:pl-0 md:text-left md:first:pl-4"
          >
            <p className="font-[family-name:var(--font-syne)] text-3xl font-bold text-content md:text-4xl">
              {stat.value}
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-content-muted">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function DivisionsBento({ divisions }: { divisions: Division[] }) {
  const prefersReduced = useReducedMotion()

  return (
    <section id="divisions" className="border-t border-white/5 px-4 py-24 md:px-10 lg:py-32">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">The Journey — Chapter by Chapter</p>
          <h2 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-content md:text-5xl">
            Every stage of your story, one system that already knows the plot.
          </h2>
          <p className="mt-6 text-base leading-7 text-content-muted">
            Day one you form the company. Week one you have a brand and a funnel. Month one the CRM is full and
            invoices are moving. Launch, brand, CRM, automation, finance, legal and learning — running on the same
            data instead of a dozen disconnected tools.
          </p>
        </Reveal>

        <motion.div
          initial={prefersReduced ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerChildren}
          className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-4"
        >
          {divisions.map((division) => {
            const Icon = division.icon

            return (
              <motion.div key={division.title} variants={fadeInUp} className={division.span}>
                <BentoCard accent={division.accent} className="h-full">
                  <Icon
                    className={cx('mb-6 size-7', division.accent === 'feature' ? 'text-gold' : 'text-content-muted')}
                    strokeWidth={1.5}
                  />
                  <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold text-content">
                    {division.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-content-muted">{division.description}</p>
                </BentoCard>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

function CommandCenterSplit({
  signals,
  modules,
}: {
  signals: CommandSignal[]
  modules: ModulePoint[]
}) {
  return (
    <section id="command-center" className="border-t border-white/5 bg-obsidian-soft/40 px-4 py-24 md:px-10 lg:py-32">
      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Command Center</p>
          <h2 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-content md:text-5xl">
            See the whole business at once.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-content-muted">
            Revenue, pipeline, compliance, and automation status collapse into one live view, so decisions do not
            wait on five different logins.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <BentoCard>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-content-muted">Automation coverage</p>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald/10 px-2.5 py-1 text-[11px] font-bold text-emerald-bright">
                <Cpu className="size-3" strokeWidth={1.5} />
                Live
              </span>
            </div>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modules} barCategoryGap="28%">
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{
                      background: '#0E1116',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <ul className="mt-6 divide-y divide-white/5 border-t border-white/5">
              {signals.map((signal) => {
                const Icon = signal.icon

                return (
                  <li key={signal.label} className="flex items-center gap-3 py-3">
                    <Icon className="size-4 shrink-0 text-gold" strokeWidth={1.5} />
                    <span className="flex-1 text-sm font-medium text-content">{signal.label}</span>
                    <span className="text-xs font-bold uppercase tracking-wide text-content-muted">
                      {signal.state}
                    </span>
                  </li>
                )
              })}
            </ul>
          </BentoCard>
        </Reveal>
      </div>
    </section>
  )
}

function BuilderSplit({ checklist, funnel }: { checklist: string[]; funnel: FunnelPoint[] }) {
  const prefersReduced = useReducedMotion()

  return (
    <section className="border-t border-white/5 px-4 py-24 md:px-10 lg:py-32">
      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal className="order-2 lg:order-1">
          <BentoCard>
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-content-muted">Visit to customer</p>

            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    axisLine={false}
                    tickLine={false}
                    width={80}
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#C8FF00" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <ul className="mt-6 space-y-3">
              {checklist.map((item, index) => (
                <motion.li
                  key={item}
                  initial={prefersReduced ? false : { opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: EASE }}
                  className="flex items-center gap-3 text-sm font-medium text-content-muted"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-bright" strokeWidth={1.5} />
                  {item}
                </motion.li>
              ))}
            </ul>
          </BentoCard>
        </Reveal>

        <Reveal delay={0.1} className="order-1 lg:order-2">
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-content md:text-5xl">
            Websites that convert, not just render.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-content-muted">
            One prompt turns a business idea into a live site, a funnel, and a checkout, wired into the same CRM as
            everything else.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function MarketplaceCluster({ cards }: { cards: MarketplaceCard[] }) {
  return (
    <section id="marketplace" className="border-t border-white/5 px-4 py-24 md:px-10 lg:py-32">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-content md:text-5xl">
            Where founders find what is next.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-3 lg:grid-rows-2">
          {cards.map((card, index) => {
            const Icon = card.icon

            return (
              <Reveal
                key={card.title}
                delay={index * 0.08}
                className={card.size === 'lg' ? 'lg:col-span-2 lg:row-span-2' : ''}
              >
                <BentoCard accent={card.size === 'lg' ? 'feature' : 'default'} className="h-full">
                  <Icon className="mb-6 size-7 text-gold" strokeWidth={1.5} />
                  <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold text-content">{card.title}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-content-muted">{card.description}</p>
                </BentoCard>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

const SERVICE_PHOTOS = [
  {
    src: '/site/service-business.jpg',
    title: 'Business Operations',
    description: 'Run registration, compliance, and day-to-day operations from one command layer.',
  },
  {
    src: '/site/branding.jpg',
    title: 'Branding',
    description: 'Identity systems, brand guidelines, and creative direction built for global markets.',
  },
  {
    src: '/site/capabilities.jpg',
    title: 'Analytics & Automation',
    description: 'Live dashboards and AI-assisted workflows that turn activity into decisions.',
  },
  {
    src: '/site/business-launch.jpg',
    title: 'Launch',
    description: 'Go-to-market strategy, positioning, and a launch sequence that ships on time.',
  },
  {
    src: '/site/support.jpg',
    title: 'Support',
    description: 'A dedicated team on call for every stage, from onboarding to scale.',
  },
  {
    src: '/site/dashboard.jpg',
    title: 'Track Everything',
    description: 'Revenue, pipeline, and team performance visible in real time, no spreadsheets.',
  },
] as const

function ServicesShowcase() {
  return (
    <section id="services" className="border-t border-white/5 px-4 py-24 md:px-10 lg:py-32">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Services</p>
          <h2 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-content md:text-5xl">
            Everything a founder needs to look, and run, like the real thing.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_PHOTOS.map((service, index) => (
            <Reveal key={service.title} delay={index * 0.06}>
              <div className="group relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/10">
                <Image
                  src={service.src}
                  alt={service.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold text-content">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-content-muted">{service.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

const TESTIMONIAL_PHOTOS: Record<string, string> = {
  MS: '/site/testimonial-2.jpg',
  AM: '/site/testimonial-1.jpg',
  JO: '/site/testimonial-3.jpg',
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="border-t border-white/5 bg-obsidian-soft/40 px-4 py-24 md:px-10 lg:py-32">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Testimonials</p>
          <h2 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-content md:text-5xl">
            Founders who moved faster with OGMJ.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <Reveal key={testimonial.name} delay={index * 0.08}>
              <BentoCard className="h-full">
                <p className="text-base leading-7 text-content-muted">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-white/10">
                    <Image
                      src={TESTIMONIAL_PHOTOS[testimonial.initials] || '/site/testimonial-1.jpg'}
                      alt={testimonial.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-content">{testimonial.name}</p>
                    <p className="text-xs text-content-muted">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </BentoCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function StatementBand({ facts }: { facts: FactItem[] }) {
  return (
    <section className="border-t border-white/5 bg-obsidian-soft/40 px-4 py-24 md:px-10 lg:py-32">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="max-w-3xl">
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-content md:text-5xl">
            Twelve tools. One workspace.
          </h2>
          <p className="mt-6 text-lg leading-8 text-content-muted">
            Most founders stitch together a website builder, a CRM, an ads dashboard, a payment processor, and a
            compliance folder just to run one business. OGMJ replaces the stitching with a single operating layer,
            so every department reads the same data and moves on the same day.
          </p>
        </Reveal>

        <Reveal
          delay={0.1}
          className="mt-12 flex flex-col gap-6 border-t border-white/5 pt-10 sm:flex-row sm:flex-wrap sm:gap-10"
        >
          {facts.map((fact) => {
            const Icon = fact.icon

            return (
              <div key={fact.label} className="flex items-center gap-3">
                <Icon className="size-5 text-gold" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-content-muted">{fact.label}</span>
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}

function InvestorBanner() {
  return (
    <section id="investors" className="px-4 py-20 md:px-10">
      <Reveal className="relative mx-auto flex max-w-[1400px] flex-col gap-8 overflow-hidden rounded-[2rem] border border-white/10 p-10 md:flex-row md:items-center md:justify-between">
        <Image
          src="/site/cta-bg.jpg"
          alt=""
          fill
          sizes="(min-width: 1400px) 1400px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/80 to-obsidian/50" />
        <h2 className="relative max-w-xl font-[family-name:var(--font-syne)] text-2xl font-bold leading-tight text-content md:text-4xl">
          Track the business from idea to scale.
        </h2>
        <div className="relative">
          <PillButton href="/contact">Request Access</PillButton>
        </div>
      </Reveal>
    </section>
  )
}

function Footer({ columns }: { columns: FooterColumn[] }) {
  return (
    <footer className="border-t border-white/5 px-4 py-20 md:px-10 lg:py-24">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-12 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/ogmj-mark.png" alt="OGMJ Brands" width={20} height={20} className="size-5 rounded-full object-cover" />
            <span className="font-[family-name:var(--font-syne)] text-lg font-bold text-content">OGMJ BRANDS</span>
          </Link>
          <p className="mt-4 text-sm leading-7 text-content-muted">
            The operating system African and global founders use to launch, run, and grow a business without
            stitching together a dozen tools.
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-10" aria-label="Footer navigation">
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-content-muted">{column.title}</h3>
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-content-muted transition-colors hover:text-content"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>

      <div className="mx-auto mt-16 max-w-[1400px] border-t border-white/5 pt-8 text-xs text-content-muted/70">
        Copyright {new Date().getFullYear()} OGMJ Brands. All rights reserved.
      </div>
    </footer>
  )
}

export default function Home() {
  return (
    <div
      className={`${syne.variable} ${dmSans.variable} relative min-h-screen bg-obsidian font-[family-name:var(--font-dm-sans)] text-content`}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]"
      />

      <TopNav navItems={content.navItems} primaryCta={content.primaryCta} />

      <Hero
        eyebrow={content.hero.eyebrow}
        headline={content.hero.headline}
        accent={content.hero.accent}
        subtext={content.hero.subtext}
        primaryCta={content.primaryCta}
        secondaryCta={content.secondaryCta}
        pulse={content.pulse}
        metrics={content.metrics}
      />

      <StatBand stats={content.stats} />
      <DivisionsBento divisions={content.divisions} />
      <CommandCenterSplit signals={content.commandSignals} modules={content.modules} />
      <BuilderSplit checklist={content.checklist} funnel={content.funnel} />
      <MarketplaceCluster cards={content.marketplaceCards} />
      <ServicesShowcase />
      <TestimonialsSection />
      <StatementBand facts={content.statementFacts} />
      <InvestorBanner />
      <Footer columns={content.footerColumns} />
    </div>
  )
}


