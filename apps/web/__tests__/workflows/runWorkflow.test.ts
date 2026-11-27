import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMock = vi.fn();
vi.mock('@/lib/email/resend', () => ({
  isResendConfigured: () => true,
  getResendClient: () => ({ emails: { send: sendMock } }),
  RESEND_FROM_EMAIL: 'OGMJ BRANDS <notifications@ogmjbrands.com>',
}));

const rateLimitMock = vi.fn();
vi.mock('@/lib/utils/rate-limit', () => ({ checkRateLimit: (opts: unknown) => rateLimitMock(opts) }));

const generateMock = vi.fn();
vi.mock('@/lib/ai/anthropic', () => ({
  AI_MODEL: 'claude-test',
  isAIConfigured: () => true,
  getAnthropicClient: () => ({ messages: { create: (opts: unknown) => generateMock(opts) } }),
}));

const { runWorkflow } = await import('@/lib/workflows/runWorkflow');

/** Minimal chainable Supabase stub: each table has a canned response for its terminal call. */
function makeSupabase(responses: Record<string, { data: unknown; error?: unknown }>) {
  const inserted: Record<string, unknown[]> = {};
  function chain(table: string) {
    const result = responses[table] ?? { data: null, error: null };
    const builder: any = {
      select: () => builder,
      insert: (payload: unknown) => {
        (inserted[table] ??= []).push(payload);
        return builder;
      },
      update: () => builder,
      eq: () => builder,
      order: () => builder,
      limit: () => builder,
      single: () => Promise.resolve(result),
      maybeSingle: () => Promise.resolve(result),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
    };
    return builder;
  }
  return { from: (table: string) => chain(table), __inserted: inserted };
}

describe('runWorkflow', () => {
  beforeEach(() => {
    sendMock.mockReset().mockResolvedValue({ data: { id: 'email-1' }, error: null });
    rateLimitMock.mockReset().mockResolvedValue({ allowed: true });
    generateMock.mockReset().mockResolvedValue({ content: [{ type: 'text', text: 'Generated caption' }] });
  });

  it('returns 404 when the workflow does not exist', async () => {
    const supabase = makeSupabase({ workflows: { data: null, error: { message: 'not found' } } });
    const result = await runWorkflow(supabase, 'user-1', 'wf-1');
    expect(result).toEqual({ ok: false, status: 404, error: 'Workflow not found' });
  });

  it('returns 403 when the user is not a member of the workflow\'s business', async () => {
    const supabase = makeSupabase({
      workflows: { data: { id: 'wf-1', business_id: 'biz-1', actions: [], run_count: 0 } },
      business_users: { data: null },
    });
    const result = await runWorkflow(supabase, 'user-1', 'wf-1');
    expect(result).toEqual({ ok: false, status: 403, error: 'Access denied' });
  });

  it('runs a send_email step for the given contact and logs completion', async () => {
    const supabase = makeSupabase({
      workflows: { data: { id: 'wf-1', business_id: 'biz-1', name: 'Welcome', description: 'Say hi', actions: [{ type: 'send_email', label: 'Send' }], run_count: 2 } },
      business_users: { data: { role: 'owner' } },
      contacts: { data: { id: 'c1', email: 'jane@x.com', first_name: 'Jane', last_name: 'Doe' } },
      workflow_executions: { data: { id: 'exec-1' } },
    });

    const result = await runWorkflow(supabase, 'user-1', 'wf-1', 'c1');
    expect(result).toEqual({ ok: true, executionId: 'exec-1', status: 'completed', steps: 1 });
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: 'jane@x.com', subject: 'Welcome' }));
  });

  it('meters usage for a generate_report step and blocks the run when the limit is hit', async () => {
    rateLimitMock.mockResolvedValueOnce({ allowed: false });
    const supabase = makeSupabase({
      workflows: { data: { id: 'wf-1', business_id: 'biz-1', name: 'Report', description: null, actions: [{ type: 'generate_report', label: 'Report' }], run_count: 0 } },
      business_users: { data: { role: 'owner' } },
    });

    const result = await runWorkflow(supabase, 'user-1', 'wf-1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(429);
  });

  it('also meters usage for a schedule_social_post step (regression: this action calls the model too)', async () => {
    rateLimitMock.mockResolvedValueOnce({ allowed: false });
    const supabase = makeSupabase({
      workflows: { data: { id: 'wf-1', business_id: 'biz-1', name: 'Social', description: null, actions: [{ type: 'schedule_social_post', label: 'Post' }], run_count: 0 } },
      business_users: { data: { role: 'owner' } },
    });

    const result = await runWorkflow(supabase, 'user-1', 'wf-1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(429);
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('marks the execution failed when a step fails, but still returns ok with status "failed"', async () => {
    const supabase = makeSupabase({
      workflows: { data: { id: 'wf-1', business_id: 'biz-1', name: 'Welcome', description: null, actions: [{ type: 'send_email', label: 'Send' }], run_count: 0 } },
      business_users: { data: { role: 'owner' } },
      contacts: { data: { id: 'c1', email: 'jane@x.com', first_name: 'Jane', last_name: null } },
      workflow_executions: { data: { id: 'exec-1' } },
    });
    sendMock.mockResolvedValueOnce({ data: null, error: { message: 'Resend rejected it' } });

    const result = await runWorkflow(supabase, 'user-1', 'wf-1', 'c1');
    expect(result).toEqual({ ok: true, executionId: 'exec-1', status: 'failed', steps: 1 });
  });
});
