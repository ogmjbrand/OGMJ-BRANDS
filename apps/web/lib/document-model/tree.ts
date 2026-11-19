/**
 * Pure tree-walking helpers shared by the renderer, the operation reducer,
 * and validation. Nothing here mutates its input.
 */

import type { DocumentNode, NodeId, RootNode } from './types';

/** Node kinds that can have children, for a single place to teach new container kinds about nesting. */
export function getChildren(node: DocumentNode): DocumentNode[] | undefined {
  switch (node.kind) {
    case 'root':
    case 'section':
    case 'container':
      return node.children;
    case 'custom':
      return node.children;
    default:
      return undefined;
  }
}

function withChildren(node: DocumentNode, children: DocumentNode[]): DocumentNode {
  switch (node.kind) {
    case 'root':
    case 'section':
    case 'container':
      return { ...node, children };
    case 'custom':
      return { ...node, children };
    default:
      return node;
  }
}

/** Depth-first traversal, parent-before-child. */
export function* walk(node: DocumentNode): Generator<DocumentNode> {
  yield node;
  const children = getChildren(node);
  if (children) {
    for (const child of children) yield* walk(child);
  }
}

export function findNode(root: RootNode, nodeId: NodeId): DocumentNode | null {
  for (const node of walk(root)) {
    if (node.id === nodeId) return node;
  }
  return null;
}

export function findParent(root: RootNode, nodeId: NodeId): { parent: DocumentNode; index: number } | null {
  for (const node of walk(root)) {
    const children = getChildren(node);
    if (!children) continue;
    const index = children.findIndex((c) => c.id === nodeId);
    if (index !== -1) return { parent: node, index };
  }
  return null;
}

/** Returns a new tree with `nodeId` replaced by the result of `updater`, or the original tree if not found. */
export function updateNode(
  root: RootNode,
  nodeId: NodeId,
  updater: (node: DocumentNode) => DocumentNode
): RootNode {
  function recurse(node: DocumentNode): DocumentNode {
    if (node.id === nodeId) return updater(node);
    const children = getChildren(node);
    if (!children) return node;
    let changed = false;
    const nextChildren = children.map((child) => {
      const next = recurse(child);
      if (next !== child) changed = true;
      return next;
    });
    return changed ? withChildren(node, nextChildren) : node;
  }
  return recurse(root) as RootNode;
}

export function removeNode(root: RootNode, nodeId: NodeId): RootNode {
  function recurse(node: DocumentNode): DocumentNode {
    const children = getChildren(node);
    if (!children) return node;
    const filtered = children.filter((c) => c.id !== nodeId).map(recurse);
    return withChildren(node, filtered);
  }
  return recurse(root) as RootNode;
}

export function insertNode(root: RootNode, parentId: NodeId, index: number, node: DocumentNode): RootNode {
  function recurse(target: DocumentNode): DocumentNode {
    if (target.id === parentId) {
      const children = getChildren(target) ?? [];
      const next = [...children.slice(0, index), node, ...children.slice(index)];
      return withChildren(target, next);
    }
    const children = getChildren(target);
    if (!children) return target;
    return withChildren(target, children.map(recurse));
  }
  return recurse(root) as RootNode;
}

export function moveNode(root: RootNode, nodeId: NodeId, newParentId: NodeId, newIndex: number): RootNode {
  const node = findNode(root, nodeId);
  if (!node) return root;
  const withoutNode = removeNode(root, nodeId);
  return insertNode(withoutNode, newParentId, newIndex, node);
}

/** Set a (possibly nested) property on a node by a dot/bracket-free path of plain keys. */
export function setNodeProp(node: DocumentNode, path: string[], value: unknown): DocumentNode {
  if (path.length === 0) return node;
  const clone: Record<string, unknown> = { ...(node as unknown as Record<string, unknown>) };
  let cursor: Record<string, unknown> = clone;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const existing = cursor[key];
    const next = existing && typeof existing === 'object' ? { ...(existing as Record<string, unknown>) } : {};
    cursor[key] = next;
    cursor = next;
  }
  cursor[path[path.length - 1]] = value;
  return clone as unknown as DocumentNode;
}

/** Reads a nested property for building an operation's inverse before mutating. */
export function getNodeProp(node: DocumentNode, path: string[]): unknown {
  let cursor: unknown = node;
  for (const key of path) {
    if (cursor == null || typeof cursor !== 'object') return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}
