import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { TEAM, SITE } from '@/lib/marketing/content'

export const metadata: Metadata = {
  title: 'About — OGMJ BRANDS',
  description: 'Meet the team behind OGMJ BRANDS — the premium global business operating system.',
}

export default function AboutPage() {
  return (
    <div className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-20 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">About us</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Built by founders, for founders who expect more
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            OGMJ BRANDS was founded on a simple belief: ambitious entrepreneurs shouldn&apos;t have to juggle five agencies,
            three SaaS tools, and a spreadsheet to launch and scale a premium business. We built the operating system we
            wished existed — one platform that unifies registration, branding, website, CRM, automation, and growth.
          </p>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Today, we serve founders across the Americas, Europe, and Africa — helping them move from idea to global
            operator with speed, confidence, and measurable outcomes.
          </p>
        </div>

        <div className="mb-20 grid gap-6 sm:grid-cols-3">
          {[
            { value: '200+', label: 'Businesses launched' },
            { value: '15+', label: 'Countries served' },
            { value: '96%', label: 'Client retention' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
              <p className="text-4xl font-black text-gold">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-12">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Leadership</p>
          <h2 className="mt-4 text-3xl font-black text-white">The team behind the platform</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition hover:border-gold/30"
            >
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-amber-600/10 text-xl font-bold text-gold">
                  {member.initials}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                  <p className="text-sm text-gold">{member.role}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{member.bio}</p>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm text-slate-400 transition hover:text-gold"
                  >
                    LinkedIn →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 rounded-[2rem] border border-white/10 bg-white/5 p-10 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Ready to work with us?</h2>
              <p className="mt-2 text-slate-300">
                Reach out at {SITE.email} or book a call with our team.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
            >
              Get in Touch
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


