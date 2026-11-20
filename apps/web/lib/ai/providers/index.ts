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
