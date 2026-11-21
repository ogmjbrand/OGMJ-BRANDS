/**
 * Deep-clones a node (and everything reachable from it -- children AND a
 * componentInstance's slotContent) with a FRESH id on every single node in
 * the copy. `insertNode` throws on any id already present anywhere in the
 * document (see tree.ts's duplicate-id check), so a duplicate that kept
 * the original's ids could never actually be inserted.
 */
import { getChildren } from '@/lib/document-model/tree';
import type { DocumentNode } from '@/lib/document-model/types';
import { freshNodeId } from './createDefaultNode';

export function cloneNodeWithFreshIds(node: DocumentNode): DocumentNode {
  const next = { ...node, id: freshNodeId(node.kind) } as DocumentNode;

  const children = getChildren(next);
  if (children) {
    (next as unknown as { children: DocumentNode[] }).children = children.map(cloneNodeWithFreshIds);
  }

  if (next.kind === 'componentInstance' && next.slotContent) {
    const slotContent: Record<string, DocumentNode[]> = {};
    for (const [slotName, content] of Object.entries(next.slotContent)) {
      slotContent[slotName] = content.map(cloneNodeWithFreshIds);
    }
    next.slotContent = slotContent;
  }

  if (next.kind === 'slot' && next.defaultContent) {
    next.defaultContent = next.defaultContent.map(cloneNodeWithFreshIds);
  }

  return next;
}
