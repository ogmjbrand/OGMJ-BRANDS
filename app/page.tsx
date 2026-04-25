import Link from 'next/link'

const services = [
  'Brand strategy',
  'Website design',
  'Social media growth',
  'CRM automation',
  'Content systems',
  'Business launch support',
]

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-brand-bg text-white">
      <section className="relative px-6 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_35%)]" />

        <div className="mx-auto max-w-6xl">
          <div className="mb-8 inline-flex rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold-light">
            Global Business Operating System
          </div>

          <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white md:text-7xl">
            Build, automate, market, and scale your brand from one premium dashboard.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300 md:text-xl">
            OGMJ BRANDS helps startups, creators, churches, agencies, and business owners launch stronger brands with websites, CRM, automation, social media growth, and AI-powered execution tools.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/auth"
              className="rounded-full bg-gold px-8 py-4 text-center font-bold text-black shadow-lg shadow-gold/20 transition hover:bg-gold-light"
            >
              Start Building
            </Link>

            <Link
              href="/dashboard"
              className="rounded-full border border-white/15 bg-white/5 px-8 py-4 text-center font-bold text-white transition hover:border-gold/50 hover:bg-white/10"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {services.map((service) => (
            <div
              key={service}
              className="rounded-3xl border border-brand-border bg-brand-surface p-6 shadow-2xl shadow-black/20"
            >
              <div className="mb-5 h-12 w-12 rounded-2xl bg-gold/15 ring-1 ring-gold/30" />
              <h2 className="text-xl font-bold text-white">{service}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                Premium execution tools designed to help modern brands move from idea to launch faster.
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
