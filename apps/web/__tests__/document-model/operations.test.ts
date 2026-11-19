import { describe, expect, it } from 'vitest';
import { applyOperation, emptyHistory, recordOperation, redo, undo } from '@/lib/document-model/operations';
import { findNode } from '@/lib/document-model/tree';
import { DEFAULT_BREAKPOINTS, DEFAULT_TOKEN_SET } from '@/lib/document-model/tokens';
import type { DocumentNode, DocumentRoot } from '@/lib/document-model/types';

function baseDocument(): DocumentRoot {
  return {
    root: {
      id: 'root',
      kind: 'root',
      children: [
        { id: 'heading-1', kind: 'heading', text: 'Original heading', level: 2 },
        { id: 'section-1', kind: 'section', children: [] },
      ],
    },
    tokenSetId: DEFAULT_TOKEN_SET.id,
    breakpoints: DEFAULT_BREAKPOINTS,
    components: {},
    assets: {},
  };
}

describe('applyOperation + invert', () => {
  it('updateNodeProps changes exactly the targeted node, leaving every other node untouched', () => {
    const doc = baseDocument();
    const { document: next } = applyOperation(doc, { op: 'updateNodeProps', nodeId: 'heading-1', path: ['text'], value: 'Changed heading' });

    expect((findNode(next.root, 'heading-1') as { text: string }).text).toBe('Changed heading');
    // The untouched node must be the SAME reference -- proof nothing else was rebuilt.
    expect(findNode(next.root, 'section-1')).toBe(findNode(doc.root, 'section-1'));
  });

  it('insertNode + its own inverse round-trips to an equivalent document', () => {
    const doc = baseDocument();
    const newNode: DocumentNode = { id: 'text-1', kind: 'text', text: 'New paragraph' };
    const { document: afterInsert, inverse } = applyOperation(doc, { op: 'insertNode', parentId: 'section-1', index: 0, node: newNode });
    expect(findNode(afterInsert.root, 'text-1')).not.toBeNull();

    const { document: afterUndo } = applyOperation(afterInsert, inverse);
    expect(findNode(afterUndo.root, 'text-1')).toBeNull();
    expect(afterUndo).toEqual(doc);
  });

  it('moveNode relocates a node and its inverse restores the original position', () => {
    const doc = baseDocument();
    const { document: moved, inverse } = applyOperation(doc, { op: 'moveNode', nodeId: 'heading-1', newParentId: 'section-1', newIndex: 0 });
    expect((moved.root.children[0] as { id: string }).id).toBe('section-1');
    expect(((moved.root.children[0] as unknown as { children: DocumentNode[] }).children[0]).id).toBe('heading-1');

    const { document: restored } = applyOperation(moved, inverse);
    expect(restored).toEqual(doc);
  });

  it('removeNode + inverse restores the node at its original index among siblings', () => {
    const doc = baseDocument();
    const { document: removed, inverse } = applyOperation(doc, { op: 'removeNode', nodeId: 'heading-1' });
    expect(findNode(removed.root, 'heading-1')).toBeNull();

    const { document: restored } = applyOperation(removed, inverse);
    expect(restored.root.children.map((c) => c.id)).toEqual(['heading-1', 'section-1']);
  });
});

describe('undo/redo history', () => {
  it('undo reverts the most recent recorded operation; redo re-applies it', () => {
    let history = emptyHistory();
    let document = baseDocument();

    const step = recordOperation(document, history, { op: 'updateNodeProps', nodeId: 'heading-1', path: ['text'], value: 'AI-edited heading' }, 'ai');
    document = step.document;
    history = step.history;
    expect((findNode(document.root, 'heading-1') as { text: string }).text).toBe('AI-edited heading');
    expect(history.past[0].actor).toBe('ai');

    const undone = undo(document, history);
    expect((findNode(undone.document.root, 'heading-1') as { text: string }).text).toBe('Original heading');
    expect(undone.history.past).toHaveLength(0);
    expect(undone.history.future).toHaveLength(1);

    const redone = redo(undone.document, undone.history);
    expect((findNode(redone.document.root, 'heading-1') as { text: string }).text).toBe('AI-edited heading');
    expect(redone.history.past).toHaveLength(1);
    expect(redone.history.future).toHaveLength(0);
  });

  it('undo on empty history is a no-op', () => {
    const document = baseDocument();
    const history = emptyHistory();
    const result = undo(document, history);
    expect(result.document).toEqual(document);
    expect(result.history).toEqual(history);
  });
});

