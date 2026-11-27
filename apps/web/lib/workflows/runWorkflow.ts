/**
 * OGMJ BRANDS — Workflow execution (server-only).
 *
 * Extracted from app/api/workflows/[id]/run/route.ts so the exact same,
 * already-working execution logic (auth, business-membership check,
 * per-step action execution, execution/step logging) can be called both
 * from that HTTP route and from the Empire AI chat's run_workflow tool
 * (lib/ai/tools/workflowTool.ts), rather than duplicating it.
 */
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { AI_MODEL, getAnthropicClient, isAIConfigured } from '@/lib/ai/anthropic';
import { getResendClient, isResendConfigured, RESEND_FROM_EMAIL } from '@/lib/email/resend';
import { enforceAIUsageLimit } from '@/lib/ai/usage-limits';

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

interface StepResult {
  status: 'completed' | 'skipped' | 'failed';
  output?: Record<string, unknown>;
  error?: string;
}

export interface RunWorkflowSuccess {
  ok: true;
  executionId: string;
  status: 'completed' | 'failed';
  steps: number;
}

export interface RunWorkflowFailure {
  ok: false;
  status: number;
  error: string;
}

export type RunWorkflowResult = RunWorkflowSuccess | RunWorkflowFailure;

async function generateText(system: string, prompt: string, maxTokens: number): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

async function executeAction(
  actionType: string,
  ctx: {
    supabase: SupabaseClient;
    businessId: string;
    contact: { id: string; email: string | null; first_name: string | null; last_name: string | null } | null;
    workflowName: string;
    workflowDescription: string | null;
    userId: string;
  }
): Promise<StepResult> {
  const { supabase, businessId, contact, workflowName, workflowDescription, userId } = ctx;

  switch (actionType) {
    case 'send_email': {
      if (!contact?.email) {
        return { status: 'skipped', error: 'No contact with an email address in context' };
      }
      if (!isResendConfigured()) {
        return { status: 'skipped', error: 'Resend is not configured on this deployment' };
      }
      const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'there';
      const { data: sendResult, error: sendError } = await getResendClient().emails.send({
        from: RESEND_FROM_EMAIL,
        to: contact.email,
        subject: workflowName,
        html: `<p>Hi ${name},</p><p>${workflowDescription || 'This is an automated update from ' + workflowName + '.'}</p>`,
      });
      if (sendError) {
        return { status: 'failed', error: sendError.message };
      }
      return { status: 'completed', output: { to: contact.email, resendMessageId: sendResult?.id ?? null } };
    }

    case 'add_crm_note': {
      if (!contact?.id) {
        return { status: 'skipped', error: 'No contact in context' };
      }
      const content = `Automated note from workflow "${workflowName}"${workflowDescription ? `: ${workflowDescription}` : ''}`;
      const { data, error } = await (supabase as any)
        .from('crm_notes')
        .insert({ business_id: businessId, contact_id: contact.id, user_id: userId, content })
        .select('id')
        .single();
      if (error) {
        return { status: 'failed', error: error.message };
      }
      return { status: 'completed', output: { noteId: data?.id } };
    }

    case 'schedule_social_post': {
      if (!isAIConfigured()) {
        return { status: 'skipped', error: 'AI is not configured on this deployment' };
      }
      let caption: string;
      try {
        const text = await generateText(
          'You write a single Instagram caption for OGMJ BRANDS businesses. Return only the caption text, no commentary, no quotes.',
          `Write a caption for a post inspired by this automation: "${workflowName}"${workflowDescription ? ` — ${workflowDescription}` : ''}`,
          300
        );
        caption = text.trim();
      } catch (err) {
        return { status: 'failed', error: err instanceof Error ? err.message : 'AI generation failed' };
      }
      const { data, error } = await (supabase as any)
        .from('social_posts')
        .insert({ business_id: businessId, content: caption, platforms: ['instagram'], status: 'draft', created_by: userId })
        .select('id')
        .single();
      if (error) {
        return { status: 'failed', error: error.message };
      }
      return { status: 'completed', output: { postId: data?.id, caption } };
    }

    case 'generate_report': {
      if (!isAIConfigured()) {
        return { status: 'skipped', error: 'AI is not configured on this deployment' };
      }
      const [contacts, deals] = await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
        supabase.from('deals').select('value, stage_id').eq('business_id', businessId),
      ]);
      const openValue = (deals.data || []).reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0);
      let report: string;
      try {
        report = await generateText(
          'You write a short 3-bullet business snapshot for a founder. Plain text, no markdown headers.',
          `Contacts: ${contacts.count ?? 0}. Open deal value: ${openValue}. Workflow context: "${workflowName}"${workflowDescription ? ` — ${workflowDescription}` : ''}.`,
          400
        );
      } catch (err) {
        return { status: 'failed', error: err instanceof Error ? err.message : 'AI generation failed' };
      }
      return { status: 'completed', output: { report, contactCount: contacts.count ?? 0, openDealValue: openValue } };
    }

    default:
      return { status: 'skipped', error: `Unknown action type: ${actionType}` };
  }
}

