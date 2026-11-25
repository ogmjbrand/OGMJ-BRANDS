/**
 * Retry policy for transient Anthropic API failures (used by
 * proposeWebsiteOperations in websiteAssist.ts).
 *
 * Policy, by design:
 * - RETRY: HTTP 429 (rate limit), any 5xx (500/502/503/529/etc -- Anthropic's
 *   InternalServerError class covers the whole range uniformly, same as the
 *   SDK's own built-in retry policy), and network-level failures (no response
 *   ever came back: APIConnectionError, including the timeout subclass).
 * - NEVER RETRY: 400 (including "insufficient credit balance" -- see
 *   websiteAssist.ts for why that gets its own, more specific message), 401,
 *   403, or any other non-retryable 4xx. These are permanent for the current
 *   request: retrying would fail identically every time while still costing
 *   another (billed) attempt.
 *
 * Idempotency / "don't double-generate, don't double-bill": this SDK version
 * has no Idempotency-Key support for the Messages API (checked directly --
 * `Anthropic.prototype.idempotencyHeader` is never set), so there is no
 * provider-level guarantee against a retried request being processed twice.
 * What keeps this safe regardless:
 *   1. A retry only ever fires in response to Anthropic *telling us* the
 *      previous attempt did not succeed (an explicit 429/5xx error response),
 *      or a connection failure where no response was ever received at all --
 *      never after a successful response, which is returned immediately and
 *      is the end of this module's involvement.
 *   2. This call is read-only from the app's point of view: it proposes
 *      operations for the user to review, it never itself writes to the
 *      document. A retried/duplicated generation call can at worst produce a
 *      second (reviewed, not auto-applied) proposal -- it cannot duplicate
 *      content in the user's actual website, since that only ever happens
 *      once, on the user's own explicit "Apply" action.
 *
 * Backoff: exponential with jitter (same base/cap/jitter formula the
 * Anthropic SDK's own default retry uses: 500ms base, 8s cap, up to 25%
 * trimmed off at random), unless Anthropic's response included a
 * `retry-after` header, which is always honored over the computed default.
 */
import Anthropic from '@anthropic-ai/sdk';

export const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 8_000;

/** True for a failure this app's policy says is worth retrying automatically. */
export function isRetryableAnthropicError(error: unknown): boolean {
  if (error instanceof Anthropic.RateLimitError) return true; // 429
  // APIConnectionTimeoutError extends APIConnectionError, so this one check
  // covers both "never got a response" and "timed out waiting for one" --
  // in both cases nothing conclusively succeeded, so a retry is safe.
  if (error instanceof Anthropic.APIConnectionError) return true;
  if (error instanceof Anthropic.APIError && typeof error.status === 'number') {
    // AuthenticationError (401), PermissionDeniedError (403) and
    // BadRequestError (400, including insufficient-credit) are distinct
    // APIError subclasses with their own fixed `status`, all < 500 --
    // never reach `true` here. Only an actual server-side (5xx) failure does.
    return error.status >= 500;
  }
  return false;
}

/** Parses Anthropic's `retry-after` response header (seconds, or an HTTP-date), if present. */
function retryAfterMsFromError(error: unknown): number | null {
  if (!(error instanceof Anthropic.APIError) || !error.headers) return null;
  const headerValue = error.headers.get('retry-after');
  if (!headerValue) return null;
  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds)) return Math.max(0, seconds * 1000);
  const dateMs = Date.parse(headerValue) - Date.now();
  return Number.isNaN(dateMs) ? null : Math.max(0, dateMs);
}

/**
 * The delay before retry attempt number `attemptNumber` (1-indexed: the
 * delay awaited after attempt 1 fails, before attempt 2 runs). Honors
 * Anthropic's `retry-after` header when the failing response included one;
 * otherwise exponential backoff with jitter -- trimming up to 25% off the
 * computed delay at random, the same formula the Anthropic SDK's own
 * built-in retry uses, so simultaneous callers spread out instead of all
 * retrying in lockstep without ever jittering down to a near-zero wait.
 */
export function computeRetryDelayMs(attemptNumber: number, error: unknown): number {
  const retryAfter = retryAfterMsFromError(error);
  if (retryAfter !== null) return retryAfter;
  const exponential = Math.min(BASE_DELAY_MS * 2 ** (attemptNumber - 1), MAX_DELAY_MS);
  const jitter = 1 - Math.random() * 0.25;
  return exponential * jitter;
}

export interface RetryObservers {
  /** Called once per retry, after a retryable failure and before the delay is awaited. */
  onRetry?: (info: { attempt: number; delayMs: number; error: unknown }) => void;
  /** Overridable only for tests -- real callers get a real delay. */
  sleep?: (ms: number) => Promise<void>;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs `attempt` up to MAX_ATTEMPTS times, retrying only on a failure
 * `isRetryableAnthropicError` approves, with backoff between attempts. Any
 * non-retryable failure, or the final attempt's failure once attempts are
 * exhausted, is rethrown as-is for the caller's own error classification.
 */
export async function withAnthropicRetry<T>(attempt: (attemptNumber: number) => Promise<T>, observers: RetryObservers = {}): Promise<T> {
  const sleep = observers.sleep ?? defaultSleep;
  let lastError: unknown;
  for (let attemptNumber = 1; attemptNumber <= MAX_ATTEMPTS; attemptNumber++) {
    try {
      return await attempt(attemptNumber);
    } catch (error) {
      lastError = error;
      const isLastAttempt = attemptNumber === MAX_ATTEMPTS;
      if (isLastAttempt || !isRetryableAnthropicError(error)) throw error;
      const delayMs = computeRetryDelayMs(attemptNumber, error);
      observers.onRetry?.({ attempt: attemptNumber, delayMs, error });
      await sleep(delayMs);
    }
  }
  // Unreachable (the loop always either returns or throws), but keeps the
  // function's return type honest for TypeScript's control-flow analysis.
  throw lastError;
}
