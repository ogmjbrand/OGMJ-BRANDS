import { describe, expect, it, vi, beforeEach } from 'vitest';

// vi.mock factories are hoisted above all other top-level code in this
// file, including plain `class` declarations -- vi.hoisted() is the
// supported way to define values a factory needs without hitting a
// temporal-dead-zone ReferenceError at hoist time.
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

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    static APIError = MockAPIError;
    static AuthenticationError = MockAuthenticationError;
    static RateLimitError = MockRateLimitError;
    static BadRequestError = MockBadRequestError;
    static APIConnectionTimeoutError = MockAPIConnectionTimeoutError;
  }
  return { default: MockAnthropic };
});

let aiConfigured = true;
let createResponse: unknown = { content: [{ type: 'text', text: 'Hello from Claude' }], usage: { input_tokens: 20, output_tokens: 8 } };
let createShouldThrow: Error | null = null;
let createCalls: unknown[] = [];

vi.mock('@/lib/ai/anthropic', () => ({
  AI_MODEL: 'claude-sonnet-5-5',
  isAIConfigured: () => aiConfigured,
  getAnthropicClient: () => ({
    messages: {
      create: async (params: unknown) => {
        createCalls.push(params);
        if (createShouldThrow) throw createShouldThrow;
        return createResponse;
      },
    },
  }),
}));

import { anthropicProvider } from '@/lib/ai/providers/anthropicProvider';
import { AIProviderError } from '@/lib/ai/providers/types';

beforeEach(() => {
  aiConfigured = true;
  createResponse = { content: [{ type: 'text', text: 'Hello from Claude' }], usage: { input_tokens: 20, output_tokens: 8 } };
  createShouldThrow = null;
  createCalls = [];
});

describe('anthropicProvider', () => {
  it('reuses the existing client/model/isAIConfigured from lib/ai/anthropic rather than constructing its own', async () => {
    const result = await anthropicProvider.complete({ messages: [{ role: 'user', content: 'hi' }] });
    expect(result.model).toBe('claude-sonnet-5-5');
    expect(result.provider).toBe('anthropic');
  });

  it('throws AIProviderError("not_configured") without ever calling the client when ANTHROPIC_API_KEY is absent', async () => {
    aiConfigured = false;
    await expect(anthropicProvider.complete({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow(AIProviderError);
    expect(createCalls).toHaveLength(0);
  });

  it('passes system/messages/max_tokens through and returns real usage + concatenated text blocks', async () => {
    createResponse = {
      content: [
        { type: 'text', text: 'Part one. ' },
        { type: 'text', text: 'Part two.' },
      ],
      usage: { input_tokens: 15, output_tokens: 6 },
    };
    const result = await anthropicProvider.complete({ system: 'Be concise.', messages: [{ role: 'user', content: 'Explain X' }], maxOutputTokens: 200 });
    expect(result.text).toBe('Part one. Part two.');
    expect(result.usage).toEqual({ inputTokens: 15, outputTokens: 6 });

    const call = createCalls[0] as { system: string; max_tokens: number; messages: unknown[] };
    expect(call.system).toBe('Be concise.');
    expect(call.max_tokens).toBe(200);
    expect(call.messages).toEqual([{ role: 'user', content: 'Explain X' }]);
  });

  it('ignores non-text content blocks when concatenating response text', async () => {
    createResponse = {
      content: [
        { type: 'tool_use', id: 'x', name: 'y', input: {} },
        { type: 'text', text: 'Only this counts.' },
      ],
      usage: { input_tokens: 1, output_tokens: 1 },
    };
    const result = await anthropicProvider.complete({ messages: [{ role: 'user', content: 'hi' }] });
    expect(result.text).toBe('Only this counts.');
  });

  it('maps an authentication error to AIProviderError("authentication")', async () => {
    createShouldThrow = new MockAuthenticationError('bad key', 401);
    await expect(anthropicProvider.complete({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toMatchObject({ kind: 'authentication' });
  });

  it('maps a rate-limit error to AIProviderError("rate_limited")', async () => {
    createShouldThrow = new MockRateLimitError('slow down', 429);
    await expect(anthropicProvider.complete({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toMatchObject({ kind: 'rate_limited' });
  });

  it('maps an unrecognized error to AIProviderError("provider_error") rather than throwing it raw', async () => {
    createShouldThrow = new Error('weird failure');
    await expect(anthropicProvider.complete({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow(AIProviderError);
  });
});
