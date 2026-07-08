'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Lead } from '@/lib/types/database'

interface LeadStats {
  total_leads: number
  active_count: number
  hot_count: number
  warm_count: number
  cold_count: number
  converted_count: number
}

export function useLeads(businessId: string) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeadsWithStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      // Get leads with contact info
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          business_id,
          contact_id,
          status,
          temperature,
          lead_score,
          created_at,
          updated_at,
          contact:contacts(
            id,
            first_name,
            last_name,
            email,
            phone,
            company_name
          )
        `)
        .eq('business_id', businessId)
        .order('lead_score', { ascending: false })

      if (leadsError) throw leadsError

      setLeads(leadsData || [])

      // Calculate stats
      const leadsArray = leadsData || []
      const stats: LeadStats = {
        total_leads: leadsArray.length,
        active_count: leadsArray.filter(l => l.status !== 'converted' && l.status !== 'lost').length,
        hot_count: leadsArray.filter(l => l.temperature === 'hot').length,
        warm_count: leadsArray.filter(l => l.temperature === 'warm').length,
        cold_count: leadsArray.filter(l => l.temperature === 'cold').length,
        converted_count: leadsArray.filter(l => l.status === 'converted').length,
      }

      setStats(stats)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch leads'
      setError(message)
      console.error('Error fetching leads:', err)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchLeadsWithStats()
  }, [fetchLeadsWithStats])

  const updateLeadStatus = useCallback(async (leadId: string, status: Lead['status']) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', leadId)

      if (error) throw error
      await fetchLeadsWithStats()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lead'
      setError(message)
      console.error('Error updating lead:', err)
    }
  }, [fetchLeadsWithStats])

  const updateLeadTemperature = useCallback(async (leadId: string, temperature: Lead['temperature']) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('leads')
        .update({ temperature, updated_at: new Date().toISOString() })
        .eq('id', leadId)

      if (error) throw error
      await fetchLeadsWithStats()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lead temperature'
      setError(message)
      console.error('Error updating lead temperature:', err)
    }
  }, [fetchLeadsWithStats])

  return {
    leads,
    stats,
    loading,
    error,
    refetch: fetchLeadsWithStats,
    updateLeadStatus,
    updateLeadTemperature,
  }
}


