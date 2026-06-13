'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  CircleDot,
  ArrowUpRight,
  Globe2,
  Layers,
  Wand2,
  ExternalLink,
} from 'lucide-react'
import MarketingHeader from '@/components/marketing/MarketingHeader'
import MarketingFooter from '@/components/marketing/MarketingFooter'
import FAQSection from '@/components/marketing/FAQSection'
import ProductPreview from '@/components/marketing/ProductPreview'
import CtaSection from '@/components/landing/CtaSection'
import {
  SERVICE_PACKAGES,
  TESTIMONIALS,
  CLIENT_LOGOS,
  SITE,
} from '@/lib/marketing/content'

const marketplace = [
  { title: 'Brand Systems', description: 'Identity, naming, messaging, and launch-ready digital frameworks.', href: '/services/branding', icon: Layers },
  { title: 'Launch Ops', description: 'Registration, go-live coordination, and enterprise launch control.', href: '/services/business-launch', icon: Sparkles },
  { title: 'AI Workflows', description: 'Automation stacks for CRM, revenue, retention, and executive operations.', href: '/services/ai-automation', icon: Wand2 },
  { title: 'Growth Studio', description: 'Creative growth systems, analytics, and global scaling operations.', href: '/services/marketing', icon: Globe2 },
]

const journey = [
  { title: 'Idea', detail: 'Strategy, vision and positioning for premium founders.' },
  { title: 'Registration', detail: 'Entity setup, compliance, and launch infrastructure.' },
  { title: 'Brand', detail: 'Story, identity, and digital systems for elite names.' },
  { title: 'Website', detail: 'Conversion-led experience design for product and growth.' },
  { title: 'Automation', detail: 'AI workflows, CRM, and operational intelligence.' },
  { title: 'Growth', detail: 'Analytics, momentum, and global scaling systems.' },
]

const metrics = [
  { label: 'Revenue lift', value: '42%', description: 'Average revenue gain for clients in the first 90 days.' },
  { label: 'Launch speed', value: '3x faster', description: 'Accelerated go-to-market timelines with premium execution.' },
  { label: 'Retention', value: '96%', description: 'Enterprise-level client loyalty built on trust, strategy, and growth.' },
]

