/**
 * Shared convention between `presetComponents.ts` (and any user-authored
 * component) and the Components-aware Inspector UI: a `ComponentPropDef`'s
 * `name` is `"<templateNodeId>__<field>"` -- see presetComponents.ts's
 * module doc comment for why double-underscore rather than a dot. This is
 * the one place that string gets parsed back apart, so the Inspector and
 * any future caller agree on the split.
 */
import { getChildren } from '@/lib/document-model/tree';
import { isSafeIdentifier } from '@/lib/document-model/security';
import type { DocumentNode, SlotNode } from '@/lib/document-model/types';
import { freshNodeId } from './createDefaultNode';

export interface ParsedPropName {
  nodeId: string;
  field: string;
}

/**
 * Splits on the LAST `__` so a node id containing its own underscores
 * (never produced by presetComponents.ts, but not disallowed by
 * `isSafeIdentifier`) still parses correctly -- the field segment is
 * always the final one.
 */
export function parsePropSchemaName(name: string): ParsedPropName | null {
  const splitAt = name.lastIndexOf('__');
  if (splitAt <= 0 || splitAt >= name.length - 2) return null;
  const nodeId = name.slice(0, splitAt);
  const field = name.slice(splitAt + 2);
  if (!isSafeIdentifier(nodeId) || !isSafeIdentifier(field)) return null;
  return { nodeId, field };
}

/** A short, human-facing label derived from a parsed prop name -- "Hero Cta" + "Label" -> "Hero Cta — Label". */
export function friendlyPropLabel(parsed: ParsedPropName): string {
  const nodePart = parsed.nodeId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const fieldPart = parsed.field.charAt(0).toUpperCase() + parsed.field.slice(1);
  return `${nodePart} — ${fieldPart}`;
}

/**
 * Finds a node by id inside a component's `template`, including a slot's
 * own `defaultContent` -- `getChildren`/`findNode` in tree.ts deliberately
 * don't descend there (that distinction is for the insert/move/remove
 * container semantics; see DocumentRenderer.tsx's `childrenForTraversal`
 * for the render-side version of this same need). Used to read a
 * propSchema-described field's TEMPLATE default when no variant/instance
 * override has set it yet.
 */
export function findNodeIncludingSlotDefaults(node: DocumentNode, nodeId: string): DocumentNode | null {
  if (node.id === nodeId) return node;
  const children = node.kind === 'slot' ? node.defaultContent ?? [] : getChildren(node) ?? [];
  for (const child of children) {
    const found = findNodeIncludingSlotDefaults(child, nodeId);
    if (found) return found;
  }
  return null;
}

/**
 * Every `slot` node inside a component's `template`, each paired with its
 * `slotName` -- the Inspector's per-slot item editor walks this list to know
 * which slots a component instance has, independently of which (if any) are
 * actually filled yet (`ComponentInstanceNode.slotContent` is only set once
 * a slot has been edited away from its template default).
 */
export function findSlotNodes(template: DocumentNode): Array<{ slotName: string; node: SlotNode }> {
  const out: Array<{ slotName: string; node: SlotNode }> = [];
  function recurse(node: DocumentNode) {
    if (node.kind === 'slot') {
      out.push({ slotName: node.slotName, node });
      // A slot's own defaultContent is never itself slot-filled content
      // (see DocumentRenderer.tsx's substituteSlots), so there's nothing
      // further to find inside it for this purpose.
      return;
    }
    for (const child of getChildren(node) ?? []) recurse(child);
  }
  recurse(template);
  return out;
}

/**
 * Deep-clones a node with every id in its subtree replaced by a fresh one.
 * Used when duplicating a slot item (e.g. "Add item" on a pricing plan or
 * nav link list): `insertNode` throws on a duplicate id, and the item being
 * cloned always starts from an existing sibling, whose ids (and every
 * descendant's) are already present in the document.
 */
export function cloneWithFreshIds(node: DocumentNode): DocumentNode {
  const children = getChildren(node);
  const clone: DocumentNode = { ...node, id: freshNodeId(node.kind) };
  if (children) {
    (clone as unknown as { children: DocumentNode[] }).children = children.map(cloneWithFreshIds);
  }
  return clone;
}
