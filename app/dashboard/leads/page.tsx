'use client'

import React, { useState } from 'react'
import { useLeads } from '@/lib/hooks'
import { TrendingUp, Filter, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LeadsPage() {
  const [businessId, setBusinessId] = useState<string>('')
  const [filterTemp, setFilterTemp] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const { leads, stats, loading, error, updateLeadStatus, updateLeadTemperature } = useLeads(businessId)

  // Fetch business ID on mount
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

  const filteredLeads = leads.filter(lead => {
    if (filterTemp && lead.temperature !== filterTemp) return false
    if (filterStatus && lead.status !== filterStatus) return false
    return true
  })

  if (!businessId) return <div className="p-6">Loading...</div>
  if (loading) return <div className="p-6">Loading leads...</div>
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07070A] via-[#0E1116] to-[#07070A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Leads Management</h1>
          <p className="text-[#D4AF37]/70">Track and manage your sales leads</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Leads" value={stats?.total_leads || 0} color="text-[#D4AF37]" />
          <StatCard label="Active" value={stats?.active_count || 0} color="text-blue-400" />
          <StatCard label="🔥 Hot" value={stats?.hot_count || 0} color="text-red-500" />
          <StatCard label="🟠 Warm" value={stats?.warm_count || 0} color="text-yellow-500" />
          <StatCard label="❄️ Cold" value={stats?.cold_count || 0} color="text-cyan-400" />
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <select
            value={filterTemp || ''}
            onChange={(e) => setFilterTemp(e.target.value || null)}
            className="px-4 py-2 bg-[#0E1116] border border-[#D4AF37]/20 rounded text-white"
          >
            <option value="">All Temperatures</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>

          <select
            value={filterStatus || ''}
            onChange={(e) => setFilterStatus(e.target.value || null)}
            className="px-4 py-2 bg-[#0E1116] border border-[#D4AF37]/20 rounded text-white"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="unqualified">Unqualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>

          <button className="px-4 py-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black rounded font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>

        {/* Leads Table */}
        <div className="backdrop-blur-md bg-[#0E1116]/80 border border-[#D4AF37]/10 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D4AF37]/10">
                <th className="px-6 py-4 text-left text-[#D4AF37] font-semibold">Contact</th>
                <th className="px-6 py-4 text-left text-[#D4AF37] font-semibold">Email</th>
                <th className="px-6 py-4 text-left text-[#D4AF37] font-semibold">Company</th>
                <th className="px-6 py-4 text-left text-[#D4AF37] font-semibold">Score</th>
                <th className="px-6 py-4 text-left text-[#D4AF37] font-semibold">Temperature</th>
                <th className="px-6 py-4 text-left text-[#D4AF37] font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-[#D4AF37] font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-[#D4AF37]/5 hover:bg-[#D4AF37]/5 transition">
                  <td className="px-6 py-4 text-white">
                    {(lead as any).contact?.first_name} {(lead as any).contact?.last_name}
                  </td>
                  <td className="px-6 py-4 text-[#D4AF37]/70">{(lead as any).contact?.email}</td>
                  <td className="px-6 py-4 text-[#D4AF37]/70">{(lead as any).contact?.company_name || '—'}</td>
                  <td className="px-6 py-4 text-white font-semibold">{lead.lead_score || 0}</td>
                  <td className="px-6 py-4">
                    <select
                      value={lead.temperature}
                      onChange={(e) => updateLeadTemperature(lead.id, e.target.value as any)}
                      className={`px-3 py-1 rounded text-white font-semibold text-sm ${
                        lead.temperature === 'hot'
                          ? 'bg-red-500/20 border border-red-500'
                          : lead.temperature === 'warm'
                          ? 'bg-yellow-500/20 border border-yellow-500'
                          : 'bg-cyan-500/20 border border-cyan-500'
                      }`}
                    >
                      <option value="hot">Hot</option>
                      <option value="warm">Warm</option>
                      <option value="cold">Cold</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={lead.status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value as any)}
                      className="px-3 py-1 rounded text-white bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-sm"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="unqualified">Unqualified</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-[#D4AF37] hover:text-[#D4AF37]/70 text-sm">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLeads.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-[#D4AF37]/50">No leads found matching your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="backdrop-blur-md bg-[#0E1116]/80 border border-[#D4AF37]/10 rounded-lg p-6">
      <p className="text-[#D4AF37]/70 text-sm mb-2">{label}</p>
      <p className={`${color} text-3xl font-bold`}>{value}</p>
    </div>
  )
}



