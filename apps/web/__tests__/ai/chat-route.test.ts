import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let currentUser: { id: string; email: string } | null = { id: 'user-1', email: 'user@example.com' };

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () =>
    Promise.resolve({
      auth: { getUser: () => Promise.resolve({ data: { user: currentUser } }) },
    }),
}));

let resolvedBusinessId: string | null = 'biz-1';
let usageLimitResponse: Response | null = null;

vi.mock('@/lib/ai/usage-limits', () => ({
  resolveUserBusinessId: () => Promise.resolve(resolvedBusinessId),
  enforceAIUsageLimit: () => Promise.resolve(usageLimitResponse),
}));

const executeWebsiteEditToolMock = vi.fn(async () => JSON.stringify({ ok: true }));
vi.mock('@/lib/ai/tools/websiteEditTool', () => ({
  // Real tool names matter here: the route decides which executor to call
  // by checking whether a tool_use block's name is in this list.
  WEBSITE_EDIT_TOOLS: [{ name: 'list_websites' }, { name: 'propose_website_edit' }],
  executeWebsiteEditTool: (...args: unknown[]) => executeWebsiteEditToolMock(...args),
}));

const executeCrmToolMock = vi.fn(async () => JSON.stringify({ ok: true }));
vi.mock('@/lib/ai/tools/crmTool', () => ({
  CRM_TOOLS: [
    { name: 'list_crm_contacts' },
    { name: 'create_crm_contact' },
    { name: 'list_crm_deals' },
    { name: 'create_crm_deal' },
    { name: 'update_deal_stage' },
  ],
  executeCrmTool: (...args: unknown[]) => executeCrmToolMock(...args),
}));

const executeWorkflowToolMock = vi.fn(async () => JSON.stringify({ ok: true }));
vi.mock('@/lib/ai/tools/workflowTool', () => ({
  WORKFLOW_TOOLS: [{ name: 'list_workflows' }, { name: 'run_workflow' }],
  executeWorkflowTool: (...args: unknown[]) => executeWorkflowToolMock(...args),
}));

/** A fake Anthropic MessageStream: async-iterates `events`, then resolves `finalMessage()` to `final`. */
function fakeStream(events: Array<{ type: string; delta?: { type: string; text: string } }>, final: { stop_reason: string; content: unknown[] }) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const event of events) yield event;
    },
    finalMessage: async () => final,
    abort: () => {},
  };
}

const streamQueue: ReturnType<typeof fakeStream>[] = [];
const streamCalls: unknown[] = [];

vi.mock('@/lib/ai/anthropic', () => ({
  AI_MODEL: 'claude-test',
  isAIConfigured: () => true,
  buildSystemPrompt: (agent?: string | null) => `system:${agent ?? 'default'}`,
  getAnthropicClient: () => ({
    messages: {
      stream: (opts: unknown) => {
        // Snapshot now: `opts.messages` is the route's own mutable
        // `conversation` array, which keeps growing on later turns -- a
        // bare reference here would show every call's assertions the
        // *final* state of that array, not what was actually sent at
        // call time.
        streamCalls.push(JSON.parse(JSON.stringify(opts)));
        const next = streamQueue.shift();
        if (!next) throw new Error('test ran out of queued fake streams');
        return next;
      },
    },
  }),
}));

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('https://ogmjbrands.com/api/ai/chat', { method: 'POST', body: JSON.stringify(body) });
}

function textDelta(text: string) {
  return { type: 'content_block_delta', delta: { type: 'text_delta', text } };
}

