import { FAQ_ITEMS } from '@/lib/marketing/content'

interface FAQSectionProps {
  title?: string
  subtitle?: string
  limit?: number
  showViewAll?: boolean
}

export default function FAQSection({
  title = 'Frequently asked questions',
  subtitle = 'Everything you need to know before getting started.',
  limit,
  showViewAll = false,
}: FAQSectionProps) {
  const items = limit ? FAQ_ITEMS.slice(0, limit) : FAQ_ITEMS

  return (
    <section className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">FAQ</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h2>
          <p className="mt-4 text-lg text-slate-300">{subtitle}</p>
        </div>

        <div className="space-y-3">
          {items.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition hover:border-gold/30"
            >
              <summary className="cursor-pointer list-none font-semibold text-white [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {faq.q}
                  <span className="shrink-0 text-gold transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-4 text-sm leading-7 text-slate-300">{faq.a}</p>
            </details>
          ))}
        </div>

        {showViewAll && (
          <div className="mt-8 text-center">
            <a
              href="/faq"
              className="text-sm font-semibold text-gold transition hover:text-amber-300"
            >
              View all questions →
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
