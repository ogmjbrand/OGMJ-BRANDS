import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { SITE } from '@/lib/marketing/content'

const FOOTER_LINKS = {
  Platform: [
    { label: 'Pricing', href: '/pricing' },
    { label: 'Services', href: '/#services' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Blog', href: '/blog' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Case Studies', href: '/blog' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
}

export default function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#030508] px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{SITE.name}</p>
            <p className="mt-2 text-lg font-bold text-white">{SITE.tagline}</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              Premium business operations, AI automation, and world-class launches in one unified ecosystem.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 transition hover:text-gold">
                <Mail className="h-4 w-4 text-gold" />
                {SITE.email}
              </a>
              <a href={`tel:${SITE.phoneTel}`} className="flex items-center gap-2 transition hover:text-gold">
                <Phone className="h-4 w-4 text-gold" />
                {SITE.phone}
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>
                  {SITE.address}
                  <br />
                  {SITE.city}
                </span>
              </div>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <p className="text-sm font-semibold uppercase tracking-wider text-white">{title}</p>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-slate-400 transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-slate-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
              LinkedIn
            </a>
            <a href={SITE.twitter} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

