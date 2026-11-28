/**
 * Factory for the block kinds the editor's palette can insert. Every node it
 * produces is immediately valid against `schema.ts` — no partially-formed
 * nodes ever reach `insertNode`.
 */
import type { DocumentNode } from '@/lib/document-model';

export type InsertableBlockKind = 'heading' | 'text' | 'button' | 'image' | 'video' | 'container' | 'section';

export const INSERTABLE_BLOCKS: Array<{ kind: InsertableBlockKind; label: string }> = [
  { kind: 'heading', label: 'Heading' },
  { kind: 'text', label: 'Text' },
  { kind: 'button', label: 'Button' },
  { kind: 'image', label: 'Image' },
  { kind: 'video', label: 'Video' },
  { kind: 'container', label: 'Container' },
  { kind: 'section', label: 'Section' },
];

let counter = 0;

/** A fresh, collision-free node id -- unique per editor session, which is all `insertNode`'s duplicate-id check requires. */
export function freshNodeId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function createDefaultNode(kind: InsertableBlockKind): DocumentNode {
  const id = freshNodeId(kind);
  switch (kind) {
    case 'heading':
      return { id, kind: 'heading', text: 'New heading', level: 2 };
    case 'text':
      return { id, kind: 'text', text: 'New text block' };
    case 'button':
      return { id, kind: 'button', label: 'Click me', href: '#', variant: 'primary' };
    case 'image':
      // No asset exists yet -- assetRef points at a not-yet-populated id the
      // inspector's "add by URL" writes into via upsertAsset. Until then the
      // renderer safely resolves it to nothing (see ImageBlock/resolveAsset),
      // same as any other missing-reference case in this document model.
      return { id, kind: 'image', assetRef: freshNodeId('asset') };
    case 'video':
      // Same not-yet-populated-asset pattern as 'image' above; VideoBlock
      // resolves an empty assetRef to nothing until the inspector's video
      // picker writes a real asset in.
      return { id, kind: 'video', assetRef: freshNodeId('asset'), muted: true };
    case 'container':
      return { id, kind: 'container', children: [] };
    case 'section':
      return { id, kind: 'section', children: [] };
  }
}
