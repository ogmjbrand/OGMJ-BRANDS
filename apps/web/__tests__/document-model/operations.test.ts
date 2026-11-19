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
