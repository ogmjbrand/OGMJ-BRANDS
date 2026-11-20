import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let currentUser: { id: string; email: string } | null = { id: 'user-1', email: 'user@example.com' };
let membershipResult: { data: unknown; error: unknown } = { data: { role: 'owner' }, error: null };
const insertedLogs: unknown[] = [];
let insertShouldThrow: unknown = null;

vi.mock('@/lib/auth.server', () => ({
  getCurrentUserServer: () => Promise.resolve(currentUser),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () =>
    Promise.resolve({
      from(table: string) {
        if (table === 'business_users') {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            async single() {
              return membershipResult;
            },
          };
        }
        if (table === 'ai_execution_logs') {
          return {
            async insert(row: unknown) {
              if (insertShouldThrow) throw insertShouldThrow;
              insertedLogs.push(row);
              return { data: null, error: null };
            },
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    }),
}));

let completeResult: unknown = { text: 'Here is my advice.', provider: 'anthropic', model: 'claude-sonnet-5-5', usage: { inputTokens: 10, outputTokens: 5 }, costUsd: 0.001 };
let completeShouldThrow: Error | null = null;
let rateLimitAllowed = true;
let rateLimitShouldThrow: unknown = null;

vi.mock('@/lib/ai/providers', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/providers')>('@/lib/ai/providers');
  return {
    ...actual,
    getProvider: vi.fn(() => ({
      id: 'anthropic',
      isConfigured: () => true,
      complete: async () => {
        if (completeShouldThrow) throw completeShouldThrow;
        return completeResult;
      },
    })),
  };
});

vi.mock('@/lib/ai/rateLimit', () => ({
  checkAndIncrementRateLimit: vi.fn(async () => {
    if (rateLimitShouldThrow) throw rateLimitShouldThrow;
    return {
      allowed: rateLimitAllowed,
      limit: 100,
      remaining: rateLimitAllowed ? 99 : 0,
      resetAt: new Date('2026-01-01T01:00:00Z'),
    };
  }),
}));

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('https://ogmjbrands.com/api/ai/business-assistant', { method: 'POST', body: JSON.stringify(body) });
}

const validBody = { businessId: '11111111-1111-1111-1111-111111111111', message: 'Help me plan a product launch.' };

