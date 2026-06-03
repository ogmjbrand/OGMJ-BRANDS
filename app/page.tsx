'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  CircleDot,
  Briefcase,
  Cpu,
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  Rocket,
  Users,
  MessageSquare,
  BookOpen,
  ArrowUpRight,
  Globe2,
  Layers,
  Wand2,
} from 'lucide-react'

const services = [
  {
    title: 'Business Registration',
    description: 'From entity setup to compliant expansion, launch with legal clarity and global readiness.',
    icon: Briefcase,
  },
  {
    title: 'Business Launch',
    description: 'High-impact launches powered by platform operations, positioning, and launch engines.',
    icon: Rocket,
  },
  {
    title: 'Branding',
    description: 'Premium identity systems that connect brand story, digital product, and growth.',
    icon: Sparkles,
  },
  {
    title: 'Website Development',
    description: 'Conversion-first websites designed for speed, scale, and cinematic storytelling.',
    icon: LayoutDashboard,
  },
  {
    title: 'App Development',
    description: 'Enterprise-ready mobile and web products with polished UX and automation.',
    icon: Cpu,
  },
  {
    title: 'AI Automation',
    description: 'Smart workflows that unify CRM, follow-up, and executive operations.',
    icon: TrendingUp,
  },
  {
    title: 'Executive Assistant',
    description: 'White-glove support for founders, operators, and growth leadership.',
    icon: Users,
  },
  {
    title: 'Marketing',
    description: 'Creative campaigns and analytics built for premium momentum.',
    icon: MessageSquare,
  },
  {
    title: 'Video Editing',
    description: 'Cinematic content production that amplifies launch and brand storytelling.',
    icon: BookOpen,
  },
]

const marketplace = [
  {
    title: 'Brand Systems',
    description: 'Identity, naming, messaging, and launch-ready digital frameworks.',
    icon: Layers,
  },
  {
    title: 'Launch Ops',
    description: 'Registration, go-live coordination, and enterprise launch control.',
    icon: Rocket,
  },
  {
    title: 'AI Workflows',
    description: 'Automation stacks for CRM, revenue, retention, and executive operations.',
    icon: Cpu,
  },
  {
    title: 'Growth Studio',
    description: 'Creative growth systems, analytics, and global scaling operations.',
    icon: TrendingUp,
  },
]

const journey = [
  { title: 'Idea', detail: 'Strategy, vision and positioning for premium founders.' },
  { title: 'Registration', detail: 'Entity setup, compliance, and launch infrastructure.' },
  { title: 'Brand', detail: 'Story, identity, and digital systems for elite names.' },
  { title: 'Website', detail: 'Conversion-led experience design for product and growth.' },
  { title: 'Automation', detail: 'AI workflows, CRM, and operational intelligence.' },
  { title: 'Growth', detail: 'Analytics, momentum, and global scaling systems.' },
]

const ecosystem = [
  'Client dashboard',
  'Project tracking',
  'CRM',
  'AI assistant',
  'Service marketplace',
  'Knowledge center',
  'Client portal',
  'Team collaboration',
  'BOS dashboard',
  'Analytics center',
]

const metrics = [
  {
    label: 'Revenue lift',
    value: '42%',
    description: 'Average revenue gain for clients in the first 90 days.',
  },
  {
    label: 'Launch speed',
    value: '3x faster',
    description: 'Accelerated go-to-market timelines with premium execution.',
  },
  {
    label: 'Retention',
    value: '96%',
    description: 'Enterprise-level client loyalty built on trust, strategy, and growth.',
  },
]

const roadmap = [
  { step: 'Discover', detail: 'Strategy, vision, positioning, global growth plan' },
  { step: 'Design', detail: 'Identity, UX systems, cinematic digital presence' },
  { step: 'Launch', detail: 'Website, app, automation, go-live operations' },
  { step: 'Scale', detail: 'Growth, AI automation, partnerships, enterprise expansion' },
]

