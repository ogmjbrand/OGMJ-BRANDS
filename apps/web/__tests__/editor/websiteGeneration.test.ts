import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  buildGenerationInstruction,
  documentNeedsPresetSeed,
  presetSeedOperations,
  stashGenerationRequest,
  takeGenerationRequest,
} from '@/lib/editor/websiteGeneration';
import { PRESET_COMPONENTS } from '@/lib/editor/presetComponents';

describe('buildGenerationInstruction', () => {
  it('includes the business description verbatim', () => {
    const instruction = buildGenerationInstruction({ description: 'A family-run bakery in Lagos.' });
    expect(instruction).toContain('A family-run bakery in Lagos.');
  });

  it('includes requirements when given, and omits the section entirely when not', () => {
    const withReq = buildGenerationInstruction({ description: 'x', requirements: 'Include a pricing page link.' });
    expect(withReq).toContain('Specific requirements:');
    expect(withReq).toContain('Include a pricing page link.');

    const withoutReq = buildGenerationInstruction({ description: 'x' });
    expect(withoutReq).not.toContain('Specific requirements:');
  });

  it('never fabricates -- explicitly instructs against inventing testimonials/stats/facts', () => {
    const instruction = buildGenerationInstruction({ description: 'x' });
    expect(instruction.toLowerCase()).toContain('do not invent specific facts');
    expect(instruction.toLowerCase()).toContain('fabricated testimonials');
  });

  it('asks for responsive desktop and mobile layouts', () => {
    const instruction = buildGenerationInstruction({ description: 'x' });
    expect(instruction.toLowerCase()).toContain('desktop and mobile');
  });

  it('trims surrounding whitespace from both fields', () => {
    const instruction = buildGenerationInstruction({ description: '  trimmed description  ', requirements: '  trimmed requirement  ' });
    expect(instruction).toContain('trimmed description');
    expect(instruction).not.toContain('  trimmed description  ');
    expect(instruction).toContain('trimmed requirement');
  });
});

describe('documentNeedsPresetSeed', () => {
  it('is true for an empty/missing components map', () => {
    expect(documentNeedsPresetSeed({ components: {} })).toBe(true);
    expect(documentNeedsPresetSeed({})).toBe(true);
  });

  it('is false once at least one component definition exists', () => {
    expect(documentNeedsPresetSeed({ components: { navbar: {} as never } })).toBe(false);
  });
});

describe('presetSeedOperations', () => {
  it('returns one upsertComponent operation per preset, matching PRESET_COMPONENTS exactly', () => {
    const ops = presetSeedOperations();
    expect(ops).toHaveLength(PRESET_COMPONENTS.length);
    for (const op of ops) {
      expect(op.op).toBe('upsertComponent');
    }
    const opIds = ops.map((op) => (op as { componentId: string }).componentId).sort();
    const presetIds = PRESET_COMPONENTS.map((p) => p.id).sort();
    expect(opIds).toEqual(presetIds);
  });

  it('uses the real preset definitions, not placeholders', () => {
    const ops = presetSeedOperations();
    const first = ops[0] as { definition: unknown };
    expect(first.definition).toBe(PRESET_COMPONENTS[0]);
  });
});

/**
 * This repo's vitest environment is plain Node (see vitest.config.ts), not
 * jsdom -- `sessionStorage` isn't a real global here the way it is in a
 * browser. A minimal in-memory stand-in (get/set/remove/clear) is enough
 * for stashGenerationRequest/takeGenerationRequest's actual usage, without
 * pulling in a new test-environment dependency for one module.
 */
class MemorySessionStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

describe('stashGenerationRequest / takeGenerationRequest', () => {
  const pageId = 'page-123';

  beforeEach(() => {
    (globalThis as { sessionStorage?: unknown }).sessionStorage = new MemorySessionStorage();
  });

  afterEach(() => {
    delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
  });

  it('round-trips a stashed request for the exact page id', () => {
    stashGenerationRequest(pageId, { description: 'A bakery.', requirements: 'Mention our sourdough.' });
    const taken = takeGenerationRequest(pageId);
    expect(taken).toEqual({ description: 'A bakery.', requirements: 'Mention our sourdough.' });
  });

  it('is consumed exactly once -- a second read returns null', () => {
    stashGenerationRequest(pageId, { description: 'A bakery.' });
    expect(takeGenerationRequest(pageId)).not.toBeNull();
    expect(takeGenerationRequest(pageId)).toBeNull();
  });

  it('returns null for a page id nothing was stashed for', () => {
    expect(takeGenerationRequest('some-other-page')).toBeNull();
  });

  it('omits requirements entirely when none were given', () => {
    stashGenerationRequest(pageId, { description: 'A bakery.' });
    const taken = takeGenerationRequest(pageId);
    expect(taken?.requirements).toBeUndefined();
  });

  it('returns null rather than throwing on malformed stored JSON', () => {
    sessionStorage.setItem('ogmj:ai-website-generate:' + pageId, 'not valid json');
    expect(() => takeGenerationRequest(pageId)).not.toThrow();
    expect(takeGenerationRequest(pageId)).toBeNull();
  });

  it('returns null and does not throw when description is missing or not a string', () => {
    sessionStorage.setItem('ogmj:ai-website-generate:' + pageId, JSON.stringify({ requirements: 'x' }));
    expect(takeGenerationRequest(pageId)).toBeNull();
  });
});
