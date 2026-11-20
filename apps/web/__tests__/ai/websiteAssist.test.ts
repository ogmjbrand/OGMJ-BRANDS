import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DEFAULT_BREAKPOINTS, DEFAULT_TOKEN_SET } from '@/lib/document-model/tokens';
import type { DocumentRoot } from '@/lib/document-model/types';

let aiConfigured = true;
let createResponseText = '';
let createShouldThrow: Error | null = null;
let createCalls: unknown[] = [];

vi.mock('@/lib/ai/anthropic', () => ({
  isAIConfigured: () => aiConfigured,
  AI_MODEL: 'claude-test-model',
  getAnthropicClient: () => ({
    messages: {
      create: async (params: unknown) => {
        createCalls.push(params);
        if (createShouldThrow) throw createShouldThrow;
        return { content: [{ type: 'text', text: createResponseText }] };
      },
    },
  }),
}));

import { MAX_OPERATIONS_PER_REQUEST, WebsiteAssistError, proposeWebsiteOperations } from '@/lib/ai/websiteAssist';

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

  it('surfaces a rate-limit error with a clear message', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    createShouldThrow = new Anthropic.RateLimitError(429, {}, 'rate limited', new Headers());
    await expect(proposeWebsiteOperations('x', emptyDocument())).rejects.toThrow(/rate limit/i);
  });
});