describe('POST /api/ai/business-assistant', () => {
  beforeEach(() => {
    currentUser = { id: 'user-1', email: 'user@example.com' };
    membershipResult = { data: { role: 'owner' }, error: null };
    completeResult = { text: 'Here is my advice.', provider: 'anthropic', model: 'claude-sonnet-5-5', usage: { inputTokens: 10, outputTokens: 5 }, costUsd: 0.001 };
    completeShouldThrow = null;
    rateLimitAllowed = true;
    rateLimitShouldThrow = null;
    insertedLogs.length = 0;
    insertShouldThrow = null;
  });

  it('returns a real AI response for an authorized, valid request', async () => {
    const { POST } = await import('@/app/api/ai/business-assistant/route');
    const res = await POST(makeRequest(validBody));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.text).toBe('Here is my advice.');
    expect(body.data.usage).toEqual({ inputTokens: 10, outputTokens: 5 });
    expect(insertedLogs).toHaveLength(1);
    expect((insertedLogs[0] as { status: string }).status).toBe('completed');
  });

  it('requires authentication', async () => {
    currentUser = null;
    const { POST } = await import('@/app/api/ai/business-assistant/route');
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
    expect(insertedLogs).toHaveLength(0);
  });

  it('rejects an invalid request body before ever calling the AI or touching business membership', async () => {
    const { POST } = await import('@/app/api/ai/business-assistant/route');
    const res = await POST(makeRequest({ businessId: 'not-a-uuid', message: '' }));
    expect(res.status).toBe(400);
  });

  it('enforces organization isolation -- a user without active business membership is denied', async () => {
    membershipResult = { data: null, error: null };
    const { POST } = await import('@/app/api/ai/business-assistant/route');
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(403);
    expect(insertedLogs).toHaveLength(0);
  });

  it('enforces the rate limit before ever calling the AI provider', async () => {
    rateLimitAllowed = false;
    const { POST } = await import('@/app/api/ai/business-assistant/route');
    const res = await POST(makeRequest(validBody));
    const body = await res.json();
    expect(res.status).toBe(429);
    expect(body.error).toMatch(/rate limit/i);
    expect(insertedLogs).toHaveLength(0); // never reached the provider or logging
  });

  it('never fabricates a success response when the provider fails -- logs the failure and returns the real error/status', async () => {
    const { AIProviderError } = await import('@/lib/ai/providers/types');
    completeShouldThrow = new AIProviderError('Invalid ANTHROPIC_API_KEY.', 'authentication', 'anthropic');
    const { POST } = await import('@/app/api/ai/business-assistant/route');
    const res = await POST(makeRequest(validBody));
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.error).toContain('ANTHROPIC_API_KEY');
    expect(insertedLogs).toHaveLength(1);
    expect((insertedLogs[0] as { status: string }).status).toBe('failed');
  });

  it('maps a rate-limited provider error to 429', async () => {
    const { AIProviderError } = await import('@/lib/ai/providers/types');
    completeShouldThrow = new AIProviderError('slow down', 'rate_limited', 'openai');
    const { POST } = await import('@/app/api/ai/business-assistant/route');
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
  });

  describe('error logging never includes the raw error object, credentials, headers, or request content', () => {
    it('a usage-logging failure on the SUCCESS path logs only a safe {name, message} summary -- never the raw thrown value -- and still returns the real AI success', async () => {
      // Simulate an SDK-shaped error the way an HTTP client error might
      // look: carries extra properties (here standing in for response
      // headers / echoed request body) that must never reach the log.
      const sensitiveLeak = Object.assign(new Error('insert failed: connection reset'), {
        headers: { authorization: 'Bearer sk-should-never-be-logged' },
        requestBody: { secret: 'should-never-be-logged-either' },
      });
      insertShouldThrow = sensitiveLeak;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { POST } = await import('@/app/api/ai/business-assistant/route');
      const res = await POST(makeRequest(validBody));
      const body = await res.json();

      // The logging failure is non-fatal: the user still gets the real AI success.
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedArgs = consoleErrorSpy.mock.calls.flat();
      const loggedText = JSON.stringify(loggedArgs);
      expect(loggedText).not.toContain('sk-should-never-be-logged');
      expect(loggedText).not.toContain('should-never-be-logged-either');
      expect(loggedText).not.toContain('authorization');
      // Exactly the safe summary shape -- never the raw Error object itself.
      expect(loggedArgs).toContainEqual({ name: 'Error', message: 'insert failed: connection reset' });

      consoleErrorSpy.mockRestore();
    });

    it('an unexpected (non-AIProviderError) failure anywhere in the handler logs only a safe {name, message} summary, never the raw object, and still returns a generic 500', async () => {
      const sensitiveLeak = Object.assign(new Error('unexpected downstream failure'), {
        headers: { authorization: 'Bearer sk-should-never-be-logged-2' },
        requestBody: { secret: 'also-should-never-be-logged' },
      });
      rateLimitShouldThrow = sensitiveLeak;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { POST } = await import('@/app/api/ai/business-assistant/route');
      const res = await POST(makeRequest(validBody));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Internal server error'); // never the raw/internal message leaked to the client either

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedText = JSON.stringify(consoleErrorSpy.mock.calls.flat());
      expect(loggedText).not.toContain('sk-should-never-be-logged-2');
      expect(loggedText).not.toContain('also-should-never-be-logged');
      expect(loggedText).not.toContain('authorization');
      expect(loggedText).toContain('unexpected downstream failure'); // useful diagnostic info is preserved

      consoleErrorSpy.mockRestore();
    });
  });
});
