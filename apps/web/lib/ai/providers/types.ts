/**
 * OGMJ AI — provider-agnostic AI layer (Milestone A).
 *
 * The app already has ~15 features built directly against
 * `lib/ai/anthropic.ts` (chat, assist, marketing content/ads/email/SEO,
 * brand strategy, CMO briefing, etc.) -- this module does NOT touch any
 * of them. It's a NEW, parallel abstraction that NEW features (starting
 * with the business-assistant route) build against, so OGMJ AI is never
 * hard-wired to one vendor. Every provider implements the same narrow
 * `AIProvider` interface; callers never import `@anthropic-ai/sdk` or
 * `openai` directly.
 */

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  /** System/instructions text -- "system" for Anthropic, "instructions" for the OpenAI Responses API. */
  system?: string;
  messages: AIMessage[];
  maxOutputTokens?: number;
  temperature?: number;
}

export interface AITokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AICompletionResult {
  text: string;
  provider: AIProviderId;
  model: string;
  usage: AITokenUsage;
  /**
   * `null`, never a guessed number, when this model isn't in the pricing
   * table (pricing.ts) -- an unmaintained/wrong cost figure is worse than
   * an honestly-absent one for anything called "cost controls".
   */
  costUsd: number | null;
}

export type AIProviderId = 'anthropic' | 'openai';

/** Thrown for a failure this layer understands well enough to classify (auth, rate limit, bad request, etc.) -- see errors.ts. Callers map this to an HTTP status; they never have to know which SDK's error type it came from. */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly kind: 'not_configured' | 'authentication' | 'rate_limited' | 'invalid_request' | 'provider_error' | 'timeout',
    public readonly provider: AIProviderId
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export interface AIProvider {
  readonly id: AIProviderId;
  /** Whether this provider's API key is present -- never throws, never logs/returns the key itself. */
  isConfigured(): boolean;
  complete(request: AICompletionRequest): Promise<AICompletionResult>;
}
