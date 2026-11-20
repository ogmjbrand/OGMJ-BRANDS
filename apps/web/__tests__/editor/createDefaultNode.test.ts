import { describe, expect, it } from 'vitest';
import { createDefaultNode, freshNodeId, INSERTABLE_BLOCKS } from '@/lib/editor/createDefaultNode';
import { DEFAULT_BREAKPOINTS, DEFAULT_TOKEN_SET, validateDocument, type DocumentRoot } from '@/lib/document-model';

describe('createDefaultNode', () => {
  it('produces a node of the requested kind', () => {
    for (const { kind } of INSERTABLE_BLOCKS) {
      expect(createDefaultNode(kind).kind).toBe(kind);
    }
  });

  it('produces a schema-valid document when inserted at the root -- the palette can never hand insertNode something invalid', () => {
    for (const { kind } of INSERTABLE_BLOCKS) {
      const doc: DocumentRoot = {
        root: { id: 'root', kind: 'root', children: [createDefaultNode(kind)] },
        tokenSetId: DEFAULT_TOKEN_SET.id,
        breakpoints: DEFAULT_BREAKPOINTS,
        components: {},
        assets: {},
      };
      const result = validateDocument(doc);
      expect(result.success, `kind=${kind}: ${!result.success ? result.errors.join(', ') : ''}`).toBe(true);
    }
  });

  it('every call produces a distinct, collision-free id', () => {
    const ids = new Set(Array.from({ length: 20 }, () => createDefaultNode('text').id));
    expect(ids.size).toBe(20);
  });
});

describe('freshNodeId', () => {
  it('always returns a schema-safe identifier (letters, digits, underscore, hyphen only)', () => {
    for (let i = 0; i < 10; i++) {
      expect(freshNodeId('heading')).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });
});
