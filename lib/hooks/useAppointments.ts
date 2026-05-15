'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentStatus } from '@/lib/types/database'

export function useAppointments(businessId: string, month?: Date) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const startOfMonth = month
        ? new Date(month.getFullYear(), month.getMonth(), 1)
        : new Date()
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0)

      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          *,
          contact:contacts(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('business_id', businessId)
        .gte('start_time', startOfMonth.toISOString())
        .lte('start_time', endOfMonth.toISOString())
        .order('start_time', { ascending: true })

      if (fetchError) throw fetchError

      setAppointments(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch appointments'
      setError(message)
      console.error('Error fetching appointments:', err)
    } finally {
      setLoading(false)
    }
  }, [businessId, month])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const createAppointment = useCallback(
    async (
      appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
    ) => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('appointments')
          .insert([appointment])

        if (error) throw error
        await fetchAppointments()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create appointment'
        setError(message)
        console.error('Error creating appointment:', err)
        return message
      }
    },
    [fetchAppointments]
  )

  const updateStatus = useCallback(
    async (appointmentId: string, status: AppointmentStatus) => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('appointments')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', appointmentId)

        if (error) throw error
        await fetchAppointments()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update appointment'
        setError(message)
        console.error('Error updating appointment:', err)
        return message
      }
    },
    [fetchAppointments]
  )

  const deleteAppointment = useCallback(
    async (appointmentId: string) => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', appointmentId)

        if (error) throw error
        await fetchAppointments()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete appointment'
        setError(message)
        console.error('Error deleting appointment:', err)
        return message
      }
    },
    [fetchAppointments]
  )

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
    createAppointment,
    updateStatus,
    deleteAppointment,
  }
}
