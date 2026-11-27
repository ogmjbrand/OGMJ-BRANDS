import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { DM_Sans, Syne } from 'next/font/google'
import { ArrowRight, ArrowUpRight, Check, Mail, MessageCircle } from 'lucide-react'
import AgencyNav from '@/components/agency/AgencyNav'
import AgencyEnquiryForm from '@/components/agency/AgencyEnquiryForm'
import { SITE } from '@/lib/marketing/content'
import { AGENCY, AGENCY_PROCESS, AGENCY_SERVICES, getPublishedPortfolio } from '@/lib/marketing/agency'

// Same font setup as the platform homepage (app/page.tsx) for visual consistency.
const syne = Syne({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-syne' })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-dm-sans' })

export const metadata: Metadata = {
  title: 'Hire OGMJ BRANDS — Brand Development, Websites & Digital Marketing Agency',
  description:
    'OGMJ BRANDS is an international brand development, creative, digital marketing and business growth agency. Book your free 20-minute Growth Audit.',
  alternates: { canonical: '/agency' },
  openGraph: {
    title: 'Hire OGMJ BRANDS — Brand & Growth Agency',
    description: "We don't just make you look good. We bring you clients. Book your free Growth Audit.",
    type: 'website',
    url: '/agency',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'OGMJ BRANDS Agency' }],
  },
}

const whatsappHref = `https://wa.me/${SITE.whatsapp.replace(/[^\d]/g, '')}`

