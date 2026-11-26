import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DEFAULT_BREAKPOINTS, DEFAULT_TOKEN_SET } from '@/lib/document-model/tokens';
import type { DocumentRoot } from '@/lib/document-model/types';

let aiConfigured = true;
let createResponseText = '';
let createShouldThrow: Error | null = null;
let createCalls: unknown[] = [];
/**
 * A queue of per-call outcomes, consumed in order -- lets a test simulate
 * "fails N times, then succeeds" for the retry suite below. When empty,
 * `create()` falls back to the single-shot `createShouldThrow`/
 * `createResponseText` pair every pre-existing test in this file already
 * uses, so none of them needed to change.
 */
let createOutcomes: Array<{ throws: Error } | { text: string }> = [];

vi.mock('@/lib/ai/anthropic', () => ({
  isAIConfigured: () => aiConfigured,
  AI_MODEL: 'claude-test-model',
  getAnthropicClient: () => ({
    messages: {
      create: async (params: unknown) => {
        createCalls.push(params);
        if (createOutcomes.length > 0) {
          const outcome = createOutcomes.shift()!;
          if ('throws' in outcome) throw outcome.throws;
          return { content: [{ type: 'text', text: outcome.text }] };
        }
        if (createShouldThrow) throw createShouldThrow;
        return { content: [{ type: 'text', text: createResponseText }] };
      },
    },
  }),
}));

import { MAX_OPERATIONS_PER_REQUEST, WebsiteAssistError, proposeWebsiteOperations } from '@/lib/ai/websiteAssist';
import { MAX_ATTEMPTS } from '@/lib/ai/retry';

/** proposeWebsiteOperations' retry observers, with a no-op sleep so retry tests run instantly rather than waiting out real exponential backoff. */
const noWait = { sleep: async () => {} };

function emptyDocument(): DocumentRoot {
  return {
    root: { id: 'root', kind: 'root', children: [{ id: 'section-1', kind: 'section', children: [] }] },
    tokenSetId: DEFAULT_TOKEN_SET.id,
    breakpoints: DEFAULT_BREAKPOINTS,
    components: {},
    assets: {},
  };
}

beforeEach(() => {
  aiConfigured = true;
  createResponseText = '';
  createShouldThrow = null;
  createCalls = [];
  createOutcomes = [];
});

