'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FeatureFlag {
  feature_name: string
  enabled: boolean
  plan_id?: string
}

export function useFeatureFlags(businessId: string) {
  const [features, setFeatures] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planId, setPlanId] = useState<string>('free')

  const fetchFeatureFlags = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      // Get business subscription
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('plan_id')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (subError) throw subError

      const currentPlanId = subscriptionData?.[0]?.plan_id || 'free'
      setPlanId(currentPlanId)

      // Get plan features from feature flags table
      const { data: featureData, error: featuresError } = await supabase
        .from('feature_flags')
        .select('feature_name, enabled')
        .eq('plan_id', currentPlanId)

      if (featuresError) throw featuresError

      const featureMap: Record<string, boolean> = {}
      featureData?.forEach((f: FeatureFlag) => {
        featureMap[f.feature_name] = f.enabled
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



