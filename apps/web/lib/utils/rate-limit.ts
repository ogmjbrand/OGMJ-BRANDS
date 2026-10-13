/**
 * OGMJ BRANDS — Fixed-window rate limiting (server-only)
 *
 * Backed by the existing api_rate_limits table (business_id, endpoint,
 * window_start, request_count) via the increment_rate_limit() SQL
 * function, which does an atomic upsert-and-check against that table's
 * existing unique constraint — no new infrastructure.
 *
 * Fails CLOSED: if the rate-limit check itself errors, the request is
 * treated as not allowed. This gates a paid, external-facing send
 * action (WhatsApp messages cost money and can reach real people), so
 * an infra hiccup here should block the send, not silently let it
 * through unprotected.
 */

import { createServerClient } from '@/lib/supabase/server';

export interface RateLimitOptions {
  businessId: string;
  /** A short identifier for the thing being limited, e.g. "whatsapp:send". */
  endpoint: string;
  limit: number;
  windowMinutes: number;
  /**
   * How much this single check counts against the limit — e.g. a bulk
   * campaign send counting once per recipient rather than once per call,
   * so a 1000-contact campaign can't sail through a call-count limit
   * while still sending 1000 messages. Defaults to 1 (one call = one
   * unit), matching every caller before this field existed.
   */
  incrementBy?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  error?: string;
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const windowMs = options.windowMinutes * 60 * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString();

  const supabase = await createServerClient();
  const { data, error } = await (supabase as any).rpc('increment_rate_limit', {
    p_business_id: options.businessId,
    p_endpoint: options.endpoint,
    p_window_start: windowStart,
    p_limit: options.limit,
    p_increment_by: options.incrementBy ?? 1,
  });

  if (error) {
    return { allowed: false, error: `Rate limit check failed: ${error.message}` };
  }

  return { allowed: Boolean(data) };
}
