/**
 * Per-model USD pricing, per million tokens -- used ONLY to compute
 * `AICompletionResult.costUsd`. Deliberately a small, explicit table
 * rather than a formula or a guess: a model not listed here returns
 * `null` cost (still reports real token counts) rather than a wrong
 * number computed from stale or assumed rates. Prices drift; whoever
 * maintains this should verify current rates against each provider's
 * own pricing page before trusting costUsd for a new model.
 */
interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

const PRICING: Record<string, ModelPricing> = {
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'gpt-4o': { inputPerMillion: 2.5, outputPerMillion: 10 },
  'claude-sonnet-5-5': { inputPerMillion: 3, outputPerMillion: 15 },
  'claude-haiku-5-5': { inputPerMillion: 0.8, outputPerMillion: 4 },
};

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number | null {
  const rate = PRICING[model];
  if (!rate) return null;
  return (inputTokens / 1_000_000) * rate.inputPerMillion + (outputTokens / 1_000_000) * rate.outputPerMillion;
}
