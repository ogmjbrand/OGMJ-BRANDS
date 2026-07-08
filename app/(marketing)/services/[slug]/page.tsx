import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Clock, DollarSign } from 'lucide-react'
import { SERVICE_PACKAGES, getServiceBySlug } from '@/lib/marketing/content'

export function generateStaticParams() {
  return SERVICE_PACKAGES.map((s) => ({ slug: s.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const service = getServiceBySlug(params.slug)
  if (!service) return { title: 'Service Not Found' }
  return {
    title: `${service.title} — OGMJ BRANDS`,
    description: service.description,
  }
}

export default function ServicePage({ params }: { params: { slug: string } }) {
  const service = getServiceBySlug(params.slug)
  if (!service) notFound()

  const Icon = service.icon

  return (
    <div className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <Link href="/#services" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          All services
        </Link>

        <div className="mt-8 flex items-start gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gold/10 text-gold">
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{service.title}</h1>
            <p className="mt-4 text-lg text-slate-300">{service.description}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
            <DollarSign className="h-5 w-5 text-gold" />
            <div>
              <p className="text-xs text-slate-400">Starting from</p>
              <p className="font-semibold text-white">{service.startingPrice}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
            <Clock className="h-5 w-5 text-gold" />
            <div>
              <p className="text-xs text-slate-400">Timeline</p>
              <p className="font-semibold text-white">{service.timeline}</p>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white">What&apos;s included</h2>
          <ul className="mt-6 space-y-4">
            {service.deliverables.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-4">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <span className="text-slate-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-bold text-white">Get a custom quote</h2>
          <p className="mt-2 text-slate-300">
            Every project is scoped to your needs. Tell us about your goals and we&apos;ll send a tailored proposal within 48 hours.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
            >
              Request a Quote
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-3 text-sm font-semibold text-white transition hover:border-gold/50"
            >
              View Platform Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
