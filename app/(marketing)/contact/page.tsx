'use client'

import { useState } from 'react'
import { Mail, MapPin, Phone, MessageCircle, Clock } from 'lucide-react'
import { SITE } from '@/lib/marketing/content'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send message')
      setStatus('success')
      setForm({ name: '', email: '', company: '', message: '' })
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Contact</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Let&apos;s talk about your next move
          </h1>
          <p className="mt-6 text-lg text-slate-300">
            Whether you need a platform demo, a custom service quote, or enterprise onboarding — our team responds within one business day.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            {[
              { icon: Mail, label: 'Email', value: SITE.email, href: `mailto:${SITE.email}` },
              { icon: Phone, label: 'Phone', value: SITE.phone, href: `tel:${SITE.phoneTel}` },
              { icon: MapPin, label: 'Office', value: `${SITE.address}, ${SITE.city}`, href: undefined },
              { icon: Clock, label: 'Hours', value: SITE.hours, href: undefined },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="mt-1 block font-medium text-white transition hover:text-gold">
                        {item.value}
                      </a>
                    ) : (
                      <p className="mt-1 font-medium text-white">{item.value}</p>
                    )}
                  </div>
                </div>
              )
            })}

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-emerald-400" />
                <p className="font-semibold text-white">Live chat</p>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Available Mon–Fri, 9am–6pm EST. Click the chat widget in the bottom-right corner when online.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Send us a message</h2>

            {status === 'success' && (
              <p className="mt-4 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-400">
                Thank you! We&apos;ll get back to you within one business day.
              </p>
            )}
            {status === 'error' && (
              <p className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-400">{errorMsg}</p>
            )}

            <div className="mt-6 space-y-4">
              {[
                { id: 'name', label: 'Full name', type: 'text', required: true },
                { id: 'email', label: 'Email', type: 'email', required: true },
                { id: 'company', label: 'Company', type: 'text', required: false },
              ].map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block text-sm text-slate-400">
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    type={field.type}
                    required={field.required}
                    value={form[field.id as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B1119] px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-gold/50"
                  />
                </div>
              ))}
              <div>
                <label htmlFor="message" className="block text-sm text-slate-400">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B1119] px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-gold/50"
                  placeholder="Tell us about your business and what you're looking for..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="mt-6 w-full rounded-full bg-gold py-3 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
            >
              {status === 'loading' ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
