import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DEFAULT_BREAKPOINTS, DEFAULT_TOKEN_SET } from '@/lib/document-model/tokens';
import type { DocumentRoot } from '@/lib/document-model/types';

let currentUser: { id: string; email: string } | null = { id: 'user-1', email: 'user@example.com' };
let websiteRow: { business_id: string } | null = { business_id: 'biz-1' };
let accessCheckResult: { data: unknown; error: unknown } = { data: { role: 'owner' }, error: null };

vi.mock('@/lib/auth.server', () => ({
  getCurrentUserServer: () => Promise.resolve(currentUser),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () =>
    Promise.resolve({
      from(table: string) {
        if (table === 'websites') {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            async single() {
              return { data: websiteRow, error: null };
            },
          };
        }
        if (table === 'business_users') {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            async single() {
              return accessCheckResult;
            },
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    }),
}));

let proposeResult: unknown = { explanation: 'Added a heading.', operations: [{ op: 'insertNode' }], rejected: [] };
let proposeShouldThrow: Error | null = null;

vi.mock('@/lib/ai/websiteAssist', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/websiteAssist')>('@/lib/ai/websiteAssist');
  return {
    ...actual,
    proposeWebsiteOperations: async () => {
      if (proposeShouldThrow) throw proposeShouldThrow;
      return proposeResult;
    },
  };
});

function sampleDocument(): DocumentRoot {
  return {
    root: { id: 'root', kind: 'root', children: [] },
    tokenSetId: DEFAULT_TOKEN_SET.id,
    breakpoints: DEFAULT_BREAKPOINTS,
    components: {},
    assets: {},
  };
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('https://ogmjbrands.com/api/ai/website-assist', { method: 'POST', body: JSON.stringify(body) });
}

describe('POST /api/ai/website-assist', () => {
  beforeEach(() => {
    currentUser = { id: 'user-1', email: 'user@example.com' };
    websiteRow = { business_id: 'biz-1' };
    accessCheckResult = { data: { role: 'owner' }, error: null };
    proposeResult = { explanation: 'Added a heading.', operations: [{ op: 'insertNode' }], rejected: [] };
    proposeShouldThrow = null;
  });

  it('returns the proposed operations for an authorized request', async () => {
    const { POST } = await import('@/app/api/ai/website-assist/route');
    const res = await POST(makeRequest({ websiteId: '11111111-1111-1111-1111-111111111111', instruction: 'add a hero', document: sampleDocument() }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.explanation).toBe('Added a heading.');
  });

  it('requires authentication', async () => {
    currentUser = null;
    const { POST } = await import('@/app/api/ai/website-assist/route');
    const res = await POST(makeRequest({ websiteId: '11111111-1111-1111-1111-111111111111', instruction: 'x', document: sampleDocument() }));
    expect(res.status).toBe(401);
  });

  it('rejects an invalid request body (bad document shape) before ever calling the AI', async () => {
    const { POST } = await import('@/app/api/ai/website-assist/route');
    const res = await POST(makeRequest({ websiteId: '11111111-1111-1111-1111-111111111111', instruction: 'x', document: { not: 'a real document' } }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when the website does not exist', async () => {
    websiteRow = null;
    const { POST } = await import('@/app/api/ai/website-assist/route');
    const res = await POST(makeRequest({ websiteId: '11111111-1111-1111-1111-111111111111', instruction: 'x', document: sampleDocument() }));
    expect(res.status).toBe(404);
  });

  it('enforces business membership/ownership access control', async () => {
    accessCheckResult = { data: null, error: null };
    const { POST } = await import('@/app/api/ai/website-assist/route');
    const res = await POST(makeRequest({ websiteId: '11111111-1111-1111-1111-111111111111', instruction: 'x', document: sampleDocument() }));
    expect(res.status).toBe(403);
  });

  it('surfaces a WebsiteAssistError as a 422 with its message, not a generic 500', async () => {
    const { WebsiteAssistError } = await import('@/lib/ai/websiteAssist');
    proposeShouldThrow = new WebsiteAssistError('AI is not configured on this deployment (ANTHROPIC_API_KEY is not set).');
    const { POST } = await import('@/app/api/ai/website-assist/route');
    const res = await POST(makeRequest({ websiteId: '11111111-1111-1111-1111-111111111111', instruction: 'x', document: sampleDocument() }));
    const body = await res.json();
    expect(res.status).toBe(422);
    expect(body.error).toContain('ANTHROPIC_API_KEY');
  });

  it('an unexpected (non-WebsiteAssistError) failure logs only a safe {name, message} summary, never the raw object, and returns a generic 500', async () => {
    const sensitiveLeak = Object.assign(new Error('unexpected downstream failure'), {
      headers: { authorization: 'Bearer sk-should-never-be-logged' },
      requestBody: { secret: 'also-should-never-be-logged' },
    });
    proposeShouldThrow = sensitiveLeak;

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { POST } = await import('@/app/api/ai/website-assist/route');
    const res = await POST(makeRequest({ websiteId: '11111111-1111-1111-1111-111111111111', instruction: 'x', document: sampleDocument() }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Internal server error'); // raw/internal message never leaked to the client either

    expect(consoleErrorSpy).toHaveBeenCalled();
    const loggedText = JSON.stringify(consoleErrorSpy.mock.calls.flat());
    expect(loggedText).not.toContain('sk-should-never-be-logged');
    expect(loggedText).not.toContain('also-should-never-be-logged');
    expect(loggedText).not.toContain('authorization');
    expect(loggedText).toContain('unexpected downstream failure'); // useful diagnostic info is preserved
    expect(loggedText).toContain('Error'); // the safe {name, message} shape, never the raw object

    consoleErrorSpy.mockRestore();
  });
});
