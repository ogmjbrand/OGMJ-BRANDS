/**
 * Best-effort, per-instance throttle for public forms (no auth, no business_id).
 * Serverless instances don't share memory, so this is a speed bump against
 * casual spam, not a guarantee. Authenticated routes should use checkRateLimit.
 */

export function createIpThrottle({ windowMs, max }: { windowMs: number; max: number }) {
  const recentByKey = new Map<string, number[]>()

  return {
    isThrottled(key: string, now: number = Date.now()): boolean {
      const recent = (recentByKey.get(key) ?? []).filter((time) => now - time < windowMs)
      if (recent.length >= max) {
        recentByKey.set(key, recent)
        return true
      }
      recent.push(now)
      recentByKey.set(key, recent)
      if (recentByKey.size > 5000) recentByKey.clear()
      return false
    },
    reset() {
      recentByKey.clear()
    },
  }
}

export function clientIpFrom(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown'
}
