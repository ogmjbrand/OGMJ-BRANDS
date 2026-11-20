import { anthropicProvider } from './anthropicProvider';
import { openaiProvider } from './openaiProvider';
import { AIProviderError, type AIProvider, type AIProviderId } from './types';

export type { AIProvider, AIProviderId, AICompletionRequest, AICompletionResult, AIMessage, AITokenUsage } from './types';
export { AIProviderError } from './types';

const PROVIDERS: Record<AIProviderId, AIProvider> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
};

/** Providers whose API key is actually present right now -- never guesses, never caches (an env var can't change mid-process in a way that matters here, but this stays cheap and honest either way). */
export function getConfiguredProviders(): AIProviderId[] {
  return (Object.keys(PROVIDERS) as AIProviderId[]).filter((id) => PROVIDERS[id].isConfigured());
}

/**
 * Resolves a provider by id, or the first configured provider if `id` is
 * omitted (Anthropic preferred as the default since it's the
 * longest-running, most-used integration in this app today). Throws a
 * typed `AIProviderError` (never a generic Error) when the requested
 * provider doesn't exist or isn't configured, so callers get a single
 * error shape to handle regardless of which provider was involved.
 *
 * NO AUTOMATIC FAILOVER: this resolves to exactly ONE provider for the
 * call, picked once, before any request is sent. If that provider then
 * fails mid-request (a runtime error from `.complete()` -- an outage,
 * a timeout, a rate limit on the SDK side, etc.), there is no retry
 * against the other configured provider within the same call; the
 * error simply propagates to the caller as a classified
 * `AIProviderError`. "Supports OpenAI and Anthropic" means callers
 * aren't hard-wired to one SDK and can request either explicitly (or
 * take this function's default) -- it does not mean a request is
 * silently retried on a second provider when the first one errors.
 * Automatic cross-provider failover, if wanted, is separate follow-up
 * work (it has its own design questions: resending a request to a
 * second paid provider after the first failed has cost and
 * idempotency implications of its own).
 */
export function getProvider(id?: AIProviderId): AIProvider {
  if (id) {
    const provider = PROVIDERS[id];
    if (!provider) {
      throw new AIProviderError(`Unknown AI provider "${id}".`, 'invalid_request', id);
    }
    if (!provider.isConfigured()) {
      throw new AIProviderError(`Provider "${id}" is not configured on this deployment.`, 'not_configured', id);
    }
    return provider;
  }

  const configured = getConfiguredProviders();
  if (configured.length === 0) {
    throw new AIProviderError('No AI provider is configured on this deployment.', 'not_configured', 'anthropic');
  }
  const preferredOrder: AIProviderId[] = ['anthropic', 'openai'];
  const defaultId = preferredOrder.find((p) => configured.includes(p)) ?? configured[0];
  return PROVIDERS[defaultId];
}