const testimonials = [
  {
    quote: 'OGMJ BRANDS transformed our business into a premium global operator with speed and confidence.',
    name: 'Marcelo Santos',
    role: 'Founder, Luma Ventures',
  },
  {
    quote: 'The strategy, dashboard, and automation stack made our launch feel effortless and elite.',
    name: 'Ava Morgan',
    role: 'CEO, Verge Collective',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#04060A] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#04060A]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">OGMJ BRANDS</p>
            <h1 className="text-lg font-black text-white">Global Business Operating System</h1>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#services" className="transition hover:text-white">Services</a>
            <a href="#roadmap" className="transition hover:text-white">Roadmap</a>
            <a href="#stories" className="transition hover:text-white">Stories</a>
            <a href="#contact" className="transition hover:text-white">Contact</a>
          </nav>

          <Link
            href="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-black shadow-gold-glow transition duration-300 hover:shadow-gold-glow-lg"
          >
            Get Started
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 pt-20 pb-24 sm:pb-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_18%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_18%)] blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-[#D4AF37]/20 via-transparent to-[#10B981]/10 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.1fr_0.85fr] lg:items-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.8, ease: 'easeOut' }}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm tracking-[0.24em] text-white/80 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-gold" />
              PREMIUM GLOBAL BUSINESS OS
            </span>

            <h1 className="max-w-3xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              Luxury business operations, AI automation, and world-class launches in one unforgettable platform.
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              OGMJ BRANDS is the premium business OS built to move founders from idea to registration, brand, website, automation, and growth inside one unified ecosystem.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold to-amber-400 px-8 py-4 text-base font-semibold text-black shadow-gold-glow transition duration-300 hover:scale-[1.01] hover:shadow-gold-glow-lg"
              >
                Start your premium suite
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white transition duration-300 hover:border-gold/50 hover:bg-white/10"
              >
                Explore the platform
              </Link>
            </div>

            <div className="mt-12 grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="rounded-[2.5rem] border border-white/10 bg-[#0B1119]/95 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Platform journey</p>
                <h2 className="mt-4 text-3xl font-semibold text-white">From idea to launch, every phase flows inside one premium ecosystem</h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  OGMJ BRANDS is not a typical agency — it is a business operating system that unifies registration, brand, website, automation, and growth into a single premium experience.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {journey.map((step, index) => (
                    <div key={step.title} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:border-gold/30">
                      <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Step {index + 1}</p>
                      <p className="mt-3 text-xl font-semibold text-white">{step.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{step.detail}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <div className="rounded-[2.5rem] border border-white/10 bg-[#0B1119]/95 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">One platform, all phases</p>
                <h2 className="mt-4 text-3xl font-semibold text-white">A unified operating system, not just a service list</h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  Every module is connected: your brand lives alongside your website, automation, launch operations, and growth intelligence.
                </p>
                <div className="mt-8 grid gap-3">
                  {['Brand systems', 'Launch operations', 'Automation suite', 'Growth studio', 'Executive dashboard'].map((item) => (
                    <div key={item} className="rounded-3xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:-translate-y-1 hover:bg-white/10">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
                  <p className="text-sm uppercase tracking-[0.26em] text-slate-400">{metric.label}</p>
                  <p className="mt-4 text-4xl font-semibold text-white">{metric.value}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{metric.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} className="relative mx-auto w-full max-w-2xl">
            <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30" />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0E1318]/95 p-8">
              <div className="absolute -left-14 top-8 h-40 w-40 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent blur-3xl" />
              <div className="absolute -right-10 top-40 h-32 w-32 rounded-full bg-gradient-to-br from-sky-400/10 to-transparent blur-3xl" />
              <div className="mb-7 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">OGMJ Command Center</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Ecosystem intelligence in one luxurious hub</h2>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase text-slate-200">Live</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-[#11161E]/90 p-5 shadow-glow-lg">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Pipeline</p>
                        <p className="text-xl font-semibold text-white">$2.4M</p>
                      </div>
                      <DollarSign className="h-6 w-6 text-gold" />
                    </div>
                    <div className="mt-5 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-gradient-to-r from-gold to-amber-400" style={{ width: '72%' }} />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-[#11161E]/90 p-5 shadow-glow-lg">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.32em] text-slate-400">AI tasks</p>
                        <p className="text-xl font-semibold text-white">84 active workflows</p>
                      </div>
                      <Cpu className="h-6 w-6 text-sky-400" />
                    </div>
                    <div className="mt-5 grid gap-3">
                      <span className="inline-flex rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300">Launch campaign automation</span>
                      <span className="inline-flex rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300">Intelligent follow-up flow</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0C1116] via-[#0F1620] to-[#121A25] p-5 shadow-2xl shadow-black/30">
                  <div className="grid gap-3">
                    {ecosystem.slice(0, 5).map((item) => (
                      <div key={item} className="rounded-3xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:-translate-y-1 hover:bg-white/10">
                        {item}
                      </div>
                    ))}
                    <div className="mt-2 rounded-3xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-300">
                      + more premium systems
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-black/10 p-4 text-sm text-slate-300 backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">AI Growth</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">Global launch ops</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">Executive collaboration</span>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'KPI heatmap', value: 'Top growth metrics', accent: 'text-gold' },
                  { label: 'Launch node', value: 'Global go-live status', accent: 'text-sky-400' },
                  { label: 'Pulse alert', value: 'AI signals active', accent: 'text-emerald-400' },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.75rem] border border-white/10 bg-[#0A1018]/95 p-5 text-sm text-slate-300 shadow-2xl shadow-black/15 transition hover:-translate-y-1 hover:border-gold/30">
                    <p className="uppercase tracking-[0.32em] text-slate-500">{item.label}</p>
                    <p className={`mt-3 text-2xl font-semibold ${item.accent}`}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-[2.25rem] border border-white/10 bg-[#070B12]/95 p-4">
                <div className="relative h-[320px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#06080E]">
                  <div className="absolute left-4 top-4 rounded-3xl border border-white/10 bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-200 backdrop-blur-sm">
                    Executive snapshot
                  </div>
                  <Image
                    src="/aesthetic-dashboard.svg"
                    alt="Premium business dashboard visualization"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 520px"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="immersive" className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Immersive 3D interface</p>
              <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Explore the platform through layered 3D command panels</h2>
              <p className="max-w-xl text-lg leading-8 text-slate-300">
                Experience premium systems built with depth, motion, and magnetic interaction for founders and teams who expect a cinematic operating environment.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Executive UX', value: 'Elite experience design', icon: Layers },
                  { label: 'Operational Control', value: 'Real-time launch intelligence', icon: Globe2 },
                  { label: 'AI-led Growth', value: 'Smart automation & insights', icon: Wand2 },
                  { label: 'Global Reach', value: 'Scalable systems worldwide', icon: ArrowUpRight },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl transition hover:-translate-y-1 hover:border-gold/30"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gold/10 text-gold">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-sm uppercase tracking-[0.28em] text-slate-400">{item.label}</p>
                      <p className="mt-3 text-lg font-semibold text-white">{item.value}</p>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative w-full max-w-xl"
                style={{ perspective: 1400 }}
              >
                <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-[#D4AF37]/15 via-transparent to-[#10B981]/10 blur-3xl" />
                <motion.div
                  whileHover={{ rotateY: 8, rotateX: -4, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                  className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-[#06090F]/95 p-8 shadow-2xl shadow-black/40"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="relative grid gap-5">
                    <div className="rounded-[2rem] border border-white/10 bg-[#0F1623]/95 p-6 shadow-glow-lg" style={{ transform: 'translateZ(40px)' }}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Pulse view</p>
                          <p className="mt-2 text-xl font-semibold text-white">Realtime launch score</p>
                        </div>
                        <Layers className="h-5 w-5 text-gold" />
                      </div>
                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        {['Market', 'Ops', 'AI'].map((label) => (
                          <div key={label} className="rounded-2xl bg-white/5 px-3 py-2 text-center text-xs uppercase tracking-[0.28em] text-slate-300">
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[2rem] border border-white/10 bg-[#0B1119]/95 p-5 shadow-2xl shadow-black/20" style={{ transform: 'translateZ(20px)' }}>
                        <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Momentum</p>
                        <p className="mt-3 text-3xl font-semibold text-white">4.8x</p>
                        <p className="mt-2 text-sm text-slate-400">Launch acceleration with AI-driven workflows.</p>
                      </div>
                      <div className="rounded-[2rem] border border-white/10 bg-[#0B1119]/95 p-5 shadow-2xl shadow-black/20" style={{ transform: 'translateZ(10px)' }}>
                        <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Signal</p>
                        <p className="mt-3 text-3xl font-semibold text-white">72%</p>
                        <p className="mt-2 text-sm text-slate-400">Conversion score for premium launch funnels.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="border-t border-white/10 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Premium service ecosystem</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Luxury business services for every stage of growth</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              From brand strategy to AI automation, OGMJ BRANDS provides a full suite of services designed to help enterprise leaders move faster with confidence.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <motion.div
                  key={service.title}
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  className="group rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-gold/10 text-gold transition duration-300 group-hover:bg-gold/15">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{service.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-slate-300">{service.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
      
      <section id="marketplace" className="border-t border-white/10 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Service marketplace</p>
              <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">A premium marketplace for every business operating need</h2>
              <p className="max-w-xl text-lg leading-8 text-slate-300">
                Discover curated offerings across branding, automation, launch operations, and growth systems designed for enterprise founders.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Dashboard', 'Strategy', 'AI Automation', 'Growth', 'Creative'].map((item) => (
                  <span key={item} className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.28em] text-slate-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {marketplace.map((item) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={item.title}
                    whileHover={{ y: -6 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    className="group rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl"
                  >
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-gold transition duration-300 group-hover:bg-gold/15">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-4 text-sm leading-6 text-slate-300">{item.description}</p>
                    <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-gold">
                      Explore
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="roadmap" className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Business growth roadmap</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">A strategic journey from launch to global scale</h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Every step is designed to feel premium, predictable, and powerful. The roadmap extends from intelligent planning to automation-led growth across markets.
              </p>
            </div>

            <div className="relative space-y-6 rounded-[2rem] border border-white/10 bg-[#0E121A]/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-32 rounded-[2rem] bg-gradient-to-b from-[#D4AF37]/10 to-transparent" />
              <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-6">
                  {roadmap.map((item, index) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, x: 48 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="flex gap-5 rounded-3xl border border-white/5 bg-white/5 p-6"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/5 text-gold shadow-gold-glow">
                        <CircleDot className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{item.step}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="hidden lg:block">
                  <div className="relative h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#06080E]">
                    <Image
                      src="/aesthetic-journey.svg"
                      alt="Business growth roadmap illustration"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1200px) 100vw, 460px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="stories" className="border-t border-white/10 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Success stories</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Built for ambitious brands that expect premium outcomes</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {testimonials.map((item) => (
              <motion.div
                key={item.name}
                whileHover={{ y: -4 }}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/20 backdrop-blur-xl"
              >
                <p className="text-lg leading-8 text-slate-200">“{item.quote}”</p>
                <div className="mt-8">
                  <p className="text-base font-semibold text-white">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="relative px-6 pb-24 pt-12 sm:pb-28">
        <div className="absolute inset-x-0 bottom-0 top-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(212,175,55,0.14),transparent_24%)]" />
        <div className="mx-auto max-w-5xl rounded-[3rem] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Book the premium launch</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Work with a global partner built for scale, speed, and luxury.</h2>
            </div>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-gold to-amber-400 px-8 py-4 text-base font-semibold text-black shadow-gold-glow transition duration-300 hover:scale-[1.01]"
            >
              Start your enterprise experience
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

