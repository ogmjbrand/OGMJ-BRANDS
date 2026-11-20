/**
 * Business-scoped AI rate limiting, backed by the EXISTING `rate_limits`
 * table (RLS-enabled, admin-only SELECT policy, no client-writable
 * policy at all -- see its RLS: writes are only possible via a trusted
 * server path). `window_end` defaults to `now() + 1 hour` in the schema
 * itself, so a 1-hour fixed window matches the table's own original
 * design intent rather than inventing a different granularity.
 *
 * Uses the service-role client -- a narrow, deliberate widening of its
 * use beyond the webhook RPCs it was first introduced for (see its own
 * doc comment). Justified the same way that file asks for: this module
 * is ONLY ever called AFTER the caller has independently verified the
 * request (authenticated user + confirmed active business membership),
 * exactly like the webhook routes verify their HMAC signature first.
 *
 * Known limitation: the check-then-increment below is two round trips,
 * not one atomic statement (the JS client's upsert can't express
 * `count = count + 1`; only a DB function could, and adding one needs a
 * migration this module avoids). Under truly concurrent requests in the
 * same business+window+endpoint this can under-count by a request or
 * two. Acceptable for abuse-prevention (the real security boundary is
 * auth + business membership, checked before this ever runs), not
 * acceptable if this table were ever treated as a hard billing ledger --
 * it is not; `ai_execution_logs`/`cost_usd` is the source of truth for
 * cost.
 */
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export const DEFAULT_RATE_LIMIT_PER_HOUR = 100;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour, matching rate_limits.window_end's own default

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export async function checkAndIncrementRateLimit(
  businessId: string,
  endpoint: string,
  identifier: string,
  limit = DEFAULT_RATE_LIMIT_PER_HOUR
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartMs = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const windowStart = new Date(windowStartMs);
  const windowEnd = new Date(windowStartMs + WINDOW_MS);

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('rate_limits')
    .select('count')
    .eq('business_id', businessId)
    .eq('endpoint', endpoint)
    .eq('window_start', windowStart.toISOString())
    .maybeSingle();

  const currentCount = (existing as { count: number } | null)?.count ?? 0;
  if (currentCount >= limit) {
    return { allowed: false, limit, remaining: 0, resetAt: windowEnd };
  }

  const nextCount = currentCount + 1;
  // `onConflict` targets the real unique index (business_id, endpoint,
  // window_start) -- see the migration's own index definition. A second
  // concurrent request landing between the SELECT above and this upsert
  // overwrites `count` with its own `nextCount` rather than adding to
  // the other's, which is exactly the known best-effort limitation
  // documented above.
  await supabase.from('rate_limits').upsert(
    {
      business_id: businessId,
      endpoint,
      identifier,
      count: nextCount,
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
    },
    { onConflict: 'business_id,endpoint,window_start' }
  );

  return { allowed: true, limit, remaining: Math.max(0, limit - nextCount), resetAt: windowEnd };
}
