'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DocumentRenderer } from '@/components/document/DocumentRenderer';
import {
  DEFAULT_TOKEN_SET,
  canHaveChildren,
  findNode,
  getChildren,
  type NodeId,
} from '@/lib/document-model';
import { IframeCanvas } from './IframeCanvas';
import { createDefaultNode, type InsertableBlockKind } from '@/lib/editor/createDefaultNode';
import { VIEWPORTS, type DocumentEditor } from '@/lib/editor/useDocumentEditor';

export const DRAG_BLOCK_MIME = 'application/x-ogmj-block';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function EditorCanvas({ editor }: { editor: DocumentEditor }) {
  const rootDivRef = useRef<HTMLDivElement>(null);
  const [selectionRect, setSelectionRect] = useState<Rect | null>(null);
  const [dropRect, setDropRect] = useState<Rect | null>(null);

  const viewport = VIEWPORTS.find((v) => v.key === editor.viewport) ?? VIEWPORTS[VIEWPORTS.length - 1];

  const rectFor = useCallback((nodeId: NodeId | null): Rect | null => {
    if (!nodeId || !rootDivRef.current) return null;
    const el = rootDivRef.current.querySelector(`[data-node="${CSS.escape(nodeId)}"]`) as HTMLElement | null;
    if (!el) return null;
    return { top: el.offsetTop, left: el.offsetLeft, width: el.offsetWidth, height: el.offsetHeight };
  }, []);

  useEffect(() => {
    setSelectionRect(rectFor(editor.selectedNodeId));
    // Recompute whenever the document changes shape too (content/style edits move things).
  }, [rectFor, editor.selectedNodeId, editor.document]);

  function handleClick(e: React.MouseEvent) {
    // SECURITY/CORRECTNESS: the rendered content includes real <a href>
    // elements (ButtonBlock) with real, safeHref-validated-but-still
    // author-chosen destinations, including target="_blank" for external
    // links. Without this, clicking a link while editing would navigate
    // the canvas (or open a new tab) instead of selecting it -- clicking
    // inside your own editor must never leave it.
    //
    // Phase 3 audit note: does this preventDefault also defeat a rendered
    // <video controls> element's native play/pause/scrub interaction? No --
    // a native media control's own click-to-play behavior is driven by
    // pointer/mousedown handling inside the browser's UA shadow DOM, which
    // already runs before this synthetic 'click' bubbles here; preventDefault
    // on 'click' only cancels the DEFAULT ACTION tied to click (e.g. a link
    // navigating), not an already-completed internal widget state change.
    // Moot in practice today regardless: `video` is a valid NodeKind the
    // renderer supports, but it is in neither INSERTABLE_BLOCKS nor any
    // migrateLegacyContent output, so no document produced by this editor
    // can contain one yet.
    e.preventDefault();
    const target = e.target as HTMLElement;
    const nodeEl = target.closest('[data-node]') as HTMLElement | null;
    if (!nodeEl) {
      editor.select(null);
      return;
    }
    editor.select(nodeEl.getAttribute('data-node'));
  }

  /** Closest ancestor (including the hit element itself) that is both a real node and able to hold children; falls back to the document root. */
  function nearestContainerIdFromPoint(x: number, y: number): NodeId {
    const doc = rootDivRef.current?.ownerDocument;
    let cursor = doc?.elementFromPoint(x, y) as HTMLElement | null;
    while (cursor) {
      const nodeId = cursor.getAttribute('data-node');
      if (nodeId) {
        const node = findNode(editor.document.root, nodeId);
        if (node && canHaveChildren(node)) return nodeId;
      }
      cursor = cursor.parentElement;
    }
    return editor.document.root.id;
  }

  function handleDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes(DRAG_BLOCK_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const hoverId = nearestContainerIdFromPoint(e.clientX, e.clientY);
    setDropRect(rectFor(hoverId));
  }

  function handleDrop(e: React.DragEvent) {
    const kind = e.dataTransfer.getData(DRAG_BLOCK_MIME) as InsertableBlockKind;
    setDropRect(null);
    if (!kind) return;
    e.preventDefault();
    const parentId = nearestContainerIdFromPoint(e.clientX, e.clientY);
    const parent = findNode(editor.document.root, parentId);
    const index = parent ? (getChildren(parent)?.length ?? 0) : 0;
    const node = createDefaultNode(kind);
    editor.apply({ op: 'insertNode', parentId, index, node });
    editor.select(node.id);
  }

  return (
    <div className="flex h-full w-full items-start justify-center overflow-auto bg-[#0a0a0a] p-8">
      <div
        className="relative shrink-0 overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-[#D4AF37]/25"
        style={{ width: viewport.widthPx, minHeight: 400, height: 'calc(100vh - 220px)' }}
      >
        <IframeCanvas widthPx={viewport.widthPx}>
          <div
            ref={rootDivRef}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={() => setDropRect(null)}
            style={{ position: 'relative', minHeight: '100vh' }}
          >
            <DocumentRenderer document={editor.document} tokenSet={DEFAULT_TOKEN_SET} />
            {selectionRect && (
              <div
                style={{
                  position: 'absolute',
                  top: selectionRect.top,
                  left: selectionRect.left,
                  width: selectionRect.width,
                  height: selectionRect.height,
                  border: '2px solid #D4AF37',
                  pointerEvents: 'none',
                  zIndex: 2147483646,
                }}
              />
            )}
            {dropRect && (
              <div
                style={{
                  position: 'absolute',
                  top: dropRect.top,
                  left: dropRect.left,
                  width: dropRect.width,
                  height: dropRect.height,
                  border: '2px dashed #10B981',
                  background: 'rgba(16,185,129,0.08)',
                  pointerEvents: 'none',
                  zIndex: 2147483647,
                }}
              />
            )}
          </div>
        </IframeCanvas>
      </div>
    </div>
  );
}
