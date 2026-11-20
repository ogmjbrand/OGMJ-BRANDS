import Anthropic from '@anthropic-ai/sdk';
import { AI_MODEL, getAnthropicClient, isAIConfigured } from '@/lib/ai/anthropic';
import { AIProviderError, type AICompletionRequest, type AICompletionResult, type AIProvider } from './types';
import { estimateCostUsd } from './pricing';

/**
 * Wraps the EXISTING Anthropic client (lib/ai/anthropic.ts) rather than
 * constructing a second one -- that module already owns client
 * construction/model selection for every pre-existing Anthropic-backed
 * feature; this just adapts it to the shared AIProvider interface.
 */
export const anthropicProvider: AIProvider = {
  id: 'anthropic',
  isConfigured: isAIConfigured,

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    if (!isAIConfigured()) {
      throw new AIProviderError('Anthropic is not configured on this deployment (ANTHROPIC_API_KEY is not set).', 'not_configured', 'anthropic');
    }

    const client = getAnthropicClient();
    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model: AI_MODEL,
        max_tokens: request.maxOutputTokens ?? 4_096,
        temperature: request.temperature,
        system: request.system,
        messages: request.messages,
      });
    } catch (error) {
      throw mapAnthropicError(error);
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const usage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };

    return {
      text,
      provider: 'anthropic',
      model: AI_MODEL,
      usage,
      costUsd: estimateCostUsd(AI_MODEL, usage.inputTokens, usage.outputTokens),
    };
  },
};

function mapAnthropicError(error: unknown): AIProviderError {
  if (error instanceof Anthropic.AuthenticationError) {
    return new AIProviderError('Invalid ANTHROPIC_API_KEY.', 'authentication', 'anthropic');
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new AIProviderError('Anthropic rate limit reached -- try again shortly.', 'rate_limited', 'anthropic');
  }
  if (error instanceof Anthropic.BadRequestError) {
    return new AIProviderError('Anthropic rejected the request as invalid.', 'invalid_request', 'anthropic');
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new AIProviderError('Anthropic request timed out.', 'timeout', 'anthropic');
  }
  if (error instanceof Anthropic.APIError) {
    return new AIProviderError(`Anthropic request failed (${error.status ?? 'unknown status'}).`, 'provider_error', 'anthropic');
  }
  return new AIProviderError('Anthropic request failed.', 'provider_error', 'anthropic');
}
