/**
 * useBusinessId — Resolves the current user's active business_id
 *
 * Queries business_members directly (NOT my_businesses view, which exposes
 * only `id` not `business_id`). This is the canonical pattern for all
 * dashboard pages in OGMJ Brands.
 *
 * Usage:
 *   const { businessId, loading } = useBusinessId()
 */
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseBusinessIdReturn {
  businessId: string | null
  loading: boolean
  error: string | null
}

export function useBusinessId(): UseBusinessIdReturn {
  const supabase = createClient()
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      try {
        setLoading(true)
        setError(null)

        const { data: { user }, error: authErr } = await supabase.auth.getUser()
        if (authErr || !user) {
          if (!cancelled) setLoading(false)
          return
        }

        // business_members is the canonical source — has business_id column
        const { data, error: memberErr } = await supabase
          .from('business_members')
          .select('business_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()

        if (cancelled) return

        if (memberErr) {
          setError(memberErr.message)
          return
        }

        setBusinessId((data as any)?.business_id ?? null)
      } catch (err) {
        if (!cancelled) setError('Failed to resolve business')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    resolve()
    return () => { cancelled = true }
  }, [])

  return { businessId, loading, error }
}


