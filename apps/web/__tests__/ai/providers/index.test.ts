import { describe, expect, it, vi, beforeEach } from 'vitest';

let anthropicConfigured = true;
let openaiConfigured = true;

vi.mock('@/lib/ai/providers/anthropicProvider', () => ({
  anthropicProvider: { id: 'anthropic', isConfigured: () => anthropicConfigured, complete: vi.fn() },
}));
vi.mock('@/lib/ai/providers/openaiProvider', () => ({
  openaiProvider: { id: 'openai', isConfigured: () => openaiConfigured, complete: vi.fn() },
}));

import { AIProviderError, getConfiguredProviders, getProvider } from '@/lib/ai/providers';

beforeEach(() => {
  anthropicConfigured = true;
  openaiConfigured = true;
});

describe('getConfiguredProviders', () => {
  it('lists only providers whose key is actually present', () => {
    openaiConfigured = false;
    expect(getConfiguredProviders()).toEqual(['anthropic']);
  });

  it('lists both when both are configured', () => {
    expect(getConfiguredProviders().sort()).toEqual(['anthropic', 'openai']);
  });

  it('lists none when neither is configured', () => {
    anthropicConfigured = false;
    openaiConfigured = false;
    expect(getConfiguredProviders()).toEqual([]);
  });
});

describe('getProvider', () => {
  it('returns the explicitly requested provider when configured', () => {
    expect(getProvider('openai').id).toBe('openai');
  });

  it('throws AIProviderError (not a generic Error) for an explicitly requested but unconfigured provider', () => {
    openaiConfigured = false;
    expect(() => getProvider('openai')).toThrow(AIProviderError);
  });

  it('throws AIProviderError for an unknown provider id', () => {
    // @ts-expect-error -- deliberately invalid id to test the runtime guard
    expect(() => getProvider('made-up-provider')).toThrow(AIProviderError);
  });

  it('defaults to anthropic when no id is given and both are configured', () => {
    expect(getProvider().id).toBe('anthropic');
  });

  it('falls back to whichever provider IS configured when the preferred default is not', () => {
    anthropicConfigured = false;
    expect(getProvider().id).toBe('openai');
  });

  it('throws AIProviderError when no id is given and nothing is configured', () => {
    anthropicConfigured = false;
    openaiConfigured = false;
    expect(() => getProvider()).toThrow(AIProviderError);
  });
});
