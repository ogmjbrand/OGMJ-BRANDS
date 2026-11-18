'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { ENQUIRY_BUDGET_OPTIONS, ENQUIRY_SERVICE_OPTIONS } from '@/lib/marketing/agency'

type FormState = {
  name: string
  email: string
  company: string
  website: string
  country: string
  service: string
  budget: string
  message: string
  website_url_confirm: string
}

const INITIAL: FormState = {
  name: '',
  email: '',
  company: '',
  website: '',
  country: '',
  service: 'growth-audit',
  budget: 'not-sure',
  message: '',
  website_url_confirm: '',
}

const fieldClass =
  'mt-2 w-full rounded-2xl border border-white/10 bg-obsidian-soft px-4 py-3 text-sm text-content placeholder:text-content-muted/50 outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20'
const labelClass = 'block text-xs font-bold uppercase tracking-[0.15em] text-content-muted'

export default function AgencyEnquiryForm({ email, whatsappHref }: { email: string; whatsappHref: string }) {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const update = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage('')
    try {
      const response = await fetch('/api/agency-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setStatus('success')
      setForm(INITIAL)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-[2rem] border border-emerald/30 bg-emerald/5 p-8">
        <CheckCircle2 className="size-8 text-emerald" />
        <h3 className="font-(family-name:--font-syne) text-2xl font-bold text-content">Thank you, we&apos;ve got your enquiry.</h3>
        <p className="text-sm leading-7 text-content-muted">
          We&apos;ll reply by email within one business day to arrange your free Growth Audit.
        </p>
        <button type="button" onClick={() => setStatus('idle')} className="text-sm font-bold text-gold hover:underline">
          Send another enquiry
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="enq-name" className={labelClass}>Full name *</label>
          <input id="enq-name" name="name" required minLength={2} maxLength={120} autoComplete="name" value={form.name} onChange={update('name')} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="enq-email" className={labelClass}>Business email *</label>
          <input id="enq-email" name="email" type="email" required maxLength={200} autoComplete="email" value={form.email} onChange={update('email')} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="enq-company" className={labelClass}>Company</label>
          <input id="enq-company" name="company" maxLength={160} autoComplete="organization" value={form.company} onChange={update('company')} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="enq-website" className={labelClass}>Website or social link</label>
          <input id="enq-website" name="website" maxLength={300} placeholder="yourbrand.com" value={form.website} onChange={update('website')} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="enq-service" className={labelClass}>What do you need? *</label>
          <select id="enq-service" name="service" required value={form.service} onChange={update('service')} className={fieldClass}>
            {ENQUIRY_SERVICE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="enq-budget" className={labelClass}>Estimated budget</label>
          <select id="enq-budget" name="budget" value={form.budget} onChange={update('budget')} className={fieldClass}>
            {ENQUIRY_BUDGET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="enq-country" className={labelClass}>Country</label>
          <input id="enq-country" name="country" maxLength={80} autoComplete="country-name" value={form.country} onChange={update('country')} className={fieldClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="enq-message" className={labelClass}>Tell us about your business and goals *</label>
          <textarea id="enq-message" name="message" required minLength={10} maxLength={4000} rows={5} value={form.message} onChange={update('message')} className={fieldClass} placeholder="What you sell, who your customers are, and what you'd like to improve." />
        </div>
        {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="enq-confirm">Leave this field empty</label>
          <input id="enq-confirm" name="website_url_confirm" tabIndex={-1} autoComplete="off" value={form.website_url_confirm} onChange={update('website_url_confirm')} />
        </div>
      </div>

      {status === 'error' && (
        <div role="alert" className="mt-6 rounded-2xl border border-heritage/40 bg-heritage/10 p-4 text-sm text-content">
          <p>{errorMessage}</p>
          <p className="mt-2 text-content-muted">
            You can also reach us at{' '}
            <a href={`mailto:${email}`} className="font-bold text-gold hover:underline">{email}</a>
            {' '}or on{' '}
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald hover:underline">WhatsApp</a>.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold font-(family-name:--font-syne) text-sm font-bold text-black transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'loading' ? (<><Loader2 className="size-4 animate-spin" /> Sending…</>) : 'Book My Free Growth Audit'}
      </button>
      <p className="mt-4 text-center text-xs text-content-muted/80">
        We only use your details to reply to this enquiry. See our <a href="/privacy" className="underline hover:text-content">privacy policy</a>.
      </p>
    </form>
  )
}
