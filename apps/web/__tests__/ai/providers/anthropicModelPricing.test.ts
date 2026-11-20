import { describe, expect, it } from 'vitest';
import { AI_MODEL } from '@/lib/ai/anthropic';
import { estimateCostUsd } from '@/lib/ai/providers/pricing';

/**
 * Binds lib/ai/anthropic.ts's REAL `AI_MODEL` (not a mock) to pricing.ts's
 * REAL pricing table, with no mocking of either module. The regression
 * this guards against: AI_MODEL changing to a different Claude model
 * without pricing.ts being updated to match, which would silently make
 * every real Anthropic completion log `costUsd: null` again (exactly
 * the bug this PR is fixing for claude-opus-5-5).
 */
describe('the Anthropic model actually configured in production is correctly priced', () => {
  it('AI_MODEL is the model pricing.ts was verified against', () => {
    // If this assertion ever fails, it means AI_MODEL was changed --
    // pricing.ts needs a verified (not guessed) entry for the new model
    // before this test can be updated to match.
    expect(AI_MODEL).toBe('claude-opus-5-5');
  });

  it('estimateCostUsd(AI_MODEL, ...) returns a real, non-null cost at the verified $4/$20-per-million-token rate', () => {
    const cost = estimateCostUsd(AI_MODEL, 1_000_000, 1_000_000);
    expect(cost).not.toBeNull();
    expect(cost).toBeCloseTo(4 + 20, 5);
  });

  it('never silently returns 0 for a real, non-zero completion -- it is either the correct non-zero cost or explicitly null', () => {
    const cost = estimateCostUsd(AI_MODEL, 500, 200);
    expect(cost).not.toBeNull();
    expect(cost).toBeGreaterThan(0);
  });
});
