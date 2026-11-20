import { describe, expect, it } from 'vitest';
import { estimateCostUsd } from '@/lib/ai/providers/pricing';

describe('estimateCostUsd', () => {
  it('computes a real cost for a known model', () => {
    const cost = estimateCostUsd('gpt-4o-mini', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.15 + 0.6, 5);
  });

  it('scales linearly with token count', () => {
    const cost = estimateCostUsd('gpt-4o-mini', 500_000, 0);
    expect(cost).toBeCloseTo(0.075, 5);
  });

  it('returns null (never a guessed number) for an unknown model', () => {
    expect(estimateCostUsd('some-future-model-nobody-has-priced-yet', 1000, 1000)).toBeNull();
  });

  it('returns 0, not null, for zero usage on a known model', () => {
    expect(estimateCostUsd('gpt-4o-mini', 0, 0)).toBe(0);
  });
});
