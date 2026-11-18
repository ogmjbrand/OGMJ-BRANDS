'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Menu, X } from 'lucide-react'

const LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Process', href: '#process' },
  { label: 'Work', href: '#work' },
  { label: 'Contact', href: '#enquiry' },
]

export default function AgencyNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        aria-label="Agency navigation"
        className="flex h-14 w-full max-w-[1400px] items-center justify-between rounded-full border border-white/10 bg-obsidian/75 px-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:px-6"
      >
        <Link href="/agency" className="flex items-center gap-2">
          <Image src="/brand/ogmj-mark.png" alt="OGMJ BRANDS" width={20} height={20} className="size-5 rounded-full object-cover" priority />
          <span className="font-(family-name:--font-syne) text-base font-bold text-content">OGMJ BRANDS</span>
          <span className="hidden rounded-full border border-gold/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gold sm:inline">
            Agency
          </span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="text-xs font-bold uppercase tracking-wide text-content-muted transition-colors hover:text-gold">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-content-muted transition-colors hover:text-emerald"
          >
            Explore Business OS <ArrowUpRight className="size-3.5" />
          </Link>
          <a
            href="#enquiry"
            className="inline-flex h-10 items-center rounded-full bg-gold px-5 font-(family-name:--font-syne) text-sm font-bold text-black transition-colors hover:bg-gold-400"
          >
            Free Growth Audit
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="flex size-9 items-center justify-center text-content lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="fixed inset-x-4 top-20 z-40 rounded-3xl border border-white/10 bg-obsidian/95 p-6 backdrop-blur-2xl lg:hidden">
          <ul className="flex flex-col gap-4">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setOpen(false)} className="font-(family-name:--font-syne) text-2xl font-bold text-content">
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <Link href="/" onClick={() => setOpen(false)} className="text-sm font-bold uppercase tracking-wide text-emerald">
                Explore OGMJ Business OS →
              </Link>
            </li>
            <li>
              <a
                href="#enquiry"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-center rounded-full bg-gold px-6 font-(family-name:--font-syne) text-sm font-bold text-black"
              >
                Book Your Free Growth Audit
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
