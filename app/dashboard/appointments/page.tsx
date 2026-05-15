'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Appointment {
  id: string
  title: string
  start_time: string
  end_time: string
  status: string | null
  type: string | null
  location: string | null
  meeting_url: string | null
  notes: string | null
  description: string | null
  contact_id: string | null
  deal_id: string | null
  lead_id: string | null
  business_id: string
  owner_id: string
  created_at: string | null
  updated_at: string | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AppointmentsPage() {
  const supabase = createClient()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── 1. Resolve businessId from business_members (canonical table) ──────────
  useEffect(() => {
    async function fetchBusinessId() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return

        // Use business_members (has business_id column, always in sync)
        const { data: membership, error: memberError } = await supabase
          .from('business_members')
          .select('business_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()

        if (memberError) {
          console.error('Error fetching business membership:', memberError)
          return
        }

        if (membership?.business_id) {
          setBusinessId((membership as any).business_id)
        }
      } catch (err) {
        console.error('fetchBusinessId error:', err)
      }
    }

    fetchBusinessId()
  }, [])

  // ── 2. Fetch appointments once businessId is resolved ──────────────────────
  useEffect(() => {
    if (!businessId) return

    async function fetchAppointments() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('appointments')
          .select('*')
          .eq('business_id', businessId!)
          .order('start_time', { ascending: true })

        if (fetchError) {
          setError(fetchError.message)
          return
        }

        setAppointments((data as Appointment[]) ?? [])
      } catch (err) {
        setError('Failed to load appointments')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [businessId])

  // ─────────────────────────────────────────────────────────────────────────────
  if (loading && !businessId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        <p>Error loading appointments: {error}</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Appointments</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg font-medium">No appointments yet</p>
          <p className="mt-1 text-sm">Schedule your first appointment to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="p-4 space-y-1 border rounded-lg shadow-sm bg-card"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{appt.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">
                  {appt.status ?? 'scheduled'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(appt.start_time).toLocaleString()} –{' '}
                {new Date(appt.end_time).toLocaleTimeString()}
              </p>
              {appt.location && (
                <p className="text-sm text-muted-foreground">📍 {appt.location}</p>
              )}
              {appt.meeting_url && (
                <a
                  href={appt.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Join Meeting
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