const roadmap = [
  { step: 'Discover', detail: 'Strategy, vision, positioning, global growth plan' },
  { step: 'Design', detail: 'Identity, UX systems, cinematic digital presence' },
  { step: 'Launch', detail: 'Website, app, automation, go-live operations' },
  { step: 'Scale', detail: 'Growth, AI automation, partnerships, enterprise expansion' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#04060A] text-white">
      <MarketingHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pt-20 pb-24 sm:pb-32">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_18%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_18%)] blur-3xl" />

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
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold to-amber-400 px-8 py-4 text-base font-semibold text-black shadow-gold-glow transition duration-300 hover:scale-[1.01] hover:shadow-gold-glow-lg"
                >
                  Start your premium suite
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white transition duration-300 hover:border-gold/50 hover:bg-white/10"
                >
                  View pricing — from $29/mo
                </Link>
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
                <div className="mb-7 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">OGMJ Command Center</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">Ecosystem intelligence in one luxurious hub</h2>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase text-slate-200">Live</div>
                </div>
                <div className="mt-8 rounded-[2.25rem] border border-white/10 bg-[#070B12]/95 p-4">
                  <div className="relative h-[320px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#06080E]">
                    <div className="absolute left-4 top-4 z-10 rounded-3xl border border-white/10 bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-200 backdrop-blur-sm">
                      Platform preview
                    </div>
                    <Image
                      src="/aesthetic-dashboard.svg"
                      alt="OGMJ BRANDS dashboard preview"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 520px"
                    />
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-slate-500">
                  Interface preview — <Link href="/signup" className="text-gold hover:underline">start free trial</Link> to access the full platform
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Client logos */}
        <section className="border-t border-white/10 px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-xs uppercase tracking-[0.3em] text-slate-500">Trusted by ambitious brands</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {CLIENT_LOGOS.map((logo) => (
                <span key={logo} className="text-sm font-semibold uppercase tracking-wider text-slate-500 transition hover:text-slate-300">
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Product screenshots */}
        <section id="platform" className="border-t border-white/10 px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-3xl">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Platform preview</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">See what you get inside the OS</h2>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                Real modules — dashboard, CRM, workflows, and contacts — built for founders who need everything in one place.
              </p>
            </div>
            <ProductPreview />
          </div>
        </section>

        {/* Services */}
        <section id="services" className="border-t border-white/10 px-6 py-28 sm:py-36">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 max-w-3xl">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Premium service ecosystem</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Luxury business services for every stage of growth</h2>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                Every service includes defined deliverables, timelines, and starting prices. No vague promises.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {SERVICE_PACKAGES.map((service) => {
                const Icon = service.icon
                return (
                  <Link
                    key={service.slug}
                    href={`/services/${service.slug}`}
                    className="group rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl transition hover:-translate-y-1 hover:border-gold/30"
                  >
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-gold/10 text-gold transition group-hover:bg-gold/15">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{service.title}</h3>
                    <p className="mt-4 text-sm leading-6 text-slate-300">{service.description}</p>
                    <div className="mt-6 flex items-center justify-between text-sm">
                      <span className="font-semibold text-gold">From {service.startingPrice}</span>
                      <span className="text-slate-500">{service.timeline}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-gold opacity-0 transition group-hover:opacity-100">
                      View deliverables <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Marketplace */}
        <section id="marketplace" className="border-t border-white/10 px-6 py-28 sm:py-36">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="space-y-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Service marketplace</p>
                <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">A premium marketplace for every business operating need</h2>
                <p className="max-w-xl text-lg leading-8 text-slate-300">
                  Discover curated offerings across branding, automation, launch operations, and growth systems.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {marketplace.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="group rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl transition hover:-translate-y-1 hover:border-gold/30"
                    >
                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-gold">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                      <p className="mt-4 text-sm leading-6 text-slate-300">{item.description}</p>
                      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-gold">
                        Explore <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <CtaSection />

        {/* Roadmap */}
        <section id="roadmap" className="px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Business growth roadmap</p>
                <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">A strategic journey from launch to global scale</h2>
                <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                  Every step is designed to feel premium, predictable, and powerful.
                </p>
              </div>
              <div className="space-y-6 rounded-[2rem] border border-white/10 bg-[#0E121A]/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
                {roadmap.map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: 48 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
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
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="stories" className="border-t border-white/10 px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 max-w-3xl">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Success stories</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Built for ambitious brands that expect premium outcomes</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {TESTIMONIALS.map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ y: -4 }}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl"
                >
                  <p className="text-base leading-7 text-slate-200">&ldquo;{item.quote}&rdquo;</p>
                  <p className="mt-4 text-sm font-semibold text-gold">{item.metric}</p>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-amber-600/10 text-sm font-bold text-gold">
                      {item.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-sm text-slate-400">{item.role}, {item.company}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-4 text-sm">
                    <a href={item.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-400 transition hover:text-gold">
                      LinkedIn <ExternalLink className="h-3 w-3" />
                    </a>
                    <Link href={item.caseStudy} className="text-slate-400 transition hover:text-gold">
                      Read case study →
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FAQSection limit={4} showViewAll />

        {/* Contact */}
        <section id="contact" className="relative border-t border-white/10 px-6 py-28 sm:py-32">
          <div className="absolute inset-x-0 bottom-0 top-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(212,175,55,0.14),transparent_24%)]" />
          <div className="mx-auto max-w-5xl rounded-[3rem] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Get in touch</p>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Talk to us before you commit
                </h2>
                <div className="mt-6 space-y-3 text-sm text-slate-300">
                  <p><span className="text-slate-500">Email:</span> <a href={`mailto:${SITE.email}`} className="text-gold hover:underline">{SITE.email}</a></p>
                  <p><span className="text-slate-500">Phone:</span> <a href={`tel:${SITE.phoneTel}`} className="text-gold hover:underline">{SITE.phone}</a></p>
                  <p><span className="text-slate-500">Office:</span> {SITE.address}, {SITE.city}</p>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-gold to-amber-400 px-8 py-4 text-base font-semibold text-black shadow-gold-glow transition hover:scale-[1.01]"
                >
                  Send a Message
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:border-gold/50"
                >
                  Start 14-Day Free Trial
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}
