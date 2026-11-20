import { describe, expect, it } from 'vitest';
import { editorReducer, initialEditorState } from '@/lib/editor/useDocumentEditor';
import { DEFAULT_BREAKPOINTS, DEFAULT_TOKEN_SET, type DocumentRoot } from '@/lib/document-model';

function emptyDoc(): DocumentRoot {
  return {
    root: { id: 'root', kind: 'root', children: [{ id: 'h1', kind: 'heading', text: 'Hello', level: 1 }] },
    tokenSetId: DEFAULT_TOKEN_SET.id,
    breakpoints: DEFAULT_BREAKPOINTS,
    components: {},
    assets: {},
  };
}

describe('editorReducer', () => {
  it('applies an operation, marks the state dirty, and records undo history', () => {
    const state = initialEditorState(emptyDoc());
    const next = editorReducer(state, { type: 'apply', operation: { op: 'updateNodeProps', nodeId: 'h1', path: ['text'], value: 'Updated' } });
    expect((next.document.root.children[0] as { text: string }).text).toBe('Updated');
    expect(next.dirty).toBe(true);
    expect(next.history.past).toHaveLength(1);
    expect(next.history.future).toHaveLength(0);
  });

  it('undo reverts the most recent operation and moves it to future', () => {
    const state = initialEditorState(emptyDoc());
    const afterApply = editorReducer(state, { type: 'apply', operation: { op: 'updateNodeProps', nodeId: 'h1', path: ['text'], value: 'Updated' } });
    const afterUndo = editorReducer(afterApply, { type: 'undo' });
    expect((afterUndo.document.root.children[0] as { text: string }).text).toBe('Hello');
    expect(afterUndo.history.past).toHaveLength(0);
    expect(afterUndo.history.future).toHaveLength(1);
  });

  it('redo re-applies an undone operation', () => {
    const state = initialEditorState(emptyDoc());
    const afterApply = editorReducer(state, { type: 'apply', operation: { op: 'updateNodeProps', nodeId: 'h1', path: ['text'], value: 'Updated' } });
    const afterUndo = editorReducer(afterApply, { type: 'undo' });
    const afterRedo = editorReducer(afterUndo, { type: 'redo' });
    expect((afterRedo.document.root.children[0] as { text: string }).text).toBe('Updated');
    expect(afterRedo.history.past).toHaveLength(1);
  });

  it('a new apply after an undo discards the old future (standard undo/redo branching)', () => {
    const state = initialEditorState(emptyDoc());
    const a = editorReducer(state, { type: 'apply', operation: { op: 'updateNodeProps', nodeId: 'h1', path: ['text'], value: 'A' } });
    const undone = editorReducer(a, { type: 'undo' });
    const b = editorReducer(undone, { type: 'apply', operation: { op: 'updateNodeProps', nodeId: 'h1', path: ['text'], value: 'B' } });
    expect(b.history.future).toHaveLength(0);
    expect((b.document.root.children[0] as { text: string }).text).toBe('B');
  });

  it('a rejected operation (invalid target) leaves the document and history completely untouched, and records a readable error', () => {
    const state = initialEditorState(emptyDoc());
    const next = editorReducer(state, {
      type: 'apply',
      operation: { op: 'insertNode', parentId: 'does-not-exist', index: 0, node: { id: 'new', kind: 'text', text: 'x' } },
    });
    expect(next.document).toBe(state.document); // same reference -- nothing was touched
    expect(next.history.past).toHaveLength(0);
    expect(next.dirty).toBe(false);
    expect(next.lastError).toBeTruthy();
  });

  it('select / setViewport / markSaved update only their own field', () => {
    const state = initialEditorState(emptyDoc());
    expect(editorReducer(state, { type: 'select', nodeId: 'h1' }).selectedNodeId).toBe('h1');
    expect(editorReducer(state, { type: 'setViewport', viewport: 'base' }).viewport).toBe('base');
    const dirty = { ...state, dirty: true };
    expect(editorReducer(dirty, { type: 'markSaved' }).dirty).toBe(false);
  });

  it('undo/redo on empty history is a safe no-op', () => {
    const state = initialEditorState(emptyDoc());
    expect(editorReducer(state, { type: 'undo' }).document).toBe(state.document);
    expect(editorReducer(state, { type: 'redo' }).document).toBe(state.document);
  });
});
