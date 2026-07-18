'use client'

import React, { useEffect, useState } from 'react'
import { CalendarDays, Clock3, MapPin, Plus, Sparkles, Video } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards'

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

export default function AppointmentsPage() {
  const supabase = createClient()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newAppt, setNewAppt] = useState({ title: '', startTime: '', endTime: '', location: '', meetingUrl: '', description: '' })

  useEffect(() => {
    async function fetchBusinessId() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return

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

  async function fetchAppointments() {
    if (!businessId) return
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('business_id', businessId)
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

  useEffect(() => {
    fetchAppointments()
  }, [businessId])

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    if (!newAppt.title.trim() || !newAppt.startTime || !newAppt.endTime) {
      setCreateError('Title, start time and end time are required')
      return
    }
    if (new Date(newAppt.endTime) <= new Date(newAppt.startTime)) {
      setCreateError('End time must be after start time')
      return
    }

    setCreating(true)
    setCreateError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          business_id: businessId,
          owner_id: user.id,
          title: newAppt.title.trim(),
          description: newAppt.description.trim() || null,
          location: newAppt.location.trim() || null,
          meeting_url: newAppt.meetingUrl.trim() || null,
          start_time: new Date(newAppt.startTime).toISOString(),
          end_time: new Date(newAppt.endTime).toISOString(),
        } as any)

      if (insertError) throw insertError

      setNewAppt({ title: '', startTime: '', endTime: '', location: '', meetingUrl: '', description: '' })
      setShowNewModal(false)
      await fetchAppointments()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create appointment')
    } finally {
      setCreating(false)
    }
  }

  const upcomingCount = appointments.filter((appt) => new Date(appt.start_time) >= new Date()).length
  const scheduledCount = appointments.filter((appt) => (appt.status ?? 'scheduled') === 'scheduled').length

  if (loading && !businessId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#C8FF00]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[1.6rem] border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        <p>Error loading appointments: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#C8FF00]/10 bg-[radial-gradient(circle_at_top_left,_rgba(200, 255, 0,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/20 bg-[#C8FF00]/10 px-4 py-2 text-sm text-[#C8FF00]">
              <Sparkles className="h-4 w-4" /> Time and attention orchestration
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Keep every meeting, touchpoint and follow-up moving smoothly.</h1>
            <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Your calendar stays elegant, actionable and connected to the rest of your empire.</p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#C8FF00] px-5 py-3 text-sm font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90"
          >
            <Plus className="h-4 w-4" /> New appointment
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total appointments" value={appointments.length.toString()} description="Scheduled meetings in your workspace" icon={CalendarDays} accent="gold" trend="Live" />
        <MetricCard title="Upcoming" value={upcomingCount.toString()} description="Meetings still ahead on the calendar" icon={Clock3} accent="emerald" trend="Ready" />
        <MetricCard title="Scheduled" value={scheduledCount.toString()} description="Open appointments awaiting attention" icon={CalendarDays} accent="slate" trend="Focus" />
      </div>

      <SectionPanel title="Appointment flow" subtitle="Review the meetings that shape your next moves">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#C8FF00]" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-[1.35rem] border border-[#C8FF00]/10 bg-[#11151E] p-12 text-center">
            <p className="text-lg font-medium text-white">No appointments yet</p>
            <p className="mt-1 text-sm text-[#F8F9FA]/60">Schedule your first appointment to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {appointments.map((appt) => {
              const statusLabel = appt.status ?? 'scheduled'
              return (
                <div key={appt.id} className="rounded-[1.35rem] border border-[#C8FF00]/10 bg-[#11151E] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{appt.title}</h3>
                      <p className="mt-1 text-sm text-[#F8F9FA]/60">{new Date(appt.start_time).toLocaleString()} — {new Date(appt.end_time).toLocaleTimeString()}</p>
                    </div>
                    <span className="rounded-full bg-[#C8FF00]/10 px-3 py-1 text-xs font-medium capitalize text-[#C8FF00]">
                      {statusLabel}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#F8F9FA]/60">
                    {appt.location ? (
                      <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {appt.location}</span>
                    ) : null}
                    {appt.type ? <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> {appt.type}</span> : null}
                  </div>
                  {appt.meeting_url ? (
                    <a href={appt.meeting_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#C8FF00]">
                      <Video className="h-4 w-4" /> Join meeting
                    </a>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </SectionPanel>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md space-y-4 rounded-xl border border-[#C8FF00]/20 bg-[#0E1116] p-6">
            <h2 className="text-xl font-semibold text-white">New appointment</h2>
            {createError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{createError}</div>
            )}
            <form onSubmit={handleCreateAppointment} className="space-y-3">
              <input
                type="text"
                placeholder="Title *"
                value={newAppt.title}
                onChange={(e) => setNewAppt((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-[#C8FF00]/20 bg-[#07070A] px-3 py-2 text-white outline-none focus:border-[#C8FF00]"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[#C8FF00]/70">Starts *</label>
                  <input
                    type="datetime-local"
                    value={newAppt.startTime}
                    onChange={(e) => setNewAppt((prev) => ({ ...prev, startTime: e.target.value }))}
                    className="w-full rounded-lg border border-[#C8FF00]/20 bg-[#07070A] px-3 py-2 text-white outline-none focus:border-[#C8FF00]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#C8FF00]/70">Ends *</label>
                  <input
                    type="datetime-local"
                    value={newAppt.endTime}
                    onChange={(e) => setNewAppt((prev) => ({ ...prev, endTime: e.target.value }))}
                    className="w-full rounded-lg border border-[#C8FF00]/20 bg-[#07070A] px-3 py-2 text-white outline-none focus:border-[#C8FF00]"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Location"
                value={newAppt.location}
                onChange={(e) => setNewAppt((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full rounded-lg border border-[#C8FF00]/20 bg-[#07070A] px-3 py-2 text-white outline-none focus:border-[#C8FF00]"
              />
              <input
                type="url"
                placeholder="Meeting URL (optional)"
                value={newAppt.meetingUrl}
                onChange={(e) => setNewAppt((prev) => ({ ...prev, meetingUrl: e.target.value }))}
                className="w-full rounded-lg border border-[#C8FF00]/20 bg-[#07070A] px-3 py-2 text-white outline-none focus:border-[#C8FF00]"
              />
              <textarea
                placeholder="Notes"
                rows={3}
                value={newAppt.description}
                onChange={(e) => setNewAppt((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-lg border border-[#C8FF00]/20 bg-[#07070A] px-3 py-2 text-white outline-none focus:border-[#C8FF00]"
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowNewModal(false); setCreateError(null) }}
                  className="flex-1 rounded-lg bg-[#C8FF00]/10 px-4 py-2 text-sm font-medium text-[#C8FF00]/70 transition hover:bg-[#C8FF00]/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90 disabled:opacity-50"
                >
                  {creating ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