describe('proposeWebsiteOperations', () => {
  it('throws when AI is not configured, without ever calling the model', async () => {
    aiConfigured = false;
    await expect(proposeWebsiteOperations('add a hero', emptyDocument())).rejects.toThrow(WebsiteAssistError);
    expect(createCalls).toHaveLength(0);
  });

  it('rejects an empty instruction without ever calling the model', async () => {
    await expect(proposeWebsiteOperations('   ', emptyDocument())).rejects.toThrow('must not be empty');
    expect(createCalls).toHaveLength(0);
  });

  it('parses a well-formed JSON response into validated operations', async () => {
    createResponseText = JSON.stringify({
      explanation: 'Adding a heading.',
      operations: [{ op: 'insertNode', parentId: 'section-1', index: 0, node: { id: 'h1', kind: 'heading', text: 'Welcome', level: 1 } }],
    });
    const result = await proposeWebsiteOperations('add a welcome heading', emptyDocument());
    expect(result.explanation).toBe('Adding a heading.');
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].op).toBe('insertNode');
    expect(result.rejected).toHaveLength(0);
  });

  it('strips a markdown code fence around the JSON if the model adds one anyway', async () => {
    createResponseText = '```json\n' + JSON.stringify({ explanation: 'x', operations: [] }) + '\n```';
    const result = await proposeWebsiteOperations('do nothing', emptyDocument());
    expect(result.explanation).toBe('x');
  });

  it('throws a clear error on genuinely unparseable output, rather than crashing', async () => {
    createResponseText = 'not json at all, sorry';
    await expect(proposeWebsiteOperations('add something', emptyDocument())).rejects.toThrow('not valid JSON');
  });

  it('separates INVALID proposed operations into `rejected` rather than throwing or silently dropping them', async () => {
    createResponseText = JSON.stringify({
      explanation: 'Mixed batch.',
      operations: [
        { op: 'insertNode', parentId: 'section-1', index: 0, node: { id: 'h1', kind: 'heading', text: 'Good', level: 1 } },
        { op: 'removeNode', nodeId: '__proto__' }, // unsafe id
        { op: 'totally-made-up-op', nodeId: 'x' }, // unknown op
      ],
    });
    const result = await proposeWebsiteOperations('mixed instruction', emptyDocument());
    expect(result.operations).toHaveLength(1);
    expect(result.rejected).toHaveLength(2);
    expect(result.rejected.every((r) => r.reason.length > 0)).toBe(true);
  });

  it(`refuses the WHOLE batch (not a truncated prefix) when the model proposes more than ${MAX_OPERATIONS_PER_REQUEST} operations`, async () => {
    const tooMany = Array.from({ length: MAX_OPERATIONS_PER_REQUEST + 1 }, (_, i) => ({ op: 'removeNode', nodeId: `n${i}` }));
    createResponseText = JSON.stringify({ explanation: 'huge batch', operations: tooMany });
    await expect(proposeWebsiteOperations('do a lot', emptyDocument())).rejects.toThrow(/operation limit/);
  });

  it('refuses a document that is too large to send to the AI in one request', async () => {
    const huge: DocumentRoot = emptyDocument();
    (huge.root.children[0] as { children: unknown[] }).children = Array.from({ length: 5000 }, (_, i) => ({ id: `n${i}`, kind: 'text', text: 'x'.repeat(100) }));
    await expect(proposeWebsiteOperations('anything', huge)).rejects.toThrow(/too large/);
    expect(createCalls).toHaveLength(0);
  });

  it('sends the instruction and the serialized current document to the model', async () => {
    createResponseText = JSON.stringify({ explanation: 'x', operations: [] });
    await proposeWebsiteOperations('add a footer', emptyDocument());
    const call = createCalls[0] as { messages: Array<{ content: string }> };
    expect(call.messages[0].content).toContain('add a footer');
    expect(call.messages[0].content).toContain('section-1');
  });

  it('surfaces a rate-limit error with a clear message, after retrying it the full attempt budget', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    createShouldThrow = new Anthropic.RateLimitError(429, {}, 'rate limited', new Headers());
    await expect(proposeWebsiteOperations('x', emptyDocument(), noWait)).rejects.toThrow(/rate limit/i);
    expect(createCalls).toHaveLength(MAX_ATTEMPTS);
  });

  it('classifies a connection-timeout error explicitly as a clear "timed out" WebsiteAssistError, consistent with lib/ai/providers/anthropicProvider.ts, after retrying it', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    createShouldThrow = new Anthropic.APIConnectionTimeoutError({ message: 'timed out' });
    await expect(proposeWebsiteOperations('x', emptyDocument(), noWait)).rejects.toThrow(WebsiteAssistError);
    createShouldThrow = new Anthropic.APIConnectionTimeoutError({ message: 'timed out' });
    await expect(proposeWebsiteOperations('x', emptyDocument(), noWait)).rejects.toThrow(/timed out/i);
  });

  it('REGRESSION: surfaces the Anthropic API error body (e.g. a billing/credit-balance 400) instead of a bare status code', async () => {
    // Previously this branch discarded everything but `error.status`,
    // throwing just "AI request failed (400)." for every possible 400 --
    // indistinguishable from a malformed request, and with nothing logged
    // server-side to tell them apart after the fact either. The SDK's own
    // error.message already includes the body detail (e.g. Anthropic's
    // "Your credit balance is too low to access the Claude API."), so this
    // asserts that detail actually reaches the caller now.
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    createShouldThrow = new Anthropic.APIError(
      400,
      { error: { type: 'invalid_request_error', message: 'Your credit balance is too low to access the Claude API.' } },
      'Your credit balance is too low to access the Claude API.',
      new Headers()
    );
    await expect(proposeWebsiteOperations('x', emptyDocument())).rejects.toThrow(WebsiteAssistError);
    await expect(proposeWebsiteOperations('x', emptyDocument())).rejects.toThrow(/credit balance is too low/i);
  });
});

