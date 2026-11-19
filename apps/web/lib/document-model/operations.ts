/**
 * Reversible document editing — the foundation both the future visual
 * editor's undo/redo and the AI Creative Director's "make a change,
 * inspect it, revert if it's worse" loop are built on. Every operation
 * knows how to compute its own inverse *before* it is applied, so a history
 * stack never has to guess how to undo something.
 */

import type { DocumentNode, DocumentOperation, DocumentRoot, OperationHistory, OperationHistoryEntry } from './types';
import { findNode, findParent, getNodeProp, insertNode, moveNode, removeNode, setNodeProp, updateNode } from './tree';

export class DocumentOperationError extends Error {}

/** Computes the inverse of `operation` against the document it is about to be applied to. */
export function invert(document: DocumentRoot, operation: DocumentOperation): DocumentOperation {
  switch (operation.op) {
    case 'insertNode':
      return { op: 'removeNode', nodeId: operation.node.id };

    case 'removeNode': {
      const located = findParent(document.root, operation.nodeId);
      const node = findNode(document.root, operation.nodeId);
      if (!located || !node) {
        throw new DocumentOperationError(`removeNode: node ${operation.nodeId} not found`);
      }
      return { op: 'insertNode', parentId: located.parent.id, index: located.index, node };
    }

    case 'moveNode': {
      const located = findParent(document.root, operation.nodeId);
      if (!located) throw new DocumentOperationError(`moveNode: node ${operation.nodeId} not found`);
      return { op: 'moveNode', nodeId: operation.nodeId, newParentId: located.parent.id, newIndex: located.index };
    }

    case 'updateNodeProps': {
      const node = findNode(document.root, operation.nodeId);
      if (!node) throw new DocumentOperationError(`updateNodeProps: node ${operation.nodeId} not found`);
      const previous = getNodeProp(node, operation.path);
      return { op: 'updateNodeProps', nodeId: operation.nodeId, path: operation.path, value: previous };
    }

    case 'setSlotContent': {
      const node = findNode(document.root, operation.nodeId);
      if (!node || node.kind !== 'componentInstance') {
        throw new DocumentOperationError(`setSlotContent: componentInstance ${operation.nodeId} not found`);
      }
      const previous = node.slotContent?.[operation.slotName] ?? [];
      return { op: 'setSlotContent', nodeId: operation.nodeId, slotName: operation.slotName, content: previous };
    }

    case 'applyVariant': {
      const node = findNode(document.root, operation.nodeId);
      if (!node || node.kind !== 'componentInstance') {
        throw new DocumentOperationError(`applyVariant: componentInstance ${operation.nodeId} not found`);
      }
      // variantId may be undefined if no variant was previously applied.
      return { op: 'applyVariant', nodeId: operation.nodeId, variantId: node.variantId as string };
    }

    default: {
      const exhaustive: never = operation;
      throw new DocumentOperationError(`Unknown operation: ${JSON.stringify(exhaustive)}`);
    }
  }
}

/** Applies `operation` to `document` and returns the new document plus the operation's inverse. */
export function applyOperation(
  document: DocumentRoot,
  operation: DocumentOperation
): { document: DocumentRoot; inverse: DocumentOperation } {
  const inverse = invert(document, operation);

  switch (operation.op) {
    case 'insertNode':
      return { document: { ...document, root: insertNode(document.root, operation.parentId, operation.index, operation.node) }, inverse };

    case 'removeNode':
      return { document: { ...document, root: removeNode(document.root, operation.nodeId) }, inverse };

    case 'moveNode':
      return { document: { ...document, root: moveNode(document.root, operation.nodeId, operation.newParentId, operation.newIndex) }, inverse };

    case 'updateNodeProps':
      return {
        document: { ...document, root: updateNode(document.root, operation.nodeId, (n) => setNodeProp(n, operation.path, operation.value)) },
        inverse,
      };

    case 'setSlotContent':
      return {
        document: {
          ...document,
          root: updateNode(document.root, operation.nodeId, (n) => {
            if (n.kind !== 'componentInstance') return n;
            return { ...n, slotContent: { ...n.slotContent, [operation.slotName]: operation.content } };
          }),
        },
        inverse,
      };

    case 'applyVariant':
      return {
        document: {
          ...document,
          root: updateNode(document.root, operation.nodeId, (n) => {
            if (n.kind !== 'componentInstance') return n;
            return { ...n, variantId: operation.variantId };
          }),
        },
        inverse,
      };

    default: {
      const exhaustive: never = operation;
      throw new DocumentOperationError(`Unknown operation: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export function emptyHistory(): OperationHistory {
  return { past: [], future: [] };
}

export function recordOperation(
  document: DocumentRoot,
  history: OperationHistory,
  operation: DocumentOperation,
  actor: 'user' | 'ai'
): { document: DocumentRoot; history: OperationHistory } {
  const { document: next, inverse } = applyOperation(document, operation);
  const entry: OperationHistoryEntry = { operation, inverse, at: new Date().toISOString(), actor };
  return { document: next, history: { past: [...history.past, entry], future: [] } };
}

export function undo(document: DocumentRoot, history: OperationHistory): { document: DocumentRoot; history: OperationHistory } {
  if (history.past.length === 0) return { document, history };
  const entry = history.past[history.past.length - 1];
  const { document: next } = applyOperation(document, entry.inverse);
  return {
    document: next,
    history: { past: history.past.slice(0, -1), future: [entry, ...history.future] },
  };
}

export function redo(document: DocumentRoot, history: OperationHistory): { document: DocumentRoot; history: OperationHistory } {
  if (history.future.length === 0) return { document, history };
  const entry = history.future[0];
  const { document: next } = applyOperation(document, entry.operation);
  return {
    document: next,
    history: { past: [...history.past, entry], future: history.future.slice(1) },
  };
}

// Re-exported so callers only need one import for "does this node exist" checks.
export type { DocumentNode };