export default function AgencyPage() {
  const portfolio = getPublishedPortfolio()

  return (
    <div className={`${syne.variable} ${dmSans.variable} relative min-h-screen bg-obsidian font-(family-name:--font-dm-sans) text-content`}>
      <AgencyNav />

      <main>
        {/* Hero + company introduction */}
        <section className="relative overflow-hidden px-4 pb-20 pt-36 md:px-10 lg:pb-28 lg:pt-44">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <Image src="/site/branding.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-[0.16]" />
            <div className="absolute inset-0 bg-linear-to-r from-obsidian via-obsidian/90 to-obsidian/50" />
            <div className="absolute inset-0 bg-linear-to-t from-obsidian via-transparent to-obsidian/70" />
            <div className="absolute -left-40 top-10 size-[520px] rounded-full bg-gold/10 blur-[140px]" />
            <div className="absolute -bottom-40 right-0 size-[420px] rounded-full bg-emerald/10 blur-[140px]" />
          </div>

          <div className="relative mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold">
                {AGENCY.eyebrow}
              </p>
              <h1 className="mt-6 font-(family-name:--font-syne) text-5xl font-bold leading-[1.04] sm:text-6xl lg:text-7xl">
                <span className="block">{AGENCY.headline}</span>
                <span className="block text-gold">{AGENCY.accent}</span>
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-content-muted">{AGENCY.intro}</p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href="#enquiry"
                  className="group inline-flex h-12 items-center gap-3 rounded-full bg-gold py-1 pl-6 pr-1.5 font-(family-name:--font-syne) text-sm font-bold text-black transition-colors hover:bg-gold-400"
                >
                  {AGENCY.auditCtaLabel}
                  <span className="flex size-9 items-center justify-center rounded-full bg-obsidian/15 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="size-4" />
                  </span>
                </a>
                <a
                  href="#services"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-7 font-(family-name:--font-syne) text-sm font-bold text-content transition-colors hover:border-gold/50 hover:text-gold"
                >
                  See our services
                </a>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl lg:col-span-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald">Our promise</p>
              <p className="mt-4 font-(family-name:--font-syne) text-2xl font-bold leading-snug">&ldquo;{AGENCY.promise}&rdquo;</p>
              <p className="mt-4 text-sm leading-7 text-content-muted">
                One partner for brand, website, content, marketing and automation, so nothing gets lost between agencies.
              </p>
            </aside>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="scroll-mt-24 border-t border-white/5 px-4 py-24 md:px-10 lg:py-32">
          <div className="mx-auto max-w-[1400px]">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Services</p>
              <h2 className="mt-4 font-(family-name:--font-syne) text-4xl font-bold leading-tight sm:text-5xl">
                Everything your brand needs to grow, under one roof.
              </h2>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-6">
              {AGENCY_SERVICES.map((service, index) => {
                const Icon = service.icon
                const span = index < 2 ? 'lg:col-span-3' : 'lg:col-span-2'
                return (
                  <article
                    key={service.id}
                    id={service.id}
                    className={`group flex flex-col rounded-[2rem] border border-white/10 bg-obsidian-soft p-7 transition-colors hover:border-gold/30 ${span}`}
                  >
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                      <Icon className="size-5" strokeWidth={1.75} />
                    </div>
                    <h3 className="mt-6 font-(family-name:--font-syne) text-xl font-bold">{service.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-content-muted">{service.summary}</p>
                    <ul className="mt-6 space-y-2.5">
                      {service.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-content">
                          <Check className="mt-0.5 size-4 shrink-0 text-emerald" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* Portfolio */}
        <section id="work" className="scroll-mt-24 border-t border-white/5 bg-obsidian-soft/40 px-4 py-24 md:px-10 lg:py-32">
          <div className="mx-auto max-w-[1400px]">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Selected work</p>
              <h2 className="mt-4 font-(family-name:--font-syne) text-4xl font-bold leading-tight sm:text-5xl">Portfolio & case studies</h2>
            </div>

            {portfolio.length > 0 ? (
              <div className="mt-14 grid gap-5 md:grid-cols-2">
                {portfolio.map((item) => (
                  <article key={item.name} className="rounded-[2rem] border border-white/10 bg-obsidian p-7">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald">{item.category}</p>
                    <h3 className="mt-3 font-(family-name:--font-syne) text-2xl font-bold">{item.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-content-muted">{item.workDelivered}</p>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-gold hover:underline">
                        View project <ArrowUpRight className="size-4" />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-14 flex flex-col items-start gap-5 rounded-[2rem] border border-dashed border-white/15 p-8 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-sm leading-7 text-content-muted">
                  We&apos;re preparing detailed case studies with our clients&apos; permission. Ask to see relevant examples of our work during your free Growth Audit.
                </p>
                <a href="#enquiry" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-gold hover:underline">
                  Request our portfolio <ArrowRight className="size-4" />
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Process */}
        <section id="process" className="scroll-mt-24 border-t border-white/5 px-4 py-24 md:px-10 lg:py-32">
          <div className="mx-auto max-w-[1400px]">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">How we work</p>
              <h2 className="mt-4 font-(family-name:--font-syne) text-4xl font-bold leading-tight sm:text-5xl">A clear process, from first call to growth.</h2>
            </div>
            <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {AGENCY_PROCESS.map((item) => (
                <li key={item.step} className="rounded-[2rem] border border-white/10 bg-obsidian-soft p-7">
                  <span className="font-(family-name:--font-syne) text-4xl font-bold text-gold/80">{item.step}</span>
                  <h3 className="mt-5 font-(family-name:--font-syne) text-lg font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-content-muted">{item.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Growth Audit + enquiry form */}
        <section id="enquiry" className="scroll-mt-24 border-t border-white/5 px-4 py-24 md:px-10 lg:py-32">
          <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Free Growth Audit</p>
              <h2 className="mt-4 font-(family-name:--font-syne) text-4xl font-bold leading-tight sm:text-5xl">{AGENCY.auditCtaLabel}</h2>
              <p className="mt-6 text-base leading-8 text-content-muted">{AGENCY.auditDescription}</p>
              <ul className="mt-8 space-y-3">
                {['Brand and positioning review', 'Website and conversion check', 'Social media and visibility review', 'Your top 3 growth opportunities'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className="size-4 text-emerald" /> {item}
                  </li>
                ))}
              </ul>
              <div className="mt-10 space-y-3 text-sm">
                <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 text-content-muted transition-colors hover:text-gold">
                  <Mail className="size-4" /> {SITE.email}
                </a>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-content-muted transition-colors hover:text-emerald">
                  <MessageCircle className="size-4" /> WhatsApp {SITE.whatsapp}
                </a>
              </div>
            </div>
            <div className="lg:col-span-7">
              <AgencyEnquiryForm email={SITE.email} whatsappHref={whatsappHref} />
            </div>
          </div>
        </section>

        {/* Pathway back to the platform */}
        <section className="border-t border-white/5 px-4 py-20 md:px-10">
          <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-6 rounded-[2rem] border border-emerald/20 bg-emerald/5 p-8 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald">Prefer to do it yourself?</p>
              <p className="mt-2 font-(family-name:--font-syne) text-2xl font-bold">Explore the OGMJ Business OS</p>
              <p className="mt-2 text-sm text-content-muted">CRM, website builder, automation and AI tools to run and grow your business.</p>
            </div>
            <Link
              href="/"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full border border-emerald/40 px-6 font-(family-name:--font-syne) text-sm font-bold text-emerald transition-colors hover:bg-emerald/10"
            >
              Explore OGMJ Business OS <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 px-4 py-12 md:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 text-xs text-content-muted/70 sm:flex-row sm:justify-between">
          <p>Copyright {new Date().getFullYear()} OGMJ Brands. All rights reserved.</p>
          <nav aria-label="Agency footer" className="flex gap-6">
            <Link href="/" className="hover:text-content">Business OS</Link>
            <Link href="/about" className="hover:text-content">About</Link>
            <Link href="/privacy" className="hover:text-content">Privacy</Link>
            <Link href="/terms" className="hover:text-content">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