describe('proposeWebsiteOperations retry policy', () => {
  it('a temporary failure (5xx) followed by success retries exactly once and returns the successful result', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    createOutcomes = [
      { throws: new Anthropic.APIError(503, { error: { message: 'overloaded' } }, 'overloaded', new Headers()) },
      { text: JSON.stringify({ explanation: 'recovered', operations: [] }) },
    ];
    const result = await proposeWebsiteOperations('add a footer', emptyDocument(), noWait);
    expect(result.explanation).toBe('recovered');
    expect(result.attemptsUsed).toBe(2);
    expect(createCalls).toHaveLength(2);
  });

  it('multiple temporary failures (429 then 503) followed by success retries up to the attempt cap and returns the successful result', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    createOutcomes = [
      { throws: new Anthropic.RateLimitError(429, {}, 'rate limited', new Headers()) },
      { throws: new Anthropic.APIError(503, { error: { message: 'overloaded' } }, 'overloaded', new Headers()) },
      { text: JSON.stringify({ explanation: 'recovered on the last allowed attempt', operations: [] }) },
    ];
    const result = await proposeWebsiteOperations('add a footer', emptyDocument(), noWait);
    expect(result.explanation).toBe('recovered on the last allowed attempt');
    expect(result.attemptsUsed).toBe(MAX_ATTEMPTS);
    expect(createCalls).toHaveLength(MAX_ATTEMPTS);
  });

  it(`REGRESSION: exhausts retries after exactly ${MAX_ATTEMPTS} attempts and surfaces the real Anthropic error detail, not a bare status code`, async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    createShouldThrow = new Anthropic.APIError(500, { error: { message: 'internal error, please try again' } }, 'internal error, please try again', new Headers());
    await expect(proposeWebsiteOperations('x', emptyDocument(), noWait)).rejects.toThrow(/internal error, please try again/i);
    expect(createCalls).toHaveLength(MAX_ATTEMPTS);
  });

  it('REGRESSION: a 429 with a Retry-After header is retried and honors that exact delay instead of the computed backoff', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    createOutcomes = [
      { throws: new Anthropic.RateLimitError(429, {}, 'rate limited', new Headers({ 'retry-after': '5' })) },
      { text: JSON.stringify({ explanation: 'ok', operations: [] }) },
    ];
    const sleepCalls: number[] = [];
    const result = await proposeWebsiteOperations('x', emptyDocument(), {
      sleep: async (ms) => {
        sleepCalls.push(ms);
      },
    });
    expect(result.explanation).toBe('ok');
    expect(sleepCalls).toEqual([5000]);
  });

  it('REGRESSION: a 400 insufficient-credit error is never retried and says billing must be resolved first', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    createShouldThrow = new Anthropic.APIError(
      400,
      { error: { message: 'Your credit balance is too low to access the Claude API.' } },
      'Your credit balance is too low to access the Claude API.',
      new Headers()
    );
    await expect(proposeWebsiteOperations('x', emptyDocument(), noWait)).rejects.toThrow(/resolve it in the anthropic console/i);
    expect(createCalls).toHaveLength(1); // no retry attempted at all -- this is a permanent failure, not a transient one
  });

  it('REGRESSION: a 401 (authentication) is never retried', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    createShouldThrow = new Anthropic.AuthenticationError(401, {}, 'invalid key', new Headers());
    await expect(proposeWebsiteOperations('x', emptyDocument(), noWait)).rejects.toThrow(/invalid anthropic_api_key/i);
    expect(createCalls).toHaveLength(1);
  });

  it('REGRESSION: a 403 (permission denied) is never retried', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    createShouldThrow = new Anthropic.PermissionDeniedError(403, {}, 'forbidden', new Headers());
    await expect(proposeWebsiteOperations('x', emptyDocument(), noWait)).rejects.toThrow(WebsiteAssistError);
    expect(createCalls).toHaveLength(1);
  });

  it('REGRESSION: a network failure (no response ever received) is retried and recovers', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    createOutcomes = [
      { throws: new Anthropic.APIConnectionError({ message: 'ECONNRESET' }) },
      { text: JSON.stringify({ explanation: 'ok after reconnect', operations: [] }) },
    ];
    const result = await proposeWebsiteOperations('x', emptyDocument(), noWait);
    expect(result.explanation).toBe('ok after reconnect');
    expect(result.attemptsUsed).toBe(2);
  });

  it('REGRESSION: never makes more than MAX_ATTEMPTS calls no matter how many times the model fails -- bounded retry cost, no runaway billing', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    createShouldThrow = new Anthropic.APIError(502, { error: { message: 'bad gateway' } }, 'bad gateway', new Headers());
    await expect(proposeWebsiteOperations('x', emptyDocument(), noWait)).rejects.toThrow();
    expect(createCalls.length).toBeLessThanOrEqual(MAX_ATTEMPTS);
    expect(createCalls).toHaveLength(MAX_ATTEMPTS);
  });

  it('REGRESSION: a successful first attempt never retries, so applying its proposal can never double-generate or double-bill', async () => {
    createResponseText = JSON.stringify({ explanation: 'single shot', operations: [] });
    const result = await proposeWebsiteOperations('x', emptyDocument(), noWait);
    expect(result.attemptsUsed).toBe(1);
    expect(createCalls).toHaveLength(1);
  });
});
