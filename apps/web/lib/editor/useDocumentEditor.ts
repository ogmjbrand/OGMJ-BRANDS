'use client';

/**
 * The editor's only mutation surface. Every change — a click in the
 * inspector, a drag in the canvas, a future AI-proposed edit — becomes a
 * `DocumentOperation` and goes through `recordOperation`/`undo`/`redo` from
 * `@/lib/document-model`, never a direct object mutation. That's what keeps
 * undo/redo exact and lets a future AI Creative Director apply edits through
 * the exact same, already-reviewed reversible-editing system (each history
 * entry already carries an `actor: 'user' | 'ai'` tag for that reason).
 */
import { useCallback, useReducer } from 'react';
import {
  recordOperation,
  undo as undoHistory,
  redo as redoHistory,
  emptyHistory,
  type DocumentOperation,
  type DocumentRoot,
  type NodeId,
  type OperationHistory,
} from '@/lib/document-model';

export type ViewportKey = 'base' | 'md' | 'lg';

export const VIEWPORTS: Array<{ key: ViewportKey; label: string; widthPx: number }> = [
  { key: 'base', label: 'Mobile', widthPx: 375 },
  { key: 'md', label: 'Tablet', widthPx: 768 },
  { key: 'lg', label: 'Desktop', widthPx: 1280 },
];

export interface EditorState {
  document: DocumentRoot;
  history: OperationHistory;
  selectedNodeId: NodeId | null;
  viewport: ViewportKey;
  dirty: boolean;
  lastError: string | null;
}

export type EditorAction =
  | { type: 'apply'; operation: DocumentOperation }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'select'; nodeId: NodeId | null }
  | { type: 'setViewport'; viewport: ViewportKey }
  | { type: 'markSaved' }
  | { type: 'reset'; document: DocumentRoot };

export function initialEditorState(document: DocumentRoot): EditorState {
  return {
    document,
    history: emptyHistory(),
    selectedNodeId: null,
    viewport: 'lg',
    dirty: false,
    lastError: null,
  };
}

/** Pure, framework-free -- exported so its behavior is unit-testable without rendering a component. */
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'apply': {
      try {
        const { document, history } = recordOperation(state.document, state.history, action.operation, 'user');
        return { ...state, document, history, dirty: true, lastError: null };
      } catch (err) {
        // A rejected operation (e.g. a stale drag target) must never corrupt
        // the document -- recordOperation only returns on success, so on a
        // thrown DocumentOperationError the previous state is kept as-is.
        return { ...state, lastError: err instanceof Error ? err.message : 'Edit failed' };
      }
    }
    case 'undo': {
      const result = undoHistory(state.document, state.history);
      return { ...state, document: result.document, history: result.history, dirty: true };
    }
    case 'redo': {
      const result = redoHistory(state.document, state.history);
      return { ...state, document: result.document, history: result.history, dirty: true };
    }
    case 'select':
      return { ...state, selectedNodeId: action.nodeId };
    case 'setViewport':
      return { ...state, viewport: action.viewport };
    case 'markSaved':
      return { ...state, dirty: false };
    case 'reset':
      return { document: action.document, history: emptyHistory(), selectedNodeId: null, viewport: state.viewport, dirty: false, lastError: null };
    default:
      return state;
  }
}

export function useDocumentEditor(initialDocument: DocumentRoot) {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState(initialDocument));

  const apply = useCallback((operation: DocumentOperation) => dispatch({ type: 'apply', operation }), []);
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  const select = useCallback((nodeId: NodeId | null) => dispatch({ type: 'select', nodeId }), []);
  const setViewport = useCallback((viewport: ViewportKey) => dispatch({ type: 'setViewport', viewport }), []);
  const markSaved = useCallback(() => dispatch({ type: 'markSaved' }), []);
  const reset = useCallback((document: DocumentRoot) => dispatch({ type: 'reset', document }), []);

  return {
    document: state.document,
    history: state.history,
    selectedNodeId: state.selectedNodeId,
    viewport: state.viewport,
    dirty: state.dirty,
    lastError: state.lastError,
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
    apply,
    undo,
    redo,
    select,
    setViewport,
    markSaved,
    reset,
  };
}

export type DocumentEditor = ReturnType<typeof useDocumentEditor>;
