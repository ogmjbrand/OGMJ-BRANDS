/**
 * Factory for the block kinds the editor's palette can insert. Every node it
 * produces is immediately valid against `schema.ts` — no partially-formed
 * nodes ever reach `insertNode`.
 */
import type { DocumentNode } from '@/lib/document-model';

export type InsertableBlockKind = 'heading' | 'text' | 'button' | 'container' | 'section';

export const INSERTABLE_BLOCKS: Array<{ kind: InsertableBlockKind; label: string }> = [
  { kind: 'heading', label: 'Heading' },
  { kind: 'text', label: 'Text' },
  { kind: 'button', label: 'Button' },
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
    case 'container':
      return { id, kind: 'container', children: [] };
    case 'section':
      return { id, kind: 'section', children: [] };
  }
}
