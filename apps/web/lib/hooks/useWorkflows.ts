'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type WorkflowStatus = 'draft' | 'active' | 'paused'

export interface Workflow {
  id: string
  business_id: string
  owner_id: string
  name: string
  description: string | null
  status: WorkflowStatus
  trigger_type: string
  trigger_config: Record<string, any>
  actions: { type: string; label: string }[]
  settings: Record<string, any>
  run_count: number
  last_run_at: string | null
  created_at: string
  updated_at: string
}

export function useWorkflows(businessId: string) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkflows = useCallback(async () => {
    if (!businessId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('workflows')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setWorkflows(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch workflows'
      setError(message)
      console.error('Error fetching workflows:', err)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  const createWorkflow = useCallback(
    async (input: {
      name: string
      description?: string
      triggerType: string
      actions: { type: string; label: string }[]
    }) => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { error: createError } = await supabase.from('workflows').insert([
          {
            business_id: businessId,
            owner_id: user.id,
            name: input.name,
            description: input.description || null,
            trigger_type: input.triggerType,
            actions: input.actions,
            status: 'draft',
          },
        ])

        if (createError) throw createError
        await fetchWorkflows()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create workflow'
        setError(message)
        console.error('Error creating workflow:', err)
        return message
      }
    },
    [businessId, fetchWorkflows]
  )

  const updateStatus = useCallback(
    async (workflowId: string, status: WorkflowStatus) => {
      try {
        const supabase = createClient()
        const { error: updateError } = await supabase
          .from('workflows')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', workflowId)

        if (updateError) throw updateError
        await fetchWorkflows()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update workflow'
        setError(message)
        console.error('Error updating workflow:', err)
        return message
      }
    },
    [fetchWorkflows]
  )

  // workflow_step_logs only grants clients SELECT (writes are server-side
  // only), so actually executing a workflow's actions happens via
  // /api/workflows/[id]/run rather than a direct table write here.
  const runWorkflow = useCallback(
    async (workflowId: string, contactId?: string) => {
      try {
        const response = await fetch(`/api/workflows/${workflowId}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId }),
        })
        const body = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(body?.error || 'Failed to run workflow')
        }

        await fetchWorkflows()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to run workflow'
        setError(message)
        console.error('Error running workflow:', err)
        return message
      }
    },
    [fetchWorkflows]
  )

  const deleteWorkflow = useCallback(
    async (workflowId: string) => {
      try {
        const supabase = createClient()
        const { error: deleteError } = await supabase.from('workflows').delete().eq('id', workflowId)

        if (deleteError) throw deleteError
        await fetchWorkflows()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete workflow'
        setError(message)
        console.error('Error deleting workflow:', err)
        return message
      }
    },
    [fetchWorkflows]
  )

  return {
    workflows,
    loading,
    error,
    refetch: fetchWorkflows,
    createWorkflow,
    updateStatus,
    runWorkflow,
    deleteWorkflow,
  }
}
