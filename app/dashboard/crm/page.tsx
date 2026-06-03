'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Briefcase, Plus, Search } from 'lucide-react'
import { useBusinessContext } from '@/lib/context/BusinessContext'
import { listContacts, listDeals } from '@/lib/services/crm'

export default function CrmPage() {
  const { currentBusiness } = useBusinessContext()
  const [contactCount, setContactCount] = useState(0)
  const [dealCount, setDealCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadOverview() {
      if (!currentBusiness) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const [contactsResult, dealsResult] = await Promise.all([
          listContacts(currentBusiness.id, { page: 1, pageSize: 1 }),
          listDeals(currentBusiness.id, { page: 1, pageSize: 1 }),
        ])

        setContactCount(contactsResult.success && contactsResult.data ? contactsResult.data.total || 0 : 0)
        setDealCount(dealsResult.success && dealsResult.data ? dealsResult.data.total || 0 : 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load CRM overview')
      } finally {
        setLoading(false)
      }
    }

    loadOverview()
  }, [currentBusiness])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">CRM</h1>
          <p className="text-[#D4AF37]/70 mt-2">Manage your contacts and sales pipeline.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/crm/contacts"
            className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#07070A] hover:bg-[#D4AF37]/90 transition"
          >
            <Plus className="w-4 h-4" /> New Contact
          </Link>
          <Link
            href="/dashboard/crm/deals"
            className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#0E1116] px-5 py-3 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 transition"
          >
            <Plus className="w-4 h-4" /> New Deal
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <OverviewCard
          title="Contacts"
          description="Your active CRM contacts"
          value={loading ? '—' : contactCount.toString()}
          icon={<Users className="w-5 h-5 text-[#D4AF37]" />}
          href="/dashboard/crm/contacts"
        />
        <OverviewCard
          title="Deals"
          description="Opportunities in the pipeline"
          value={loading ? '—' : dealCount.toString()}
          icon={<Briefcase className="w-5 h-5 text-[#D4AF37]" />}
          href="/dashboard/crm/deals"
        />
        <Card className="bg-[#0E1116] border-[#D4AF37]/10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[#D4AF37]/70">CRM search</p>
              <p className="text-white text-lg font-semibold">Find contacts, leads, and deals</p>
            </div>
            <Search className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/crm/contacts" className="rounded-2xl border border-[#D4AF37]/10 bg-[#11151E] px-4 py-3 text-sm text-[#D4AF37] hover:border-[#D4AF37]/30 transition">
              Search Contacts
            </Link>
            <Link href="/dashboard/crm/deals" className="rounded-2xl border border-[#D4AF37]/10 bg-[#11151E] px-4 py-3 text-sm text-[#D4AF37] hover:border-[#D4AF37]/30 transition">
              Search Deals
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

function OverviewCard({
  title,
  description,
  value,
  icon,
  href,
}: {
  title: string
  description: string
  value: string
  icon: React.ReactNode
  href: string
}) {
  return (
    <Link href={href} className="group">
      <div className="rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6 transition hover:border-[#D4AF37]/30">
        <div className="flex items-center justify-between gap-3">
          <div>{icon}</div>
          <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            View
          </span>
        </div>
        <div className="mt-8">
          <p className="text-sm text-[#D4AF37]/70">{description}</p>
          <p className="mt-3 text-3xl font-bold text-white">{value}</p>
          <p className="mt-4 text-sm text-[#D4AF37]/50">Manage your CRM details and pipeline.</p>
        </div>
      </div>
    </Link>
  )
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6 ${className || ''}`}>{children}</div>
}
