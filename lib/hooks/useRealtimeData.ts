/**
 * OGMJ BRANDS — Real-Time Data Hook
 * Supabase realtime subscriptions for live data
 * Last Updated: July 1, 2026
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/realtime-js'
import { logger } from '@/lib/services/logger.service'

// ================================
// TYPES
// ================================

export interface RealtimeOptions {
  enabled?: boolean
  onInsert?: (item: any) => void
  onUpdate?: (item: any) => void
  onDelete?: (item: any) => void
}

// ================================
// HOOK: useRealtimeData
// ================================

export function useRealtimeData<T extends Record<string, any>>(
  table: string,
  businessId: string,
  options?: RealtimeOptions
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const enabled = options?.enabled !== false

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { data: initialData, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .eq('business_id', businessId)

        if (fetchError) throw fetchError
        setData((initialData as T[]) || [])

        logger.info(`Fetched initial data from ${table}`, {
          table,
          businessId,
          count: (initialData as T[])?.length || 0,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch data'
        setError(message)
        logger.error(`Error fetching data from ${table}`, {
          table,
          businessId,
          error: message,
        })
      } finally {
        setLoading(false)
      }
    }

    if (enabled) {
      fetchInitialData()
    }
  }, [table, businessId, enabled])

  // Subscribe to real-time changes
  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    const setupSubscription = () => {
      try {
        channelRef.current = supabase
          .channel(`${table}:${businessId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table,
              filter: `business_id=eq.${businessId}`,
            },
            (payload: any) => {
              const { eventType, new: newItem, old: oldItem } = payload

              logger.debug(`Realtime event: ${eventType} on ${table}`, {
                table,
                eventType,
              })

              setData((prev) => {
                let updated = [...prev]

                if (eventType === 'INSERT') {
                  updated = [...updated, newItem as T]
                  options?.onInsert?.(newItem)
                } else if (eventType === 'UPDATE') {
                  updated = updated.map((item) =>
                    (item as any).id === (newItem as any).id ? (newItem as T) : item
                  )
                  options?.onUpdate?.(newItem)
                } else if (eventType === 'DELETE') {
                  updated = updated.filter((item) => (item as any).id !== (oldItem as any).id)
                  options?.onDelete?.(oldItem)
                }

                return updated
              })
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              logger.debug(`Subscribed to realtime channel: ${table}:${businessId}`)
            }
            if (err) {
              logger.error(`Subscription error for ${table}:${businessId}`, {
                error: err.message,
              })
            }
          })
      } catch (err) {
        logger.error(`Failed to setup subscription for ${table}`, {
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    setupSubscription()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [table, businessId, enabled, options])

  // Manual refresh function
  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: freshData, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('business_id', businessId)

      if (fetchError) throw fetchError
      setData((freshData as T[]) || [])
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh data'
      setError(message)
      logger.error(`Error refreshing data from ${table}`, {
        error: message,
      })
    } finally {
      setLoading(false)
    }
  }, [table, businessId])

  return {
    data,
    loading,
    error,
    refresh,
    count: data.length,
  }
}

// ================================
// HOOK: useRealtimeSingle
// ================================

export function useRealtimeSingle<T extends Record<string, any>>(
  table: string,
  id: string,
  businessId: string,
  options?: Omit<RealtimeOptions, 'onInsert' | 'onDelete'>
) {
  const [item, setItem] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const enabled = options?.enabled !== false

  // Initial fetch
  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .eq('business_id', businessId)
          .single()

        if (fetchError) throw fetchError
        setItem(data as T)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch item'
        setError(message)
        logger.error(`Error fetching single item from ${table}`, {
          error: message,
          id,
        })
      } finally {
        setLoading(false)
      }
    }

    if (enabled) {
      fetchItem()
    }
  }, [table, id, businessId, enabled])

  // Subscribe to updates
  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    const setupSubscription = () => {
      try {
        channelRef.current = supabase
          .channel(`${table}:${id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table,
              filter: `id=eq.${id}`,
            },
            (payload: any) => {
              setItem(payload.new as T)
              options?.onUpdate?.(payload.new)
            }
          )
          .subscribe()
      } catch (err) {
        logger.error(`Failed to setup subscription for ${table}:${id}`, {
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    setupSubscription()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [table, id, options, enabled])

  return {
    item,
    loading,
    error,
  }
}

// ================================
// HOOK: useRealtimeCount
// ================================

export function useRealtimeCount(
  table: string,
  businessId: string,
  filter?: Record<string, any>
) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Initial count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        let query = supabase.from(table).select('id', { count: 'exact', head: true })

        query = query.eq('business_id', businessId)

        if (filter) {
          for (const [key, value] of Object.entries(filter)) {
            query = query.eq(key, value)
          }
        }

        const { count: fetchedCount, error: fetchError } = await query

        if (fetchError) throw fetchError
        setCount(fetchedCount || 0)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to count items'
        setError(message)
        logger.error(`Error counting items in ${table}`, { error: message })
      } finally {
        setLoading(false)
      }
    }

    fetchCount()
  }, [table, businessId, filter])

  // Subscribe to changes
  useEffect(() => {
    const supabase = createClient()

    const setupSubscription = () => {
      try {
        const filterString = filter
          ? Object.entries(filter)
              .map(([k, v]) => `${k}=eq.${v}`)
              .join(',')
          : ''

        channelRef.current = supabase
          .channel(`count:${table}:${businessId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table,
              filter: `business_id=eq.${businessId}${filterString ? ',' + filterString : ''}`,
            },
            () => {
              // Re-fetch count on any change
              setCount((prev) => prev)
            }
          )
          .subscribe()
      } catch (err) {
        logger.error(`Failed to subscribe to count changes`, {
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    setupSubscription()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [table, businessId, filter])

  return { count, loading, error }
}

