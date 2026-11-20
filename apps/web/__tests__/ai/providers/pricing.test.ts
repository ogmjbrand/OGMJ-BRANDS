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

  describe('claude-opus-5-5 (the model lib/ai/anthropic.ts actually uses)', () => {
    it('computes real cost at Anthropic\'s verified $4/$20 per-million-token rate', () => {
      const cost = estimateCostUsd('claude-opus-5-5', 1_000_000, 1_000_000);
      expect(cost).toBeCloseTo(4 + 20, 5);
    });

    it('scales linearly', () => {
      expect(estimateCostUsd('claude-opus-5-5', 500_000, 0)).toBeCloseTo(2, 5);
      expect(estimateCostUsd('claude-opus-5-5', 0, 250_000)).toBeCloseTo(5, 5);
    });
  });

  describe('claude-sonnet-5-5', () => {
    it('computes real cost at Anthropic\'s verified $2/$10 per-million-token rate', () => {
      expect(estimateCostUsd('claude-sonnet-5-5', 1_000_000, 1_000_000)).toBeCloseTo(2 + 10, 5);
    });
  });

  describe('claude-haiku-5-5 (tiered pricing)', () => {
    it('uses the short-context rate ($0.10/$0.50) at or under the 100k-input-token threshold', () => {
      const cost = estimateCostUsd('claude-haiku-5-5', 100_000, 1_000_000);
      expect(cost).toBeCloseTo(100_000 / 1_000_000 * 0.1 + 0.5, 5);
    });

    it('uses the long-context rate ($0.50/$2.50) once input tokens exceed the 100k threshold', () => {
      const cost = estimateCostUsd('claude-haiku-5-5', 150_000, 1_000_000);
      expect(cost).toBeCloseTo(150_000 / 1_000_000 * 0.5 + 2.5, 5);
    });

    it('long-context rate is strictly higher than short-context rate for the same usage', () => {
      const shortTier = estimateCostUsd('claude-haiku-5-5', 100_000, 100_000)!;
      const longTier = estimateCostUsd('claude-haiku-5-5', 100_001, 100_000)!;
      expect(longTier).toBeGreaterThan(shortTier);
    });
  });
});
