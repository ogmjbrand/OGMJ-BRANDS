'use client'

import React, { useState } from 'react'
import { useLeads } from '@/lib/hooks'
import { TrendingUp, Plus, Sparkles, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards'

export default function LeadsPage() {
  const [businessId, setBusinessId] = useState<string>('')
  const [filterTemp, setFilterTemp] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const { leads, stats, loading, error, updateLeadStatus, updateLeadTemperature } = useLeads(businessId)

  React.useEffect(() => {
    const fetchBusinessId = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: business } = await supabase
          .from('business_users')
          .select('business_id')
          .eq('user_id', user.id)
          .limit(1)
          .single()
        if (business) setBusinessId((business as any).business_id)
      }
    }
    fetchBusinessId()
  }, [])

  const filteredLeads = leads.filter((lead) => {
    if (filterTemp && lead.temperature !== filterTemp) return false
    if (filterStatus && lead.status !== filterStatus) return false
    return true
  })

  if (!businessId) return <div className="p-6">Loading...</div>
  if (loading) return <div className="p-6">Loading leads...</div>
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#D4AF37]/10 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
            <Sparkles className="h-4 w-4" /> Revenue pipeline intelligence
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Track every opportunity with calm precision and clear momentum.</h1>
          <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Stay close to your best leads without losing sight of the bigger picture.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <MetricCard title="Total leads" value={(stats?.total_leads || 0).toString()} description="All leads currently tracked" icon={TrendingUp} accent="gold" trend="Live" />
        <MetricCard title="Active" value={(stats?.active_count || 0).toString()} description="Leads still in motion" icon={TrendingUp} accent="emerald" trend="Warm" />
        <MetricCard title="Hot" value={(stats?.hot_count || 0).toString()} description="High-intent opportunities" icon={TrendingUp} accent="slate" trend="Fast" />
        <MetricCard title="Warm" value={(stats?.warm_count || 0).toString()} description="Prospects requiring nurture" icon={TrendingUp} accent="gold" trend="Nurture" />
        <MetricCard title="Cold" value={(stats?.cold_count || 0).toString()} description="Longer-tail prospects" icon={TrendingUp} accent="slate" trend="Revisit" />
      </div>

      <SectionPanel title="Lead workspace" subtitle="Refine your pipeline by temperature and stage">
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 rounded-full border border-[#D4AF37]/10 bg-[#11151E] px-3 py-2 text-sm text-[#D4AF37]">
            <Filter className="h-4 w-4" />
            <select value={filterTemp || ''} onChange={(e) => setFilterTemp(e.target.value || null)} className="bg-transparent outline-none">
              <option className="bg-[#11151E] text-white" value="">All temperatures</option>
              <option className="bg-[#11151E] text-white" value="hot">Hot</option>
              <option className="bg-[#11151E] text-white" value="warm">Warm</option>
              <option className="bg-[#11151E] text-white" value="cold">Cold</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-full border border-[#D4AF37]/10 bg-[#11151E] px-3 py-2 text-sm text-[#D4AF37]">
            <Filter className="h-4 w-4" />
            <select value={filterStatus || ''} onChange={(e) => setFilterStatus(e.target.value || null)} className="bg-transparent outline-none">
              <option className="bg-[#11151E] text-white" value="">All statuses</option>
              <option className="bg-[#11151E] text-white" value="new">New</option>
              <option className="bg-[#11151E] text-white" value="contacted">Contacted</option>
              <option className="bg-[#11151E] text-white" value="qualified">Qualified</option>
              <option className="bg-[#11151E] text-white" value="unqualified">Unqualified</option>
              <option className="bg-[#11151E] text-white" value="converted">Converted</option>
              <option className="bg-[#11151E] text-white" value="lost">Lost</option>
            </select>
          </label>
          <button className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90">
            <Plus className="h-4 w-4" /> Add lead
          </button>
        </div>

        <div className="overflow-x-auto rounded-[1.35rem] border border-[#D4AF37]/10 bg-[#11151E]">
          <table className="w-full">
            <thead className="border-b border-[#D4AF37]/10 bg-[#07070A]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#D4AF37]">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#D4AF37]">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#D4AF37]">Company</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#D4AF37]">Score</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#D4AF37]">Temperature</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#D4AF37]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#D4AF37]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-[#D4AF37]/5 transition hover:bg-[#0E1116]/50">
                  <td className="px-6 py-4 text-white">{(lead as any).contact?.first_name} {(lead as any).contact?.last_name}</td>
                  <td className="px-6 py-4 text-[#F8F9FA]/60">{(lead as any).contact?.email}</td>
                  <td className="px-6 py-4 text-[#F8F9FA]/60">{(lead as any).contact?.company_name || '—'}</td>
                  <td className="px-6 py-4 font-semibold text-white">{lead.lead_score || 0}</td>
                  <td className="px-6 py-4">
                    <select value={lead.temperature} onChange={(e) => updateLeadTemperature(lead.id, e.target.value as any)} className={`rounded-full px-3 py-1 text-sm font-semibold text-white ${lead.temperature === 'hot' ? 'border border-red-500/40 bg-red-500/20' : lead.temperature === 'warm' ? 'border border-yellow-500/40 bg-yellow-500/20' : 'border border-cyan-500/40 bg-cyan-500/20'}`}>
                      <option value="hot">Hot</option>
                      <option value="warm">Warm</option>
                      <option value="cold">Cold</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select value={lead.status} onChange={(e) => updateLeadStatus(lead.id, e.target.value as any)} className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-sm text-white">
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="unqualified">Unqualified</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-sm font-medium text-[#D4AF37] transition hover:text-white">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLeads.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#F8F9FA]/60">No leads found matching your filters.</div>
          ) : null}
        </div>
      </SectionPanel>
    </div>
  )
}


