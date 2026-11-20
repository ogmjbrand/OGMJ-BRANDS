'use client';

/**
 * The document's structure as a navigable, reorderable tree -- selecting a
 * row selects the same node the canvas highlights, and dragging a row calls
 * the exact same `moveNode` operation (via `editor.apply`) the canvas's own
 * drag-and-drop uses, so both paths stay reversible through one history.
 */
import { useState } from 'react';
import { ChevronDown, ChevronRight, Component } from 'lucide-react';
import { getChildren, type DocumentNode, type NodeId } from '@/lib/document-model';
import type { DocumentEditor } from '@/lib/editor/useDocumentEditor';

const MOVE_MIME = 'application/x-ogmj-move';

function nodeLabel(node: DocumentNode): string {
  if (node.name) return node.name;
  switch (node.kind) {
    case 'heading':
    case 'text':
      return node.text || node.kind;
    case 'button':
      return node.label || 'Button';
    case 'image':
      return node.caption || 'Image';
    case 'componentInstance':
      return `Component: ${node.componentId}`;
    case 'custom':
      return `${node.customType}`;
    default:
      return node.kind;
  }
}

type DropZone = 'before' | 'after' | 'into';

function Row({
  node,
  depth,
  parentId,
  index,
  editor,
}: {
  node: DocumentNode;
  depth: number;
  parentId: NodeId | null;
  index: number;
  editor: DocumentEditor;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [dropZone, setDropZone] = useState<DropZone | null>(null);
  const children = getChildren(node);
  const isContainer = children !== undefined;
  const isSelected = editor.selectedNodeId === node.id;
  const canDrag = parentId !== null;

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData(MOVE_MIME, node.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes(MOVE_MIME)) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeY = (e.clientY - rect.top) / rect.height;
    if (relativeY < 0.25) setDropZone('before');
    else if (relativeY > 0.75) setDropZone('after');
    else setDropZone(isContainer ? 'into' : relativeY < 0.5 ? 'before' : 'after');
  }

  function handleDrop(e: React.DragEvent) {
    const movedId = e.dataTransfer.getData(MOVE_MIME);
    const zone = dropZone;
    setDropZone(null);
    if (!movedId || !zone) return;
    e.preventDefault();
    e.stopPropagation();

    if (zone === 'into') {
      editor.apply({ op: 'moveNode', nodeId: movedId, newParentId: node.id, newIndex: children?.length ?? 0 });
      return;
    }
    if (parentId === null) return; // 'before'/'after' the root itself is meaningless
    const newIndex = zone === 'before' ? index : index + 1;
    editor.apply({ op: 'moveNode', nodeId: movedId, newParentId: parentId, newIndex });
  }

  return (
    <div>
      <div
        draggable={canDrag}
        onDragStart={canDrag ? handleDragStart : undefined}
        onDragOver={handleDragOver}
        onDragLeave={() => setDropZone(null)}
        onDrop={handleDrop}
        onClick={(e) => {
          e.stopPropagation();
          editor.select(node.id);
        }}
        className={[
          'flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm cursor-pointer select-none',
          isSelected ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-[#E5E5E5] hover:bg-white/5',
          dropZone === 'before' ? 'border-t-2 border-[#10B981]' : 'border-t-2 border-transparent',
          dropZone === 'after' ? 'border-b-2 border-[#10B981]' : 'border-b-2 border-transparent',
          dropZone === 'into' ? 'ring-1 ring-inset ring-[#10B981]' : '',
        ].join(' ')}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        {isContainer ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="text-[#9a9a9a] hover:text-white"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-3.5" />
        )}
        {node.kind === 'componentInstance' ? <Component className="h-3.5 w-3.5 text-[#D4AF37]/70" /> : null}
        <span className="truncate">{nodeLabel(node)}</span>
        <span className="ml-auto shrink-0 text-xs text-[#6b6b6b]">{node.kind}</span>
      </div>
      {isContainer && expanded && children!.length > 0 && (
        <div>
          {children!.map((child, i) => (
            <Row key={child.id} node={child} depth={depth + 1} parentId={node.id} index={i} editor={editor} />
          ))}
        </div>
      )}
    </div>
  );
}

export function LayerTree({ editor }: { editor: DocumentEditor }) {
  return (
    <div className="h-full overflow-y-auto px-1 py-2" onClick={() => editor.select(null)}>
      <Row node={editor.document.root} depth={0} parentId={null} index={0} editor={editor} />
    </div>
  );
}
