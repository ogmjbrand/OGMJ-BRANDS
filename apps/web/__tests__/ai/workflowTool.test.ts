import { describe, it, expect, vi, beforeEach } from 'vitest';

let runWorkflowResult: unknown = { ok: true, executionId: 'exec-1', status: 'completed', steps: 2 };
const runWorkflowMock = vi.fn(async () => runWorkflowResult);
vi.mock('@/lib/workflows/runWorkflow', () => ({
  runWorkflow: (...args: unknown[]) => runWorkflowMock(...args),
}));

const { executeWorkflowTool } = await import('@/lib/ai/tools/workflowTool');

function makeSupabase(responses: Record<string, { data: unknown; error?: unknown }>) {
  function chain(table: string) {
    const result = responses[table] ?? { data: null, error: null };
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      order: () => builder,
      limit: () => Promise.resolve(result),
      single: () => Promise.resolve(result),
    };
    return builder;
  }
  return { from: (table: string) => chain(table) };
}

describe('executeWorkflowTool', () => {
  beforeEach(() => {
    runWorkflowResult = { ok: true, executionId: 'exec-1', status: 'completed', steps: 2 };
    runWorkflowMock.mockClear();
  });

  it('list_workflows returns the business workflows with a derived step count', async () => {
    const supabase = makeSupabase({
      workflows: {
        data: [{ id: 'wf-1', name: 'Welcome', description: 'Says hi', actions: [{ type: 'send_email' }, { type: 'add_crm_note' }], run_count: 3, last_run_at: '2026-01-01' }],
      },
    });
    const result = JSON.parse(await executeWorkflowTool(supabase, 'biz-1', 'user-1', 'list_workflows', {}));
    expect(result.workflows).toEqual([
      { id: 'wf-1', name: 'Welcome', description: 'Says hi', stepCount: 2, runCount: 3, lastRunAt: '2026-01-01' },
    ]);
  });

  it('run_workflow requires a workflowId', async () => {
    const supabase = makeSupabase({});
    const result = JSON.parse(await executeWorkflowTool(supabase, 'biz-1', 'user-1', 'run_workflow', {}));
    expect(result.error).toMatch(/required/i);
    expect(runWorkflowMock).not.toHaveBeenCalled();
  });

  it('run_workflow refuses a workflow belonging to a different business, without ever calling runWorkflow', async () => {
    const supabase = makeSupabase({ workflows: { data: { business_id: 'OTHER-BUSINESS' } } });
    const result = JSON.parse(await executeWorkflowTool(supabase, 'biz-1', 'user-1', 'run_workflow', { workflowId: 'wf-1' }));
    expect(result.error).toBe('Workflow not found.');
    expect(runWorkflowMock).not.toHaveBeenCalled();
  });

  it('run_workflow runs the workflow and reports the outcome', async () => {
    const supabase = makeSupabase({ workflows: { data: { business_id: 'biz-1' } } });
    const result = JSON.parse(
      await executeWorkflowTool(supabase, 'biz-1', 'user-1', 'run_workflow', { workflowId: 'wf-1', contactId: 'c1' })
    );
    expect(runWorkflowMock).toHaveBeenCalledWith(supabase, 'user-1', 'wf-1', 'c1');
    expect(result.executionId).toBe('exec-1');
    expect(result.status).toBe('completed');
    expect(result.stepsRun).toBe(2);
  });

  it('run_workflow surfaces a runWorkflow failure as a plain {error}', async () => {
    runWorkflowResult = { ok: false, status: 403, error: 'Access denied' };
    const supabase = makeSupabase({ workflows: { data: { business_id: 'biz-1' } } });
    const result = JSON.parse(await executeWorkflowTool(supabase, 'biz-1', 'user-1', 'run_workflow', { workflowId: 'wf-1' }));
    expect(result.error).toBe('Access denied');
  });

  it('reports an unknown tool name as an error rather than throwing', async () => {
    const supabase = makeSupabase({});
    const result = JSON.parse(await executeWorkflowTool(supabase, 'biz-1', 'user-1', 'delete_everything', {}));
    expect(result.error).toMatch(/unknown tool/i);
  });

  it('an unexpected error never throws out of the tool, it returns a generic {error}', async () => {
    const throwingSupabase = {
      from: () => {
        throw new Error('boom');
      },
    };
    const result = JSON.parse(await executeWorkflowTool(throwingSupabase, 'biz-1', 'user-1', 'list_workflows', {}));
    expect(result.error).toBe('Something went wrong running that workflow.');
  });
});
