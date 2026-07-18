'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EmailSequence, SequenceStatus } from '@/lib/types/database'

export function useEmailSequences(businessId: string) {
  const [sequences, setSequences] = useState<EmailSequence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSequences = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      // total_enrolled/total_completed/total_unsubscribed are denormalized
      // counters maintained directly on email_sequences.
      const { data, error: fetchError } = await supabase
        .from('email_sequences')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setSequences(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sequences'
      setError(message)
      console.error('Error fetching sequences:', err)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchSequences()
  }, [fetchSequences])

  const createSequence = useCallback(
    async (
      sequence: Omit<EmailSequence, 'id' | 'created_at' | 'updated_at'>
    ) => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('email_sequences')
          .insert([{ ...sequence, business_id: businessId }])

        if (error) throw error
        await fetchSequences()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create sequence'
        setError(message)
        console.error('Error creating sequence:', err)
        return message
      }
    },
    [businessId, fetchSequences]
  )

  const updateStatus = useCallback(
    async (sequenceId: string, status: SequenceStatus) => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('email_sequences')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', sequenceId)

        if (error) throw error
        await fetchSequences()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update sequence'
        setError(message)
        console.error('Error updating sequence:', err)
        return message
      }
    },
    [fetchSequences]
  )

  const deleteSequence = useCallback(
    async (sequenceId: string) => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('email_sequences')
          .delete()
          .eq('id', sequenceId)

        if (error) throw error
        await fetchSequences()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete sequence'
        setError(message)
        console.error('Error deleting sequence:', err)
        return message
      }
    },
    [fetchSequences]
  )

  return {
    sequences,
    loading,
    error,
    refetch: fetchSequences,
    createSequence,
    updateStatus,
    deleteSequence,
  }
}


