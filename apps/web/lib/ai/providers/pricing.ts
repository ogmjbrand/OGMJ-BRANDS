/**
 * Per-model USD pricing, per million tokens -- used ONLY to compute
 * `AICompletionResult.costUsd`. Deliberately a small, explicit table
 * rather than a formula or a guess: a model not listed here returns
 * `null` cost (still reports real token counts) rather than a wrong
 * number computed from stale or assumed rates. Prices drift; whoever
 * maintains this should re-verify current rates against each
 * provider's own pricing page before trusting costUsd for a new model.
 *
 * Anthropic rows verified 2026-11-20 directly against Anthropic's own
 * official documentation -- not a guess, not secondary/blog coverage:
 *   - https://platform.claude.com/docs/en/about-claude/pricing (per-
 *     million-token input/output rates)
 *   - https://platform.claude.com/docs/en/about-claude/models/overview
 *     (confirms the exact API model ID string, e.g. "claude-opus-5-5",
 *     for each priced display name)
 * `claude-opus-5-5` is the model actually configured as `AI_MODEL` in
 * lib/ai/anthropic.ts today, so it's the one that matters for real
 * cost tracking in this app; the other Anthropic rows are kept
 * accurate in case a caller ever passes a different model explicitly.
 *
 * OpenAI rows were not re-verified in this pass (carried over from
 * this file's original authoring) -- re-check before relying on them
 * for a new OpenAI model.
 */
interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

const PRICING: Record<string, ModelPricing> = {
  // OpenAI -- not re-verified in this pass.
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'gpt-4o': { inputPerMillion: 2.5, outputPerMillion: 10 },

  // Anthropic -- verified 2026-11-20, see file header.
  'claude-opus-5-5': { inputPerMillion: 4, outputPerMillion: 20 }, // the model lib/ai/anthropic.ts actually uses
  'claude-sonnet-5-5': { inputPerMillion: 2, outputPerMillion: 10 },
};

/**
 * Claude Haiku 5.5 is the one model here with a tiered rate: Anthropic
 * charges a higher per-token rate once the prompt exceeds 100,000
 * input tokens. Handled as an explicit special case (by input token
 * count) rather than bending `ModelPricing`/`PRICING` to support tiers
 * for a single model.
 */
const HAIKU_5_5_MODEL_ID = 'claude-haiku-5-5';
const HAIKU_5_5_LONG_CONTEXT_THRESHOLD = 100_000;
const HAIKU_5_5_SHORT: ModelPricing = { inputPerMillion: 0.1, outputPerMillion: 0.5 };
const HAIKU_5_5_LONG: ModelPricing = { inputPerMillion: 0.5, outputPerMillion: 2.5 };

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number | null {
  const rate =
    model === HAIKU_5_5_MODEL_ID
      ? inputTokens > HAIKU_5_5_LONG_CONTEXT_THRESHOLD
        ? HAIKU_5_5_LONG
        : HAIKU_5_5_SHORT
      : PRICING[model];

  if (!rate) return null;
  return (inputTokens / 1_000_000) * rate.inputPerMillion + (outputTokens / 1_000_000) * rate.outputPerMillion;
}
