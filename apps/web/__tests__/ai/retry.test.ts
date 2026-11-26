import { describe, expect, it, vi } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { MAX_ATTEMPTS, computeRetryDelayMs, isRetryableAnthropicError, withAnthropicRetry } from '@/lib/ai/retry';

function apiError(status: number, message: string, headers: Record<string, string> = {}) {
  return new Anthropic.APIError(status, { error: { message } }, message, new Headers(headers));
}

describe('isRetryableAnthropicError', () => {
  it('retries 429 (rate limit)', () => {
    expect(isRetryableAnthropicError(new Anthropic.RateLimitError(429, {}, 'rate limited', new Headers()))).toBe(true);
  });

  it.each([500, 502, 503, 529, 599])('retries %i (any 5xx server-side failure)', (status) => {
    expect(isRetryableAnthropicError(apiError(status, 'server error'))).toBe(true);
  });

  it('retries a network-level connection failure (no response was ever received)', () => {
    expect(isRetryableAnthropicError(new Anthropic.APIConnectionError({ message: 'connection reset' }))).toBe(true);
  });

  it('retries a connection timeout', () => {
    expect(isRetryableAnthropicError(new Anthropic.APIConnectionTimeoutError({ message: 'timed out' }))).toBe(true);
  });

  it('does NOT retry 400 (bad request, including insufficient credit balance)', () => {
    expect(isRetryableAnthropicError(apiError(400, 'Your credit balance is too low to access the Claude API.'))).toBe(false);
  });

  it('does NOT retry 401 (authentication)', () => {
    expect(isRetryableAnthropicError(new Anthropic.AuthenticationError(401, {}, 'invalid key', new Headers()))).toBe(false);
  });

  it('does NOT retry 403 (permission denied)', () => {
    expect(isRetryableAnthropicError(new Anthropic.PermissionDeniedError(403, {}, 'forbidden', new Headers()))).toBe(false);
  });

  it('does NOT retry a non-Anthropic error', () => {
    expect(isRetryableAnthropicError(new Error('some other failure'))).toBe(false);
  });
});

describe('computeRetryDelayMs', () => {
  it('honors an explicit Retry-After header (seconds) over the computed backoff', () => {
    const error = apiError(429, 'rate limited', { 'retry-after': '2' });
    expect(computeRetryDelayMs(1, error)).toBe(2000);
  });

  it('grows exponentially across attempts when no Retry-After header is present', () => {
    const error = apiError(500, 'server error');
    // Jitter trims up to 25% off, so compare against the ceiling for each attempt.
    expect(computeRetryDelayMs(1, error)).toBeLessThanOrEqual(500);
    expect(computeRetryDelayMs(1, error)).toBeGreaterThan(0);
    expect(computeRetryDelayMs(2, error)).toBeLessThanOrEqual(1000);
    expect(computeRetryDelayMs(3, error)).toBeLessThanOrEqual(2000);
  });

  it('caps the computed backoff rather than growing unbounded', () => {
    const error = apiError(500, 'server error');
    expect(computeRetryDelayMs(10, error)).toBeLessThanOrEqual(8000);
  });
});

describe('withAnthropicRetry', () => {
  it('REGRESSION: succeeds immediately with a single attempt when there is no failure', async () => {
    const attempt = vi.fn().mockResolvedValue('ok');
    const result = await withAnthropicRetry(attempt, { sleep: async () => {} });
    expect(result).toBe('ok');
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('REGRESSION: a single temporary failure followed by success retries exactly once', async () => {
    const attempt = vi
      .fn()
      .mockRejectedValueOnce(apiError(503, 'overloaded'))
      .mockResolvedValueOnce('ok');
    const onRetry = vi.fn();
    const result = await withAnthropicRetry(attempt, { sleep: async () => {}, onRetry });
    expect(result).toBe('ok');
    expect(attempt).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry.mock.calls[0][0].attempt).toBe(1);
  });

  it('REGRESSION: multiple temporary failures followed by success retries up to the attempt cap', async () => {
    const attempt = vi
      .fn()
      .mockRejectedValueOnce(new Anthropic.RateLimitError(429, {}, 'rate limited', new Headers()))
      .mockRejectedValueOnce(apiError(503, 'overloaded'))
      .mockResolvedValueOnce('ok');
    const result = await withAnthropicRetry(attempt, { sleep: async () => {} });
    expect(result).toBe('ok');
    expect(attempt).toHaveBeenCalledTimes(3); // 2 failures + the 3rd (final allowed) attempt succeeds
  });

  it('REGRESSION: exhausts retries and rethrows the last error without exceeding MAX_ATTEMPTS calls', async () => {
    expect(MAX_ATTEMPTS).toBe(3);
    const attempt = vi.fn().mockRejectedValue(apiError(500, 'server error'));
    await expect(withAnthropicRetry(attempt, { sleep: async () => {} })).rejects.toThrow('server error');
    expect(attempt).toHaveBeenCalledTimes(MAX_ATTEMPTS);
  });

  it('REGRESSION: a 400 (insufficient credit) is never retried -- fails on the first attempt', async () => {
    const attempt = vi.fn().mockRejectedValue(apiError(400, 'Your credit balance is too low to access the Claude API.'));
    const onRetry = vi.fn();
    await expect(withAnthropicRetry(attempt, { sleep: async () => {}, onRetry })).rejects.toThrow(/credit balance/i);
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('REGRESSION: a 401 is never retried', async () => {
    const attempt = vi.fn().mockRejectedValue(new Anthropic.AuthenticationError(401, {}, 'invalid key', new Headers()));
    await expect(withAnthropicRetry(attempt, { sleep: async () => {} })).rejects.toThrow();
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('REGRESSION: a 403 is never retried', async () => {
    const attempt = vi.fn().mockRejectedValue(new Anthropic.PermissionDeniedError(403, {}, 'forbidden', new Headers()));
    await expect(withAnthropicRetry(attempt, { sleep: async () => {} })).rejects.toThrow();
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('REGRESSION: a network failure (connection error, no response at all) is retried', async () => {
    const attempt = vi
      .fn()
      .mockRejectedValueOnce(new Anthropic.APIConnectionError({ message: 'ECONNRESET' }))
      .mockResolvedValueOnce('ok');
    const result = await withAnthropicRetry(attempt, { sleep: async () => {} });
    expect(result).toBe('ok');
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  it('REGRESSION: honors Retry-After by passing its exact delay to sleep rather than the computed backoff', async () => {
    const attempt = vi
      .fn()
      .mockRejectedValueOnce(new Anthropic.RateLimitError(429, {}, 'rate limited', new Headers({ 'retry-after': '3' })))
      .mockResolvedValueOnce('ok');
    const sleepCalls: number[] = [];
    await withAnthropicRetry(attempt, {
      sleep: async (ms) => {
        sleepCalls.push(ms);
      },
    });
    expect(sleepCalls).toEqual([3000]);
  });
});
