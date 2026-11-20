import OpenAI from 'openai';
import { AIProviderError, type AICompletionRequest, type AICompletionResult, type AIProvider } from './types';
import { estimateCostUsd } from './pricing';

/** Conservative, well-established, inexpensive default -- overridable via OPENAI_MODEL since this SDK's model list changes faster than this file should need to. */
const DEFAULT_MODEL = 'gpt-4o-mini';

let client: OpenAI | null = null;

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getClient(): OpenAI {
  if (!client) {
    // Reads OPENAI_API_KEY from process.env itself (the SDK's documented
    // default) -- this module never reads, logs, or returns the key value.
    client = new OpenAI();
  }
  return client;
}

export const openaiProvider: AIProvider = {
  id: 'openai',
  isConfigured: isOpenAIConfigured,

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    if (!isOpenAIConfigured()) {
      throw new AIProviderError('OpenAI is not configured on this deployment (OPENAI_API_KEY is not set).', 'not_configured', 'openai');
    }

    const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
    const openai = getClient();

    // Responses API (not Chat Completions) -- OpenAI's current primary
    // API shape: "instructions" for the system/persona text, "input" for
    // the conversation. We flatten role-tagged turns into one input
    // string (same shape every call site needs today); a true multi-turn
    // structured input can be added once a caller actually needs it.
    const input = request.messages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');

    let response: Awaited<ReturnType<typeof openai.responses.create>>;
    try {
      response = await openai.responses.create({
        model,
        instructions: request.system,
        input,
        max_output_tokens: request.maxOutputTokens,
        temperature: request.temperature,
      });
    } catch (error) {
      throw mapOpenAIError(error);
    }

    const usage = {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    };

    return {
      text: response.output_text ?? '',
      provider: 'openai',
      model,
      usage,
      costUsd: estimateCostUsd(model, usage.inputTokens, usage.outputTokens),
    };
  },
};

function mapOpenAIError(error: unknown): AIProviderError {
  if (error instanceof OpenAI.AuthenticationError) {
    return new AIProviderError('Invalid OPENAI_API_KEY.', 'authentication', 'openai');
  }
  if (error instanceof OpenAI.RateLimitError) {
    return new AIProviderError('OpenAI rate limit reached -- try again shortly.', 'rate_limited', 'openai');
  }
  if (error instanceof OpenAI.BadRequestError) {
    return new AIProviderError('OpenAI rejected the request as invalid.', 'invalid_request', 'openai');
  }
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new AIProviderError('OpenAI request timed out.', 'timeout', 'openai');
  }
  if (error instanceof OpenAI.APIError) {
    return new AIProviderError(`OpenAI request failed (${error.status ?? 'unknown status'}).`, 'provider_error', 'openai');
  }
  return new AIProviderError('OpenAI request failed.', 'provider_error', 'openai');
}
