import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy — OGMJ BRANDS',
  description: 'How OGMJ BRANDS uses cookies and similar technologies.',
}

export default function CookiesPage() {
  return (
    <div className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black text-white">Cookie Policy</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: June 1, 2026</p>

        <div className="mt-12 space-y-8 text-slate-300 leading-7">
          <section>
            <h2 className="text-xl font-semibold text-white">What Are Cookies</h2>
            <p className="mt-3">Cookies are small text files stored on your device when you visit our website. They help us provide a better experience and understand how our platform is used.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Cookies We Use</h2>
            <div className="mt-4 space-y-4">
              {[
                { name: 'Essential', desc: 'Required for authentication, session management, and security. Cannot be disabled.' },
                { name: 'Analytics', desc: 'Help us understand usage patterns and improve the platform. Data is anonymized.' },
                { name: 'Preference', desc: 'Remember your settings such as theme and language preferences.' },
              ].map((cookie) => (
                <div key={cookie.name} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">{cookie.name}</p>
                  <p className="mt-1 text-sm">{cookie.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Managing Cookies</h2>
            <p className="mt-3">You can control cookies through your browser settings. Disabling essential cookies may prevent you from using certain features of the platform.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
