/**
 * Pure tree-walking helpers shared by the renderer, the operation reducer,
 * and validation. Nothing here mutates its input.
 *
 * `insertNode` and `moveNode` validate their target before touching
 * anything and THROW `DocumentOperationError` for an invalid request
 * (unknown target, a target kind that cannot hold children, a duplicate
 * id, or a move that would make a node its own ancestor) rather than
 * silently doing nothing. Because every function here is pure --- it
 * builds and returns a new tree instead of mutating `root` --- a thrown
 * error means the caller's existing `root` reference is simply never
 * replaced; the original document is never partially modified.
 */

import type { DocumentNode, NodeId, RootNode } from './types';

/** Thrown by an invalid tree operation (see module doc above). Never swallowed -- callers must handle or propagate it. */
export class DocumentOperationError extends Error {}

/** Node kinds `insertNode`/`moveNode` are allowed to target as a new parent. Keep in sync with `getChildren`/`withChildren` below. */
const CONTAINER_KINDS = new Set<DocumentNode['kind']>(['root', 'section', 'container', 'custom']);

export function canHaveChildren(node: DocumentNode): boolean {
  return CONTAINER_KINDS.has(node.kind);
}

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

/** Every id in `node`'s own subtree (including `node.id` itself), for duplicate- and circularity-checking before a mutation. */
function idsInSubtree(node: DocumentNode): Set<NodeId> {
  const ids = new Set<NodeId>();
  for (const n of walk(node)) ids.add(n.id);
  return ids;
}

export function insertNode(root: RootNode, parentId: NodeId, index: number, node: DocumentNode): RootNode {
  const target = findNode(root, parentId);
  if (!target) {
    throw new DocumentOperationError(`insertNode: target parent "${parentId}" does not exist`);
  }
  if (!canHaveChildren(target)) {
    throw new DocumentOperationError(`insertNode: node "${parentId}" is of kind "${target.kind}", which cannot hold children`);
  }

  const incomingIds = idsInSubtree(node);
  const existingIds = idsInSubtree(root);
  const collisions = [...incomingIds].filter((id) => existingIds.has(id));
  if (collisions.length > 0) {
    throw new DocumentOperationError(`insertNode: duplicate node id(s) already present in the document: ${collisions.join(', ')}`);
  }

  function recurse(current: DocumentNode): DocumentNode {
    if (current.id === parentId) {
      const children = getChildren(current) ?? [];
      const clampedIndex = Math.max(0, Math.min(index, children.length));
      const next = [...children.slice(0, clampedIndex), node, ...children.slice(clampedIndex)];
      return withChildren(current, next);
    }
    const children = getChildren(current);
    if (!children) return current;
    return withChildren(current, children.map(recurse));
  }
  return recurse(root) as RootNode;
}

export function moveNode(root: RootNode, nodeId: NodeId, newParentId: NodeId, newIndex: number): RootNode {
  const node = findNode(root, nodeId);
  if (!node) {
    throw new DocumentOperationError(`moveNode: node "${nodeId}" does not exist`);
  }
  const newParent = findNode(root, newParentId);
  if (!newParent) {
    throw new DocumentOperationError(`moveNode: target parent "${newParentId}" does not exist`);
  }
  if (!canHaveChildren(newParent)) {
    throw new DocumentOperationError(`moveNode: node "${newParentId}" is of kind "${newParent.kind}", which cannot hold children`);
  }
  if (newParentId === nodeId || idsInSubtree(node).has(newParentId)) {
    throw new DocumentOperationError(
      `moveNode: cannot move "${nodeId}" into "${newParentId}" -- it is the node itself or one of its own descendants, which would create a circular reference`
    );
  }

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
