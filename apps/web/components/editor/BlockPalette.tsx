'use client';

/**
 * Draggable block sources for the canvas's drop handling (see
 * EditorCanvas's `onDragOver`/`onDrop`). Clicking a block (instead of
 * dragging it) is a real, equivalent insert too -- it appends the block as
 * a child of the current selection if the selection can hold children,
 * otherwise as a child of the document root -- so inserting a block never
 * requires a drag.
 */
import { Heading1, Type, MousePointerClick, Square, LayoutPanelTop, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { canHaveChildren, findNode, getChildren } from '@/lib/document-model';
import { createDefaultNode, INSERTABLE_BLOCKS, type InsertableBlockKind } from '@/lib/editor/createDefaultNode';
import type { DocumentEditor } from '@/lib/editor/useDocumentEditor';
import { DRAG_BLOCK_MIME } from './EditorCanvas';

const ICONS: Record<InsertableBlockKind, React.ComponentType<{ className?: string }>> = {
  heading: Heading1,
  text: Type,
  button: MousePointerClick,
  image: ImageIcon,
  video: VideoIcon,
  container: Square,
  section: LayoutPanelTop,
};

export function BlockPalette({ editor }: { editor: DocumentEditor }) {
  function insertAtSelection(kind: InsertableBlockKind) {
    const selected = editor.selectedNodeId ? findNode(editor.document.root, editor.selectedNodeId) : null;
    const parentId = selected && canHaveChildren(selected) ? selected.id : editor.document.root.id;
    const parent = findNode(editor.document.root, parentId);
    const index = parent ? (getChildren(parent)?.length ?? 0) : 0;
    const node = createDefaultNode(kind);
    editor.apply({ op: 'insertNode', parentId, index, node });
    editor.select(node.id);
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {INSERTABLE_BLOCKS.map(({ kind, label }) => {
        const Icon = ICONS[kind];
        return (
          <button
            key={kind}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(DRAG_BLOCK_MIME, kind);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => insertAtSelection(kind)}
            title={`Add ${label} (drag onto the canvas, or click to add to the current selection)`}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-[#D4AF37]/15 bg-[#161616] px-3 py-3 text-xs text-[#E5E5E5] transition hover:border-[#D4AF37]/50 hover:bg-[#1c1c1c] active:cursor-grabbing"
          >
            <Icon className="h-5 w-5 text-[#D4AF37]" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
