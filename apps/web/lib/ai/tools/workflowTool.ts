/**
 * OGMJ BRANDS — Empire AI chat tools: workflow (automation) connection.
 *
 * run_workflow reuses the exact same execution logic as
 * app/api/workflows/[id]/run/route.ts (lib/workflows/runWorkflow.ts) --
 * there is exactly one place a workflow actually runs, whether triggered
 * from the dashboard's Workflows page or from this chat. A workflow's
 * steps can have real external effects (an email sent via Resend, a CRM
 * note, a drafted social post) so, like the CRM write tools, this runs
 * immediately with no separate review step: the system prompt
 * (lib/ai/anthropic.ts) requires the model to name the workflow and
 * contact (if any) and get an explicit yes before calling run_workflow.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { runWorkflow } from '@/lib/workflows/runWorkflow';
import { safeErrorSummary } from '@/lib/ai/errorSummary';

export const WORKFLOW_TOOLS: Anthropic.Tool[] = [
  {
    name: 'list_workflows',
    description:
      "List the business's automations/workflows (id, name, description, step count, run history). Use this to find a workflowId before run_workflow.",
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'run_workflow',
    description:
      "Run an existing workflow now, optionally for one contact. A workflow's steps can send a real email to that contact, add a CRM note, draft a social post, or generate a report -- this executes immediately, with no review step. Always state exactly which workflow (by name) you are about to run, and for which contact if any, and wait for an explicit yes before calling this.",
    input_schema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'A workflow id from list_workflows.' },
        contactId: { type: 'string', description: 'Optional -- only needed if the workflow acts on a specific contact.' },
      },
      required: ['workflowId'],
      additionalProperties: false,
    },
  },
];

interface WorkflowRow {
  id: string;
  name: string;
  description: string | null;
  actions: unknown;
  run_count: number | null;
  last_run_at: string | null;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Executes one Anthropic tool call for the Empire AI chat's workflow
 * tools. Always resolves to a JSON string suitable as a `tool_result`
 * block's content -- never throws, so one failed tool call degrades to
 * the model seeing `{"error": "..."}` rather than aborting the whole chat
 * turn.
 */
export async function executeWorkflowTool(
  supabase: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- real client's chained query builder isn't practically typeable narrower here; businessId scoping below is what actually enforces safety.
  businessId: string,
  userId: string,
  toolName: string,
  toolInput: unknown
): Promise<string> {
  try {
    if (toolName === 'list_workflows') {
      const { data, error } = await supabase
        .from('workflows')
        .select('id, name, description, actions, run_count, last_run_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return JSON.stringify({ error: 'Failed to load workflows.' });

      const workflows = ((data ?? []) as WorkflowRow[]).map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        stepCount: Array.isArray(w.actions) ? w.actions.length : 0,
        runCount: w.run_count ?? 0,
        lastRunAt: w.last_run_at,
      }));
      return JSON.stringify({ workflows });
    }

    if (toolName === 'run_workflow') {
      const input = (toolInput ?? {}) as { workflowId?: unknown; contactId?: unknown };
      const workflowId = str(input.workflowId);
      if (!workflowId) return JSON.stringify({ error: 'workflowId is required.' });
      const contactId = str(input.contactId) || undefined;

      // Defense in depth, and a consistent error message for this chat's
      // tools ("not found" rather than a bubbled-up 403): runWorkflow
      // itself re-verifies business_users membership, but checking the
      // workflow's business here first means a wrong/foreign id never
      // even reaches it.
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('business_id')
        .eq('id', workflowId)
        .single();
      if (workflowError || !workflow || workflow.business_id !== businessId) {
        return JSON.stringify({ error: 'Workflow not found.' });
      }

      const result = await runWorkflow(supabase, userId, workflowId, contactId);
      if (!result.ok) return JSON.stringify({ error: result.error });
      return JSON.stringify({
        executionId: result.executionId,
        status: result.status,
        stepsRun: result.steps,
        message: `Workflow run ${result.status}.`,
      });
    }

    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  } catch (error) {
    console.error('[workflow-tool] unexpected error:', safeErrorSummary(error));
    return JSON.stringify({ error: 'Something went wrong running that workflow.' });
  }
}
