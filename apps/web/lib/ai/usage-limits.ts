/**
 * OGMJ BRANDS — AI usage limits (server-only)
 *
 * Every route that calls a paid AI model must call enforceAIUsageLimit()
 * after it has authenticated the user and confirmed business membership,
 * and before the model call. Two fixed-window limits apply per business:
 *
 *   1. a per-feature hourly limit (e.g. 30 ad-copy generations per hour)
 *   2. a daily budget shared by ALL AI features (DAILY_AI_LIMIT)
 *
 * Both use the existing api_rate_limits table via checkRateLimit(), which
 * fails CLOSED: if the limit can't be checked, the AI call is refused
 * rather than allowed to run unmetered.
 */

import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rate-limit'

export const DAILY_AI_LIMIT = 200

export const AI_FEATURE_LIMITS = {
  'ai:chat': 60,
  'ai:assist': 60,
  'ai:generate': 30,
  'ai:workflow': 30,
  'ai:video': 20,
} as const

export type AIFeature = keyof typeof AI_FEATURE_LIMITS

export async function enforceAIUsageLimit(
  businessId: string,
  feature: AIFeature,
  /** Optional finer-grained label stored with the hourly counter, e.g. "ai:generate:ads". */
  detail?: string,
): Promise<NextResponse | null> {
  const hourly = await checkRateLimit({
    businessId,
    endpoint: detail ? `${feature}:${detail}` : feature,
    limit: AI_FEATURE_LIMITS[feature],
    windowMinutes: 60,
  })
  if (!hourly.allowed) {
    if (hourly.error) console.error('[AI limits] hourly check failed:', hourly.error)
    return NextResponse.json(
      {
        error: hourly.error
          ? 'AI is temporarily unavailable. Please try again shortly.'
          : 'You have reached the hourly limit for this AI feature. Please try again later.',
      },
      { status: hourly.error ? 503 : 429 },
    )
  }

  const daily = await checkRateLimit({ businessId, endpoint: 'ai:daily', limit: DAILY_AI_LIMIT, windowMinutes: 24 * 60 })
  if (!daily.allowed) {
    if (daily.error) console.error('[AI limits] daily check failed:', daily.error)
    return NextResponse.json(
      {
        error: daily.error
          ? 'AI is temporarily unavailable. Please try again shortly.'
          : "Your business has reached today's AI usage limit. It resets within 24 hours.",
      },
      { status: daily.error ? 503 : 429 },
    )
  }

  return null
}

/**
 * For AI routes that aren't scoped to a business in the request (OGMJ AI
 * chat/assist): bill usage to the first business the user belongs to.
 * Returns null if the user has no business yet.
 */
export async function resolveUserBusinessId(supabase: any): Promise<string | null> {
  const { data, error } = await supabase.from('my_businesses').select('id').limit(1)
  if (error || !data || data.length === 0) return null
  return data[0].id as string
}
