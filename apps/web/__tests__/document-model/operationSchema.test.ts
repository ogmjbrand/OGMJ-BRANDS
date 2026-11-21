import { describe, expect, it } from 'vitest';
import { validateOperation } from '@/lib/document-model/operationSchema';
import { MAX_DOCUMENT_DEPTH } from '@/lib/document-model/security';

describe('validateOperation', () => {
  it('accepts a well-formed insertNode operation', () => {
    const result = validateOperation({ op: 'insertNode', parentId: 'section-1', index: 0, node: { id: 'h1', kind: 'heading', text: 'Hi', level: 1 } });
    expect(result.success).toBe(true);
    expect(result.operation?.op).toBe('insertNode');
  });

  it('accepts every real operation kind with a minimal valid shape', () => {
    const cases: unknown[] = [
      { op: 'removeNode', nodeId: 'n1' },
      { op: 'moveNode', nodeId: 'n1', newParentId: 'n2', newIndex: 0 },
      { op: 'updateNodeProps', nodeId: 'n1', path: ['text'], value: 'new text' },
      { op: 'setSlotContent', nodeId: 'n1', slotName: 'body', content: [{ id: 'c1', kind: 'text', text: 'x' }] },
      { op: 'setSlotContent', nodeId: 'n1', slotName: 'body' }, // content omitted = clear the slot
      { op: 'applyVariant', nodeId: 'n1', variantId: 'v1' },
      { op: 'applyVariant', nodeId: 'n1' }, // variantId omitted = clear the variant
      { op: 'upsertAsset', assetId: 'a1', asset: { id: 'a1', kind: 'image', url: 'https://example.com/x.jpg' } },
      { op: 'upsertAsset', assetId: 'a1' }, // asset omitted = delete
      {
        op: 'upsertComponent',
        componentId: 'c1',
        definition: { id: 'c1', name: 'Hero', propSchema: [], slots: [], variants: [], template: { id: 't1', kind: 'container', children: [] } },
      },
    ];
    for (const c of cases) {
      const result = validateOperation(c);
      expect(result.success, `expected success for ${JSON.stringify(c)}: ${result.errors.join('; ')}`).toBe(true);
    }
  });

  it('rejects an unknown op', () => {
    const result = validateOperation({ op: 'deleteEverything', nodeId: 'root' });
    expect(result.success).toBe(false);
  });

  it('rejects a path segment that is __proto__/constructor/prototype', () => {
    for (const dangerous of ['__proto__', 'constructor', 'prototype']) {
      const result = validateOperation({ op: 'updateNodeProps', nodeId: 'n1', path: [dangerous], value: 'x' });
      expect(result.success, `expected rejection for path segment "${dangerous}"`).toBe(false);
    }
  });

  it('rejects an unsafe node id', () => {
    const result = validateOperation({ op: 'removeNode', nodeId: '__proto__' });
    expect(result.success).toBe(false);
  });

  it('rejects an unsafe href inside an embedded node (reuses documentNodeSchema\'s own safeHref check)', () => {
    const result = validateOperation({
      op: 'insertNode',
      parentId: 'root',
      index: 0,
      node: { id: 'btn1', kind: 'button', label: 'Click', href: 'javascript:alert(1)' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a pathologically deep embedded node BEFORE it would reach the recursive Zod parse', () => {
    let node: unknown = { id: 'leaf', kind: 'heading', text: 'x', level: 1 };
    for (let i = 0; i < MAX_DOCUMENT_DEPTH + 10; i++) {
      node = { id: `n${i}`, kind: 'container', children: [node] };
    }
    const result = validateOperation({ op: 'insertNode', parentId: 'root', index: 0, node });
    expect(result.success).toBe(false);
    expect(result.errors.join(' ')).toContain('depth');
  });

  it('rejects a pathologically deep template embedded in upsertComponent', () => {
    let node: unknown = { id: 'leaf', kind: 'heading', text: 'x', level: 1 };
    for (let i = 0; i < MAX_DOCUMENT_DEPTH + 10; i++) {
      node = { id: `n${i}`, kind: 'container', children: [node] };
    }
    const result = validateOperation({
      op: 'upsertComponent',
      componentId: 'c1',
      definition: { id: 'c1', name: 'Evil', propSchema: [], slots: [], variants: [], template: node },
    });
    expect(result.success).toBe(false);
    expect(result.errors.join(' ')).toContain('depth');
  });

  it('rejects a pathologically deep content array embedded in setSlotContent', () => {
    let node: unknown = { id: 'leaf', kind: 'heading', text: 'x', level: 1 };
    for (let i = 0; i < MAX_DOCUMENT_DEPTH + 10; i++) {
      node = { id: `n${i}`, kind: 'container', children: [node] };
    }
    const result = validateOperation({ op: 'setSlotContent', nodeId: 'n1', slotName: 'body', content: [node] });
    expect(result.success).toBe(false);
    expect(result.errors.join(' ')).toContain('depth');
  });

  it('rejects a non-object / garbage input without throwing', () => {
    expect(() => validateOperation('not an operation')).not.toThrow();
    expect(validateOperation('not an operation').success).toBe(false);
    expect(() => validateOperation(null)).not.toThrow();
    expect(validateOperation(null).success).toBe(false);
  });
});