describe('POST /api/ai/chat', () => {
  beforeEach(() => {
    currentUser = { id: 'user-1', email: 'user@example.com' };
    resolvedBusinessId = 'biz-1';
    usageLimitResponse = null;
    streamQueue.length = 0;
    streamCalls.length = 0;
    executeWebsiteEditToolMock.mockClear();
    executeCrmToolMock.mockClear();
    executeWorkflowToolMock.mockClear();
  });

  it('streams a plain text-only answer with a single model turn', async () => {
    streamQueue.push(
      fakeStream(
        [textDelta('Hello'), textDelta(' world')],
        { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Hello world' }] }
      )
    );

    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }] }));
    const text = await res.text();

    expect(text).toBe('Hello world');
    expect(streamCalls).toHaveLength(1);
    expect(executeWebsiteEditToolMock).not.toHaveBeenCalled();
  });

  it('executes a tool call and continues the conversation to a final answer', async () => {
    streamQueue.push(
      fakeStream([], {
        stop_reason: 'tool_use',
        content: [{ type: 'tool_use', id: 'tool-1', name: 'list_websites', input: {} }],
      }),
      fakeStream([textDelta('Done.')], { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Done.' }] })
    );

    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'what websites do I have?' }] }));
    const text = await res.text();

    expect(text).toBe('Done.');
    expect(streamCalls).toHaveLength(2);
    expect(executeWebsiteEditToolMock).toHaveBeenCalledWith(expect.anything(), 'biz-1', 'list_websites', {});
    expect(executeCrmToolMock).not.toHaveBeenCalled();

    // Second call's messages include the tool_result for the first call's tool_use id.
    const secondCallMessages = (streamCalls[1] as { messages: Array<{ role: string; content: unknown }> }).messages;
    const toolResultMessage = secondCallMessages[secondCallMessages.length - 1];
    expect(toolResultMessage.role).toBe('user');
    expect(toolResultMessage.content).toEqual([
      { type: 'tool_result', tool_use_id: 'tool-1', content: JSON.stringify({ ok: true }) },
    ]);
  });

  it('routes a CRM tool_use block to executeCrmTool, with the authenticated user id', async () => {
    streamQueue.push(
      fakeStream([], {
        stop_reason: 'tool_use',
        content: [{ type: 'tool_use', id: 'tool-1', name: 'list_crm_contacts', input: { search: 'jane' } }],
      }),
      fakeStream([textDelta('Found Jane.')], { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Found Jane.' }] })
    );

    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'find jane in my contacts' }] }));
    const text = await res.text();

    expect(text).toBe('Found Jane.');
    expect(executeCrmToolMock).toHaveBeenCalledWith(expect.anything(), 'biz-1', 'user-1', 'list_crm_contacts', { search: 'jane' });
    expect(executeWebsiteEditToolMock).not.toHaveBeenCalled();
    expect(executeWorkflowToolMock).not.toHaveBeenCalled();
  });

  it('routes a workflow tool_use block to executeWorkflowTool, with the authenticated user id', async () => {
    streamQueue.push(
      fakeStream([], {
        stop_reason: 'tool_use',
        content: [{ type: 'tool_use', id: 'tool-1', name: 'run_workflow', input: { workflowId: 'wf-1' } }],
      }),
      fakeStream([textDelta('Ran it.')], { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Ran it.' }] })
    );

    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'run my welcome workflow' }] }));
    const text = await res.text();

    expect(text).toBe('Ran it.');
    expect(executeWorkflowToolMock).toHaveBeenCalledWith(expect.anything(), 'biz-1', 'user-1', 'run_workflow', { workflowId: 'wf-1' });
    expect(executeCrmToolMock).not.toHaveBeenCalled();
    expect(executeWebsiteEditToolMock).not.toHaveBeenCalled();
  });

  it('gives up after MAX_TOOL_TURNS rather than looping forever', async () => {
    for (let i = 0; i < 10; i++) {
      streamQueue.push(
        fakeStream([], {
          stop_reason: 'tool_use',
          content: [{ type: 'tool_use', id: `tool-${i}`, name: 'list_websites', input: {} }],
        })
      );
    }

    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'keep going' }] }));
    const text = await res.text();

    expect(text).toContain('Stopped after several tool calls');
    expect(streamCalls).toHaveLength(4); // MAX_TOOL_TURNS
  });

  it('requires authentication', async () => {
    currentUser = null;
    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }] }));
    expect(res.status).toBe(401);
  });

  it('requires a business before using OGMJ AI', async () => {
    resolvedBusinessId = null;
    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }] }));
    expect(res.status).toBe(403);
    expect(streamCalls).toHaveLength(0);
  });

  it('returns the usage-limit response directly without ever calling the model', async () => {
    usageLimitResponse = new Response(JSON.stringify({ error: 'rate limited' }), { status: 429 });
    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }] }));
    expect(res.status).toBe(429);
    expect(streamCalls).toHaveLength(0);
  });
});
