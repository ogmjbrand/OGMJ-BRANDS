/**
 * Reversible document editing — the foundation both the future visual
 * editor's undo/redo and the AI Creative Director's "make a change,
 * inspect it, revert if it's worse" loop are built on. Every operation
 * knows how to compute its own inverse *before* it is applied, so a history
 * stack never has to guess how to undo something.
 */

import type { DocumentNode, DocumentOperation, DocumentRoot, OperationHistory, OperationHistoryEntry } from './types';
import { DocumentOperationError, findNode, findParent, getNodeProp, insertNode, moveNode, removeNode, setNodeProp, updateNode } from './tree';
import { isSafeIdentifier, safeObjectLookup } from './security';

export { DocumentOperationError };

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
      // `undefined` (not `[]`) when the slot had no key at all, so undo can
      // delete the key and restore the exact pre-edit shape -- see the
      // apply-side 'setSlotContent' case below.
      const previous = node.slotContent?.[operation.slotName];
      return { op: 'setSlotContent', nodeId: operation.nodeId, slotName: operation.slotName, content: previous };
    }

    case 'applyVariant': {
      const node = findNode(document.root, operation.nodeId);
      if (!node || node.kind !== 'componentInstance') {
        throw new DocumentOperationError(`applyVariant: componentInstance ${operation.nodeId} not found`);
      }
      // undefined (not a cast to string) when no variant was previously applied -- see note above.
      return { op: 'applyVariant', nodeId: operation.nodeId, variantId: node.variantId };
    }

    case 'upsertAsset':
      // Prior value (or undefined if it didn't exist) -- same "undefined
      // means absent, not an empty placeholder" convention as setSlotContent/applyVariant above.
      // safeObjectLookup (not a raw `document.assets[id]`) so an unsafe id
      // can never resolve to Object.prototype here either.
      return { op: 'upsertAsset', assetId: operation.assetId, asset: safeObjectLookup(document.assets, operation.assetId) };

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
            // `content === undefined` restores "this slot key never existed" exactly,
            // rather than leaving behind an empty-but-present `slotContent: {}`.
            if (operation.content === undefined) {
              if (!n.slotContent || !(operation.slotName in n.slotContent)) return n;
              const nextSlotContent = { ...n.slotContent };
              delete nextSlotContent[operation.slotName];
              if (Object.keys(nextSlotContent).length === 0) {
                const { slotContent, ...rest } = n;
                void slotContent;
                return rest;
              }
              return { ...n, slotContent: nextSlotContent };
            }
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
            // `variantId === undefined` removes the key entirely, restoring
            // "no variant was ever applied" exactly rather than an explicit
            // `variantId: undefined` key.
            if (operation.variantId === undefined) {
              if (!('variantId' in n)) return n;
              const { variantId, ...rest } = n;
              void variantId;
              return rest;
            }
            return { ...n, variantId: operation.variantId };
          }),
        },
        inverse,
      };

    case 'upsertAsset': {
      // SECURITY: assetId is a document-supplied key written into a plain
      // object -- __proto__/constructor/prototype must never reach a spread
      // or delete on document.assets (see safeObjectLookup's doc comment).
      if (!isSafeIdentifier(operation.assetId)) {
        throw new DocumentOperationError(`upsertAsset: "${operation.assetId}" is not a safe asset id`);
      }
      const nextAssets = { ...document.assets };
      if (operation.asset === undefined) {
        delete nextAssets[operation.assetId];
      } else {
        nextAssets[operation.assetId] = operation.asset;
      }
      return { document: { ...document, assets: nextAssets }, inverse };
    }

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
