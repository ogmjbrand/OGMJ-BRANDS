'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { SITE } from '@/lib/marketing/content'

const NAV_LINKS = [
  { label: 'Services', href: '/#services' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
]

export default function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#04060A]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/ogmj-mark.png"
            alt={SITE.name}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-2xl object-cover"
            priority
          />
          <span className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{SITE.name}</p>
            <p className="text-lg font-black text-white">{SITE.tagline}</p>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-slate-300 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-slate-300 transition hover:text-white sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-black shadow-gold-glow transition duration-300 hover:shadow-gold-glow-lg"
          >
            Get Started
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg border border-white/10 p-2 text-white lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-white/10 px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-4 text-sm text-slate-300">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setMobileOpen(false)} className="transition hover:text-white">
              Sign in
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}

