'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Briefcase, Plus, Search, Sparkles, ArrowUpRight } from 'lucide-react'
import { useBusinessContext } from '@/lib/context/BusinessContext'
import { listContacts, listDeals } from '@/lib/services/crm'
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards'

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
      <div className="rounded-[2rem] border border-[#D4AF37]/10 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
              <Sparkles className="h-4 w-4" /> Relationship command center
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Manage your prospects, pipeline and momentum from one premium CRM surface.</h1>
            <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Keep contacts, opportunities and next steps tightly connected so every conversation turns into action.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/crm/contacts" className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90">
              <Plus className="h-4 w-4" /> New contact
            </Link>
            <Link href="/dashboard/crm/deals" className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#0E1116]/80 px-5 py-3 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10">
              <Plus className="h-4 w-4" /> New deal
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-[1.3rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="Contacts" value={loading ? '—' : contactCount.toString()} description="Active relationships in your CRM" icon={Users} accent="gold" trend="Live" />
        <MetricCard title="Deals" value={loading ? '—' : dealCount.toString()} description="Open opportunities in motion" icon={Briefcase} accent="emerald" trend="Healthy" />
        <MetricCard title="Search & action" value="Fast" description="Jump into contacts or deals instantly" icon={Search} accent="slate" trend="Ready" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionPanel title="CRM workspaces" subtitle="Move from relationship capture to opportunity management without friction">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/crm/contacts" className="rounded-[1.35rem] border border-[#D4AF37]/10 bg-[#11151E] p-4 transition hover:border-[#D4AF37]/40">
              <p className="text-sm font-semibold text-white">Contact hub</p>
              <p className="mt-2 text-sm text-[#F8F9FA]/60">Review, search and organize the people that matter most.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#D4AF37]">
                Open contacts <ArrowUpRight className="h-4 w-4" />
              </div>
            </Link>
            <Link href="/dashboard/crm/deals" className="rounded-[1.35rem] border border-[#D4AF37]/10 bg-[#11151E] p-4 transition hover:border-[#D4AF37]/40">
              <p className="text-sm font-semibold text-white">Pipeline board</p>
              <p className="mt-2 text-sm text-[#F8F9FA]/60">Keep every deal visible, prioritized and moving forward.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#D4AF37]">
                Open deals <ArrowUpRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </SectionPanel>

        <SectionPanel title="Next best step" subtitle="What to do right now to keep momentum high">
          <div className="space-y-3">
            <div className="rounded-[1.2rem] border border-[#D4AF37]/10 bg-[#11151E] p-4">
              <p className="text-sm font-semibold text-white">Follow up on warm leads</p>
              <p className="mt-1 text-sm text-[#F8F9FA]/60">Re-engage active prospects before the next launch window opens.</p>
            </div>
            <div className="rounded-[1.2rem] border border-[#D4AF37]/10 bg-[#11151E] p-4">
              <p className="text-sm font-semibold text-white">Move one deal to proposal</p>
              <p className="mt-1 text-sm text-[#F8F9FA]/60">Turn momentum into a decision with a single clear next action.</p>
            </div>
          </div>
        </SectionPanel>
      </div>
    </div>
  )
}
