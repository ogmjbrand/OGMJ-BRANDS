import { describe, expect, it } from 'vitest';
import { cloneNodeWithFreshIds } from '@/lib/editor/duplicateNode';
import { insertNode } from '@/lib/document-model/tree';
import type { DocumentNode, RootNode } from '@/lib/document-model/types';

describe('cloneNodeWithFreshIds', () => {
  it('gives the clone (and every nested child) a fresh id, never reusing the original', () => {
    const original: DocumentNode = {
      id: 'section-1',
      kind: 'section',
      children: [
        { id: 'heading-1', kind: 'heading', text: 'Hi', level: 1 },
        { id: 'container-1', kind: 'container', children: [{ id: 'text-1', kind: 'text', text: 'Nested' }] },
      ],
    };
    const clone = cloneNodeWithFreshIds(original);
    const originalIds = new Set(['section-1', 'heading-1', 'container-1', 'text-1']);

    function collectIds(node: DocumentNode): string[] {
      const children = (node as { children?: DocumentNode[] }).children ?? [];
      return [node.id, ...children.flatMap(collectIds)];
    }
    const cloneIds = collectIds(clone);
    expect(cloneIds).toHaveLength(4);
    for (const id of cloneIds) expect(originalIds.has(id)).toBe(false);
  });

  it('preserves content (text, kind, style) exactly -- only ids change', () => {
    const original: DocumentNode = { id: 'h1', kind: 'heading', text: 'Preserved text', level: 2, style: { color: '#ff0000' } };
    const clone = cloneNodeWithFreshIds(original) as typeof original;
    expect(clone.text).toBe('Preserved text');
    expect(clone.level).toBe(2);
    expect(clone.style).toEqual({ color: '#ff0000' });
    expect(clone.id).not.toBe(original.id);
  });

  it('gives fresh ids to a componentInstance\'s slotContent nodes too, not just the instance itself', () => {
    const original: DocumentNode = {
      id: 'instance-1',
      kind: 'componentInstance',
      componentId: 'hero',
      slotContent: { body: [{ id: 'slot-text-1', kind: 'text', text: 'Slotted' }] },
    };
    const clone = cloneNodeWithFreshIds(original) as typeof original;
    expect(clone.id).not.toBe('instance-1');
    expect(clone.componentId).toBe('hero'); // the component reference itself is untouched
    expect(clone.slotContent?.body[0].id).not.toBe('slot-text-1');
    expect(clone.slotContent?.body[0].text).toBe('Slotted');
  });

  it('the clone can actually be inserted alongside the original without a duplicate-id error', () => {
    const original: DocumentNode = { id: 'text-1', kind: 'text', text: 'Original' };
    const root: RootNode = { id: 'root', kind: 'root', children: [original] };
    const clone = cloneNodeWithFreshIds(original);
    expect(() => insertNode(root, 'root', 1, clone)).not.toThrow();
  });
});
