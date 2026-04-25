import Link from 'next/link'

const stats = [
  { label: 'Active businesses', value: '1', note: 'Your main OGMJ workspace' },
  { label: 'Leads captured', value: '0', note: 'Connect forms and funnels' },
  { label: 'Automations', value: '0', note: 'Email, WhatsApp, and CRM flows' },
  { label: 'Campaigns', value: '0', note: 'Social growth and ads' },
]

const modules = [
  {
    title: 'Business Manager',
    description: 'Manage business profile, team, leads, customers, tasks, and activity timeline.',
  },
  {
    title: 'Website & Funnel Builder',
    description: 'Create landing pages, business websites, sales funnels, and creator portfolios.',
  },
  {
    title: 'Social Media Growth',
    description: 'Plan content, generate captions, manage campaigns, and track audience growth.',
  },
  {
    title: 'AI Content Studio',
    description: 'Generate brand copy, ad copy, hooks, captions, blog content, and launch assets.',
  },
  {
    title: 'Automation & CRM',
    description: 'Build WhatsApp, email, lead follow-up, customer segmentation, and pipeline automations.',
  },
  {
    title: 'Analytics',
    description: 'Track leads, revenue, campaign performance, conversion rate, and business growth.',
  },
]

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-brand-bg text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-10 flex flex-col gap-6 rounded-3xl border border-brand-border bg-brand-surface p-6 shadow-2xl shadow-black/20 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">
              OGMJ BRANDS
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              Business Operating Dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-gray-400">
              Start, manage, automate, market, and scale your brand from one luxury command center.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-full border border-gold/40 bg-gold/10 px-6 py-3 text-center font-bold text-gold-light transition hover:bg-gold hover:text-black"
          >
            Back to Home
          </Link>
        </header>

        <section className="grid gap-5 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-brand-border bg-brand-surface2 p-5"
            >
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="mt-3 text-4xl font-black text-gold">{stat.value}</p>
              <p className="mt-2 text-xs leading-5 text-gray-500">{stat.note}</p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Core OGMJ Modules</h2>
              <p className="mt-2 text-gray-400">
                These are the systems we will build carefully one after another.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <div
                key={module.title}
                className="rounded-3xl border border-brand-border bg-brand-surface p-6 transition hover:border-gold/40 hover:bg-brand-surface2"
              >
                <div className="mb-5 h-12 w-12 rounded-2xl bg-gold/15 ring-1 ring-gold/30" />
                <h3 className="text-xl font-bold">{module.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-400">
                  {module.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/15 to-emerald-500/10 p-6">
          <h2 className="text-2xl font-black">Next build phase</h2>
          <p className="mt-3 max-w-3xl text-gray-300">
            The safe next step is to add authentication, onboarding, business creation, and Supabase tables before connecting the deeper CRM, automation, social media, and analytics modules.
          </p>
        </section>
      </div>
    </main>
  )
                  }