/**
 * Runs one workflow for one (optional) contact: looks up the workflow,
 * verifies the calling user belongs to its business, runs every step in
 * order, and logs each step plus the overall execution. Identical
 * behavior to the original inline route handler — only the transport
 * (NextResponse vs. a plain result object) changed.
 */
export async function runWorkflow(
  supabase: SupabaseClient,
  userId: string,
  workflowId: string,
  contactId?: string
): Promise<RunWorkflowResult> {
  const { data: workflow, error: workflowError } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (workflowError || !workflow) {
    return { ok: false, status: 404, error: 'Workflow not found' };
  }

  const { data: membership } = await supabase
    .from('business_users')
    .select('role')
    .eq('business_id', (workflow as any).business_id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!membership) {
    return { ok: false, status: 403, error: 'Access denied' };
  }

  const businessId = (workflow as any).business_id as string;
  const actions = ((workflow as any).actions as { type: string; label: string }[]) || [];

  // Only runs that include an AI step count against AI usage. Both
  // 'generate_report' and 'schedule_social_post' call the model
  // (executeAction below) -- a run with only the latter was previously
  // unmetered, since this check only ever named 'generate_report'.
  if (actions.some((action) => action.type === 'generate_report' || action.type === 'schedule_social_post')) {
    const usageLimited = await enforceAIUsageLimit(businessId, 'ai:workflow');
    if (usageLimited) {
      const body = await usageLimited.json().catch(() => ({ error: 'AI is temporarily unavailable.' }));
      return { ok: false, status: usageLimited.status, error: body.error ?? 'AI usage limit reached.' };
    }
  }

  let contact: { id: string; email: string | null; first_name: string | null; last_name: string | null } | null = null;
  if (contactId) {
    const { data: contactRow } = await supabase
      .from('contacts')
      .select('id, email, first_name, last_name')
      .eq('id', contactId)
      .eq('business_id', businessId)
      .maybeSingle();
    contact = (contactRow as any) ?? null;
  }

  const startedAt = new Date().toISOString();
  const { data: execution, error: execError } = await (supabase as any)
    .from('workflow_executions')
    .insert({
      workflow_id: workflowId,
      business_id: businessId,
      contact_id: contact?.id ?? null,
      status: 'running',
      started_at: startedAt,
      context: { trigger: 'manual', triggeredBy: userId },
    })
    .select()
    .single();

  if (execError || !execution) {
    return { ok: false, status: 400, error: execError?.message || 'Failed to start execution' };
  }

  const executionId = execution.id as string;
  let hadFailure = false;

  for (let stepIndex = 0; stepIndex < actions.length; stepIndex++) {
    const action = actions[stepIndex];
    let result: StepResult;

    try {
      result = await executeAction(action.type, {
        supabase,
        businessId,
        contact,
        workflowName: (workflow as any).name,
        workflowDescription: (workflow as any).description,
        userId,
      });
    } catch (err) {
      result = { status: 'failed', error: err instanceof Error ? err.message : 'Action failed' };
    }

    if (result.status === 'failed') hadFailure = true;

    await (supabase as any).from('workflow_step_logs').insert({
      execution_id: executionId,
      step_index: stepIndex,
      action_type: action.type,
      status: result.status,
      input: { contactId: contact?.id ?? null },
      output: result.output ?? {},
      error: result.error ?? null,
      executed_at: new Date().toISOString(),
    });
  }

  const completedAt = new Date().toISOString();
  const finalStatus: 'completed' | 'failed' = hadFailure ? 'failed' : 'completed';

  await (supabase as any)
    .from('workflow_executions')
    .update({ status: finalStatus, completed_at: completedAt })
    .eq('id', executionId);

  await (supabase as any)
    .from('workflows')
    .update({
      run_count: ((workflow as any).run_count || 0) + 1,
      last_run_at: completedAt,
    })
    .eq('id', workflowId);

  return { ok: true, executionId, status: finalStatus, steps: actions.length };
}
