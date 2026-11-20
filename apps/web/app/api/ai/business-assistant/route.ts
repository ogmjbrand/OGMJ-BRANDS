/**
 * OGMJ AI — business assistant endpoint (Milestone A foundation).
 *
 * Honestly scoped: this is the first real, working slice of "OGMJ AI
 * Central Intelligence" (a single-turn, business-scoped AI request/
 * response with full production plumbing around it), not the complete
 * orchestration/agent-routing/workflow system the full OGMJ AI spec
 * describes. It demonstrates and exercises every piece Milestone A asks
 * for -- provider abstraction, auth, organization isolation, input
 * validation, rate limiting, usage tracking, cost logging, honest error
 * handling -- on a real, callable endpoint, rather than leaving the
 * provider layer unreachable from any route.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { AIProviderError, getProvider } from '@/lib/ai/providers';
import { checkAndIncrementRateLimit } from '@/lib/ai/rateLimit';
import { logFailedAIExecution, logSuccessfulAIExecution } from '@/lib/ai/usageLogging';

export const runtime = 'nodejs';
export const maxDuration = 60;

const requestSchema = z.object({
  businessId: z.string().uuid(),
  message: z.string().min(1).max(8_000),
  provider: z.enum(['anthropic', 'openai']).optional(),
  agentType: z.string().min(1).max(64).optional(),
});

const SYSTEM_PROMPT = `You are OGMJ AI, the business intelligence assistant inside the OGMJ BRANDS platform.

Help the user with their business -- strategy, marketing, content, operations -- using only what they actually tell you in this conversation. You have no access to their live business data in this request; never invent revenue, customers, traffic, or performance numbers. If a question needs data you don't have, say so and ask for it or say what you'd need to check.

Be direct and useful: lead with the recommendation, then the reasoning. No filler, no fake enthusiasm.`;

/**
 * Formats an unknown thrown value for a log line WITHOUT ever including
 * the raw error object. Some error types that can reach this route's
 * catch blocks (HTTP client errors from either SDK, in particular) can
 * carry response headers or echo request details as extra properties --
 * never something this app wants verbatim in a log. Only a message and
 * (for a real Error) its name are kept; that's enough to diagnose a
 * failure while being provably free of credentials, headers, or raw
 * request content.
 */
function safeErrorSummary(error: unknown): { name?: string; message: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { message: typeof error === 'string' ? error : 'Non-Error value thrown' };
}

/** Classifies an AIProviderError into the right HTTP status -- the one place this mapping lives, so every failure path agrees. */
function statusForProviderError(error: AIProviderError): number {
  switch (error.kind) {
    case 'not_configured':
    case 'authentication':
      return 503;
    case 'rate_limited':
      return 429;
    case 'invalid_request':
      return 400;
    case 'timeout':
      return 504;
    case 'provider_error':
    default:
      return 502;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }
    const { businessId, message, provider: providerId, agentType } = parsed.data;

    const supabase = await createServerClient();

    // ORGANIZATION ISOLATION: the same active-membership check every
    // other /api/builder and /api/marketing route already uses. This is
    // the one and only thing that decides whether this caller may use
    // THIS business's AI quota/logs -- nothing downstream re-derives or
    // widens it.
    const { data: membership } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    if (!membership) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const rateLimit = await checkAndIncrementRateLimit(businessId, 'ai/business-assistant', user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Rate limit exceeded for this business. Try again after ${rateLimit.resetAt.toISOString()}.` },
        { status: 429 }
      );
    }

    let provider;
    try {
      provider = getProvider(providerId);
    } catch (error) {
      if (error instanceof AIProviderError) {
        return NextResponse.json({ success: false, error: error.message }, { status: statusForProviderError(error) });
      }
      throw error;
    }

    const effectiveAgentType = agentType ?? 'assistant';
    const start = Date.now();
    try {
      const result = await provider.complete({ system: SYSTEM_PROMPT, messages: [{ role: 'user', content: message }], maxOutputTokens: 2_000 });

      // Usage/cost logging never blocks or fails the user-facing response
      // -- a logging failure must not look like an AI failure.
      await logSuccessfulAIExecution(
        supabase,
        { businessId, userId: user.id, agentType: effectiveAgentType, prompt: message, systemPrompt: SYSTEM_PROMPT, executionTimeMs: Date.now() - start },
        result
      ).catch((err) => console.error('ai_execution_logs insert failed (non-fatal):', safeErrorSummary(err)));

      return NextResponse.json({
        success: true,
        data: { text: result.text, provider: result.provider, model: result.model, usage: result.usage, costUsd: result.costUsd },
      });
    } catch (error) {
      const executionTimeMs = Date.now() - start;
      if (error instanceof AIProviderError) {
        await logFailedAIExecution(
          supabase,
          { businessId, userId: user.id, agentType: effectiveAgentType, prompt: message, systemPrompt: SYSTEM_PROMPT, executionTimeMs },
          provider.id,
          error.message
        ).catch((err) => console.error('ai_execution_logs insert failed (non-fatal):', safeErrorSummary(err)));

        // NEVER fabricate a response here -- a provider failure is
        // reported as a failure, with the real classified status, not
        // papered over with an invented success payload.
        return NextResponse.json({ success: false, error: error.message }, { status: statusForProviderError(error) });
      }
      throw error;
    }
  } catch (error) {
    console.error('OGMJ AI business-assistant error:', safeErrorSummary(error));
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
