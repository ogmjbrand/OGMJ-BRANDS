import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

/**
 * Mocks the `openai` package entirely -- no real network call, no paid
 * API usage. Real Error subclasses (not plain objects) so `instanceof`
 * checks in openaiProvider.ts's mapOpenAIError actually match, exactly
 * like the real SDK's error hierarchy. Declared via vi.hoisted() since
 * vi.mock factories are hoisted above plain top-level `class`
 * declarations -- referencing one directly here would hit a temporal-
 * dead-zone ReferenceError depending on how/when this module graph
 * happens to resolve.
 */
const { MockAPIError, MockAuthenticationError, MockRateLimitError, MockBadRequestError, MockAPIConnectionTimeoutError } = vi.hoisted(() => {
  class MockAPIError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.status = status;
    }
  }
  class MockAuthenticationError extends MockAPIError {}
  class MockRateLimitError extends MockAPIError {}
  class MockBadRequestError extends MockAPIError {}
  class MockAPIConnectionTimeoutError extends MockAPIError {}
  return { MockAPIError, MockAuthenticationError, MockRateLimitError, MockBadRequestError, MockAPIConnectionTimeoutError };
});

let createResponse: unknown = { output_text: 'Hello from OpenAI', usage: { input_tokens: 10, output_tokens: 5 } };
let createShouldThrow: Error | null = null;
let createCalls: unknown[] = [];

vi.mock('openai', () => {
  class MockOpenAI {
    static APIError = MockAPIError;
    static AuthenticationError = MockAuthenticationError;
    static RateLimitError = MockRateLimitError;
    static BadRequestError = MockBadRequestError;
    static APIConnectionTimeoutError = MockAPIConnectionTimeoutError;
    responses = {
      create: async (params: unknown) => {
        createCalls.push(params);
        if (createShouldThrow) throw createShouldThrow;
        return createResponse;
      },
    };
  }
  return { default: MockOpenAI };
});

const originalEnv = { ...process.env };

beforeEach(() => {
  createResponse = { output_text: 'Hello from OpenAI', usage: { input_tokens: 10, output_tokens: 5 } };
  createShouldThrow = null;
  createCalls = [];
  process.env = { ...originalEnv, OPENAI_API_KEY: 'sk-test-not-a-real-key' };
  delete process.env.OPENAI_MODEL;
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('openaiProvider.isConfigured', () => {
  it('reflects OPENAI_API_KEY presence without ever reading its value into a returned result', async () => {
    const { openaiProvider } = await import('@/lib/ai/providers/openaiProvider');
    expect(openaiProvider.isConfigured()).toBe(true);
    delete process.env.OPENAI_API_KEY;
    expect(openaiProvider.isConfigured()).toBe(false);
  });
});

describe('openaiProvider.complete', () => {
  it('throws AIProviderError("not_configured") without ever calling the SDK when no key is set', async () => {
    delete process.env.OPENAI_API_KEY;
    const { openaiProvider } = await import('@/lib/ai/providers/openaiProvider');
    const { AIProviderError } = await import('@/lib/ai/providers/types');
    await expect(openaiProvider.complete({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow(AIProviderError);
    expect(createCalls).toHaveLength(0);
  });

  it('calls the Responses API (responses.create) with model/instructions/input, and returns real usage + text', async () => {
    const { openaiProvider } = await import('@/lib/ai/providers/openaiProvider');
    const result = await openaiProvider.complete({ system: 'Be helpful.', messages: [{ role: 'user', content: 'Say hi' }], maxOutputTokens: 100 });
    expect(result.text).toBe('Hello from OpenAI');
    expect(result.provider).toBe('openai');
    expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 5 });
    expect(result.model).toBe('gpt-4o-mini'); // default model
    expect(result.costUsd).not.toBeNull();

    const call = createCalls[0] as { instructions: string; input: string; max_output_tokens: number };
    expect(call.instructions).toBe('Be helpful.');
    expect(call.input).toContain('Say hi');
    expect(call.max_output_tokens).toBe(100);
  });

  it('respects OPENAI_MODEL override', async () => {
    process.env.OPENAI_MODEL = 'gpt-4o';
    const { openaiProvider } = await import('@/lib/ai/providers/openaiProvider');
    const result = await openaiProvider.complete({ messages: [{ role: 'user', content: 'hi' }] });
    expect(result.model).toBe('gpt-4o');
  });

  it('maps an authentication error to AIProviderError("authentication")', async () => {
    createShouldThrow = new MockAuthenticationError('bad key', 401);
    const { openaiProvider } = await import('@/lib/ai/providers/openaiProvider');
    const { AIProviderError } = await import('@/lib/ai/providers/types');
    await expect(openaiProvider.complete({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow(AIProviderError);
    await expect(openaiProvider.complete({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toMatchObject({ kind: 'authentication' });
  });

  it('maps a rate-limit error to AIProviderError("rate_limited")', async () => {
    createShouldThrow = new MockRateLimitError('slow down', 429);
    const { openaiProvider } = await import('@/lib/ai/providers/openaiProvider');
    await expect(openaiProvider.complete({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toMatchObject({ kind: 'rate_limited' });
  });

  it('maps a bad-request error to AIProviderError("invalid_request")', async () => {
    createShouldThrow = new MockBadRequestError('nope', 400);
    const { openaiProvider } = await import('@/lib/ai/providers/openaiProvider');
    await expect(openaiProvider.complete({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toMatchObject({ kind: 'invalid_request' });
  });

  it('maps a timeout error to AIProviderError("timeout")', async () => {
    createShouldThrow = new MockAPIConnectionTimeoutError('timed out');
    const { openaiProvider } = await import('@/lib/ai/providers/openaiProvider');
    await expect(openaiProvider.complete({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toMatchObject({ kind: 'timeout' });
  });

  it('maps an unrecognized SDK error to AIProviderError("provider_error") rather than throwing it raw', async () => {
    createShouldThrow = new Error('something unexpected');
    const { openaiProvider } = await import('@/lib/ai/providers/openaiProvider');
    const { AIProviderError } = await import('@/lib/ai/providers/types');
    await expect(openaiProvider.complete({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow(AIProviderError);
  });

  it('never logs or includes the API key value anywhere in a successful result', async () => {
    const { openaiProvider } = await import('@/lib/ai/providers/openaiProvider');
    const result = await openaiProvider.complete({ messages: [{ role: 'user', content: 'hi' }] });
    expect(JSON.stringify(result)).not.toContain('sk-test-not-a-real-key');
  });
});