describe('undo exactness: setSlotContent and applyVariant restore the exact pre-edit shape', () => {
  function docWithInstance(): DocumentRoot {
    return {
      root: { id: 'root', kind: 'root', children: [{ id: 'instance-1', kind: 'componentInstance', componentId: 'callout' }] },
      tokenSetId: DEFAULT_TOKEN_SET.id,
      breakpoints: DEFAULT_BREAKPOINTS,
      components: { callout: { id: 'callout', name: 'Callout', propSchema: [], slots: ['body'], variants: [{ id: 'v1', name: 'V1' }], template: { id: 'tpl', kind: 'container', children: [{ id: 'tpl-slot', kind: 'slot', slotName: 'body' }] } } },
      assets: {},
    };
  }

  it('undoing the FIRST setSlotContent on a node removes the slotContent key entirely, not just empties it', () => {
    const doc = docWithInstance();
    const beforeNode = findNode(doc.root, 'instance-1');
    expect(beforeNode).not.toHaveProperty('slotContent');

    const { document: after, inverse } = applyOperation(doc, {
      op: 'setSlotContent', nodeId: 'instance-1', slotName: 'body', content: [{ id: 't1', kind: 'text', text: 'hi' }],
    });
    expect(findNode(after.root, 'instance-1')).toHaveProperty('slotContent.body');

    const { document: restored } = applyOperation(after, inverse);
    const restoredNode = restored.root.children[0];
    expect(restoredNode).toEqual(beforeNode); // byte-for-byte, not just behaviorally equivalent
    expect(restoredNode).not.toHaveProperty('slotContent');
  });

  it('undoing a setSlotContent that OVERWROTE a prior value restores that prior value, not an empty one', () => {
    let doc = docWithInstance();
    const first = applyOperation(doc, { op: 'setSlotContent', nodeId: 'instance-1', slotName: 'body', content: [{ id: 't1', kind: 'text', text: 'first' }] });
    doc = first.document;
    const second = applyOperation(doc, { op: 'setSlotContent', nodeId: 'instance-1', slotName: 'body', content: [{ id: 't2', kind: 'text', text: 'second' }] });

    const { document: restored } = applyOperation(second.document, second.inverse);
    expect(restored).toEqual(doc); // back to exactly the "first" state, not an empty slot
  });

  it('undoing the FIRST applyVariant on a node removes the variantId key entirely', () => {
    const doc = docWithInstance();
    const beforeNode = findNode(doc.root, 'instance-1');
    expect(beforeNode).not.toHaveProperty('variantId');

    const { document: after, inverse } = applyOperation(doc, { op: 'applyVariant', nodeId: 'instance-1', variantId: 'v1' });
    expect((findNode(after.root, 'instance-1') as { variantId?: string }).variantId).toBe('v1');

    const { document: restored } = applyOperation(after, inverse);
    expect(restored.root.children[0]).toEqual(beforeNode);
    expect(restored.root.children[0]).not.toHaveProperty('variantId');
  });
});

describe('multi-step undo/redo across nested structures, verified by deep structural equality at every checkpoint', () => {
  it('5 sequential operations (including a component instance): full undo to origin, full redo back', () => {
    let doc: DocumentRoot = {
      root: { id: 'root', kind: 'root', children: [{ id: 'section-1', kind: 'section', children: [{ id: 'heading-1', kind: 'heading', text: 'Start', level: 2 }] }] },
      tokenSetId: DEFAULT_TOKEN_SET.id,
      breakpoints: DEFAULT_BREAKPOINTS,
      components: { callout: { id: 'callout', name: 'Callout', propSchema: [], slots: ['body'], variants: [{ id: 'v1', name: 'V1' }], template: { id: 'tpl', kind: 'container', children: [{ id: 'tpl-slot', kind: 'slot', slotName: 'body' }] } } },
      assets: {},
    };
    let history = emptyHistory();
    const snapshots: DocumentRoot[] = [structuredClone(doc)];

    const ops = [
      { op: 'updateNodeProps' as const, nodeId: 'heading-1', path: ['text'], value: 'Step 1' },
      { op: 'insertNode' as const, parentId: 'section-1', index: 1, node: { id: 'instance-1', kind: 'componentInstance' as const, componentId: 'callout' } },
      { op: 'setSlotContent' as const, nodeId: 'instance-1', slotName: 'body', content: [{ id: 'slot-text-1', kind: 'text' as const, text: 'Nested content' }] },
      { op: 'applyVariant' as const, nodeId: 'instance-1', variantId: 'v1' },
      { op: 'moveNode' as const, nodeId: 'heading-1', newParentId: 'root', newIndex: 0 },
    ];

    for (const operation of ops) {
      const result = recordOperation(doc, history, operation, 'user');
      doc = result.document;
      history = result.history;
      snapshots.push(structuredClone(doc));
    }

    expect((findNode(doc.root, 'heading-1') as { text: string }).text).toBe('Step 1');
    expect((findNode(doc.root, 'instance-1') as { variantId?: string }).variantId).toBe('v1');

    // Undo all 5, checking deep structural equality against the exact recorded snapshot at each step.
    for (let i = ops.length; i >= 1; i--) {
      const result = undo(doc, history);
      doc = result.document;
      history = result.history;
      expect(doc).toEqual(snapshots[i - 1]);
    }
    expect(history.past).toHaveLength(0);
    expect(history.future).toHaveLength(5);
    expect(doc).toEqual(snapshots[0]); // back to the exact origin, not just a behaviorally-equivalent document

    // Redo all 5 forward, checking every checkpoint again.
    for (let i = 1; i <= ops.length; i++) {
      const result = redo(doc, history);
      doc = result.document;
      history = result.history;
      expect(doc).toEqual(snapshots[i]);
    }
    expect(history.past).toHaveLength(5);
    expect(history.future).toHaveLength(0);
  });
});
