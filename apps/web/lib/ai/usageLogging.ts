/**
 * Logs one AI call to the EXISTING `ai_execution_logs` table -- real
 * token counts and cost (when known; see providers/pricing.ts), an
 * approval/publish gate the schema already has, and an error_message
 * slot for failed calls. This table existed, RLS-enabled and completely
 * unused, before this module (see the Phase readiness audit) -- reused,
 * not duplicated.
 *
 * Writes through the NORMAL (RLS-respecting) server client, not the
 * service-role one: ai_execution_logs' own INSERT policy already scopes
 * to `business_id IN (caller's active business_users rows)`, so an
 * authenticated caller writing a log for their OWN business works
 * without bypassing RLS at all.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AICompletionResult, AIProviderId } from './providers/types';

export interface LogAIExecutionParams {
  businessId: string;
  userId: string;
  agentType: string;
  prompt: string;
  systemPrompt?: string;
  executionTimeMs: number;
}

export async function logSuccessfulAIExecution(
  supabase: SupabaseClient,
  params: LogAIExecutionParams,
  result: AICompletionResult
): Promise<void> {
  await supabase.from('ai_execution_logs').insert({
    business_id: params.businessId,
    created_by: params.userId,
    agent_type: params.agentType,
    model: result.model,
    prompt: params.prompt,
    system_prompt: params.systemPrompt ?? null,
    output: result.text,
    status: 'completed',
    tokens_used: result.usage.inputTokens + result.usage.outputTokens,
    prompt_tokens: result.usage.inputTokens,
    completion_tokens: result.usage.outputTokens,
    cost_usd: result.costUsd ?? 0,
    execution_time_ms: params.executionTimeMs,
    metadata: { provider: result.provider, costKnown: result.costUsd !== null },
  });
}

export async function logFailedAIExecution(
  supabase: SupabaseClient,
  params: LogAIExecutionParams,
  provider: AIProviderId,
  errorMessage: string
): Promise<void> {
  await supabase.from('ai_execution_logs').insert({
    business_id: params.businessId,
    created_by: params.userId,
    agent_type: params.agentType,
    model: 'unknown',
    prompt: params.prompt,
    system_prompt: params.systemPrompt ?? null,
    output: '',
    status: 'failed',
    tokens_used: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    cost_usd: 0,
    execution_time_ms: params.executionTimeMs,
    error_message: errorMessage,
    metadata: { provider },
  });
}
