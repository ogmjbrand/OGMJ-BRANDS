import { describe, expect, it, vi, beforeEach } from 'vitest';
import { logFailedAIExecution, logSuccessfulAIExecution } from '@/lib/ai/usageLogging';
import type { AICompletionResult } from '@/lib/ai/providers/types';

let insertCalls: unknown[] = [];

function makeSupabase() {
  return {
    from(table: string) {
      if (table !== 'ai_execution_logs') throw new Error(`unexpected table ${table}`);
      return {
        async insert(row: unknown) {
          insertCalls.push(row);
          return { data: null, error: null };
        },
      };
    },
  } as unknown as Parameters<typeof logSuccessfulAIExecution>[0];
}

beforeEach(() => {
  insertCalls = [];
});

describe('logSuccessfulAIExecution', () => {
  it('logs real token counts, cost, and marks costKnown when pricing is known', async () => {
    const result: AICompletionResult = { text: 'Hi there', provider: 'openai', model: 'gpt-4o-mini', usage: { inputTokens: 10, outputTokens: 4 }, costUsd: 0.001 };
    await logSuccessfulAIExecution(makeSupabase(), { businessId: 'biz-1', userId: 'user-1', agentType: 'assistant', prompt: 'hi', executionTimeMs: 123 }, result);

    const row = insertCalls[0] as Record<string, unknown>;
    expect(row.business_id).toBe('biz-1');
    expect(row.created_by).toBe('user-1');
    expect(row.status).toBe('completed');
    expect(row.tokens_used).toBe(14);
    expect(row.prompt_tokens).toBe(10);
    expect(row.completion_tokens).toBe(4);
    expect(row.cost_usd).toBe(0.001);
    expect(row.execution_time_ms).toBe(123);
    expect((row.metadata as { costKnown: boolean }).costKnown).toBe(true);
  });

  it('stores 0 (not null) for cost_usd when the model has no known pricing, but flags costKnown: false in metadata', async () => {
    const result: AICompletionResult = { text: 'Hi', provider: 'openai', model: 'some-unpriced-model', usage: { inputTokens: 5, outputTokens: 2 }, costUsd: null };
    await logSuccessfulAIExecution(makeSupabase(), { businessId: 'biz-1', userId: 'user-1', agentType: 'assistant', prompt: 'hi', executionTimeMs: 50 }, result);

    const row = insertCalls[0] as Record<string, unknown>;
    expect(row.cost_usd).toBe(0);
    expect((row.metadata as { costKnown: boolean }).costKnown).toBe(false);
  });
});

describe('logFailedAIExecution', () => {
  it('logs a failed execution with zeroed usage and the error message, never inventing a fake response', async () => {
    await logFailedAIExecution(makeSupabase(), { businessId: 'biz-1', userId: 'user-1', agentType: 'assistant', prompt: 'hi', executionTimeMs: 10 }, 'openai', 'Invalid OPENAI_API_KEY.');

    const row = insertCalls[0] as Record<string, unknown>;
    expect(row.status).toBe('failed');
    expect(row.output).toBe('');
    expect(row.tokens_used).toBe(0);
    expect(row.cost_usd).toBe(0);
    expect(row.error_message).toBe('Invalid OPENAI_API_KEY.');
  });
});
