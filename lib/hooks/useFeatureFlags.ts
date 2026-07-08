'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FeatureFlag {
  key: string
  is_enabled: boolean | null
  enabled_for_plans: string[] | null
  enabled_for_businesses: string[] | null
}

export function useFeatureFlags(businessId: string) {
  const [features, setFeatures] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planId, setPlanId] = useState<string>('free')

  const fetchFeatureFlags = useCallback(async () => {
    if (!businessId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      // Get the business's active subscription plan
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('plan_id')
        .eq('business_id', businessId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (subError) throw subError

      const currentPlanId = subscriptionData?.[0]?.plan_id || 'free'
      setPlanId(currentPlanId)

      // feature_flags is keyed by `key` with is_enabled + plan/business scoping arrays
      const { data: featureData, error: featuresError } = await supabase
        .from('feature_flags')
        .select('key, is_enabled, enabled_for_plans, enabled_for_businesses')

      if (featuresError) throw featuresError

      const featureMap: Record<string, boolean> = {}
      featureData?.forEach((f: FeatureFlag) => {
        const plans = f.enabled_for_plans ?? []
        const businesses = f.enabled_for_businesses ?? []
        const scoped = plans.length > 0 || businesses.length > 0
        featureMap[f.key] =
          Boolean(f.is_enabled) &&
          (!scoped || plans.includes(currentPlanId) || businesses.includes(businessId))
      })

      setFeatures(featureMap)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch feature flags'
      setError(message)
      console.error('Error fetching feature flags:', err)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchFeatureFlags()
  }, [fetchFeatureFlags])

  const isFeatureEnabled = useCallback(
    (featureName: string): boolean => {
      return features[featureName] ?? false
    },
    [features]
  )

  const hasFeature = useCallback(
    (featureName: string): boolean => {
      return isFeatureEnabled(featureName)
    },
    [isFeatureEnabled]
  )

  return {
    features,
    loading,
    error,
    planId,
    isFeatureEnabled,
    hasFeature,
    refetch: fetchFeatureFlags,
  }
}



