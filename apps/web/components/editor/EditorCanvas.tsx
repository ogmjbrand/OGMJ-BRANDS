'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Blocks, Copy, Minus, Plus, Scan, Trash2 } from 'lucide-react';
import { DocumentRenderer } from '@/components/document/DocumentRenderer';
import {
  DEFAULT_TOKEN_SET,
  canHaveChildren,
  findNode,
  findParent,
  getChildren,
  type NodeId,
} from '@/lib/document-model';
import { IframeCanvas } from './IframeCanvas';
import { createDefaultNode, freshNodeId, type InsertableBlockKind } from '@/lib/editor/createDefaultNode';
import { cloneNodeWithFreshIds } from '@/lib/editor/duplicateNode';
import { createComponentFromNode } from '@/lib/editor/createComponentFromNode';
import { VIEWPORTS, type DocumentEditor } from '@/lib/editor/useDocumentEditor';

export const DRAG_BLOCK_MIME = 'application/x-ogmj-block';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

/** True while the given target is a text-editing control -- Delete/Backspace there must type, never delete the selected canvas element. */
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

export function EditorCanvas({ editor }: { editor: DocumentEditor }) {
  const rootDivRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectionRect, setSelectionRect] = useState<Rect | null>(null);
  const [dropRect, setDropRect] = useState<Rect | null>(null);
  const [zoom, setZoom] = useState(1);

  const viewport = VIEWPORTS.find((v) => v.key === editor.viewport) ?? VIEWPORTS[VIEWPORTS.length - 1];

  const deleteSelected = useCallback(() => {
    const id = editor.selectedNodeId;
    if (!id || id === editor.document.root.id) return;
    editor.apply({ op: 'removeNode', nodeId: id });
    editor.select(null);
  }, [editor]);

  const duplicateSelected = useCallback(() => {
    const id = editor.selectedNodeId;
    if (!id || id === editor.document.root.id) return;
    const node = findNode(editor.document.root, id);
    const located = findParent(editor.document.root, id);
    if (!node || !located) return;
    const clone = cloneNodeWithFreshIds(node);
    editor.apply({ op: 'insertNode', parentId: located.parent.id, index: located.index + 1, node: clone });
    editor.select(clone.id);
  }, [editor]);

  const saveSelectionAsComponent = useCallback(() => {
    const id = editor.selectedNodeId;
    if (!id || id === editor.document.root.id) return;
    const node = findNode(editor.document.root, id);
    const located = findParent(editor.document.root, id);
    if (!node || !located) return;
    const name = window.prompt('Name this component', 'New component');
    if (!name || !name.trim()) return;
    const definition = createComponentFromNode(node, name.trim());
    const instanceId = freshNodeId('instance');
    editor.apply({ op: 'upsertComponent', componentId: definition.id, definition });
    editor.apply({ op: 'removeNode', nodeId: id });
    editor.apply({ op: 'insertNode', parentId: located.parent.id, index: located.index, node: { id: instanceId, kind: 'componentInstance', componentId: definition.id } });
    editor.select(instanceId);
  }, [editor]);

  const fitToScreen = useCallback(() => {
    const available = scrollContainerRef.current?.clientWidth;
    if (!available) return;
    setZoom(clampZoom((available - 64) / viewport.widthPx));
  }, [viewport.widthPx]);

  // Same shortcut set as the toolbar buttons below; wired to BOTH the
  // parent window and (via onCanvasWindowReady) the canvas iframe's own
  // window, since a keydown while focus is inside the iframe never
  // bubbles to the parent (separate browsing context -- see
  // IframeCanvas.tsx's onWindowReady doc comment).
  const handleCanvasKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if ((e.key === 'Delete' || e.key === 'Backspace') && !mod) {
        if (!editor.selectedNodeId) return;
        e.preventDefault();
        deleteSelected();
      } else if (mod && e.key.toLowerCase() === 'd') {
        if (!editor.selectedNodeId) return;
        e.preventDefault();
        duplicateSelected();
      }
    },
    [editor.selectedNodeId, deleteSelected, duplicateSelected]
  );

  // `handleCanvasKeyDown` gets a new identity whenever selectedNodeId
  // changes. The iframe's window is only available ONCE (IframeCanvas
  // calls onWindowReady a single time, on mount) and attaching a listener
  // there directly would permanently bind it to whichever selectedNodeId
  // was current at that one moment. Routing both listeners through a ref
  // that always points at the LATEST handler keeps a single, STABLE
  // listener function on each window while still seeing live state.
  const latestHandlerRef = useRef(handleCanvasKeyDown);
  useEffect(() => {
    latestHandlerRef.current = handleCanvasKeyDown;
  }, [handleCanvasKeyDown]);
  const stableKeyDownListener = useRef((e: KeyboardEvent) => latestHandlerRef.current(e)).current;

  useEffect(() => {
    window.addEventListener('keydown', stableKeyDownListener);
    return () => window.removeEventListener('keydown', stableKeyDownListener);
  }, [stableKeyDownListener]);

  const canvasWindowRef = useRef<Window | null>(null);
  const onCanvasWindowReady = useCallback(
    (win: Window) => {
      canvasWindowRef.current = win;
      win.addEventListener('keydown', stableKeyDownListener);
    },
    [stableKeyDownListener]
  );

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
    <div ref={scrollContainerRef} className="relative flex h-full w-full items-start justify-center overflow-auto bg-[#0a0a0a] p-8">
      <div
        className="relative shrink-0 overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-[#D4AF37]/25"
        style={{ width: viewport.widthPx, minHeight: 400, height: 'calc(100vh - 220px)', transform: `scale(${zoom})`, transformOrigin: 'top center' }}
      >
        <IframeCanvas widthPx={viewport.widthPx} onWindowReady={onCanvasWindowReady}>
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

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-[#D4AF37]/20 bg-[#161616]/95 px-2 py-1.5 shadow-lg backdrop-blur">
        <button
          onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
          title="Zoom out"
          className="rounded p-1.5 text-[#9a9a9a] hover:bg-white/5 hover:text-[#E5E5E5]"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setZoom(1)} title="Reset zoom to 100%" className="min-w-[3.5rem] rounded px-1 py-1 text-xs text-[#9a9a9a] hover:text-[#E5E5E5]">
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
          title="Zoom in"
          className="rounded p-1.5 text-[#9a9a9a] hover:bg-white/5 hover:text-[#E5E5E5]"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button onClick={fitToScreen} title="Fit to screen" className="rounded p-1.5 text-[#9a9a9a] hover:bg-white/5 hover:text-[#E5E5E5]">
          <Scan className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1 h-4 w-px bg-white/10" />
        <button
          onClick={duplicateSelected}
          disabled={!editor.selectedNodeId || editor.selectedNodeId === editor.document.root.id}
          title="Duplicate selected (Ctrl/Cmd+D)"
          className="rounded p-1.5 text-[#9a9a9a] hover:bg-white/5 hover:text-[#E5E5E5] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={deleteSelected}
          disabled={!editor.selectedNodeId || editor.selectedNodeId === editor.document.root.id}
          title="Delete selected (Delete/Backspace)"
          className="rounded p-1.5 text-[#9a9a9a] hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1 h-4 w-px bg-white/10" />
        <button
          onClick={saveSelectionAsComponent}
          disabled={!editor.selectedNodeId || editor.selectedNodeId === editor.document.root.id}
          title="Save selected as a reusable component"
          className="rounded p-1.5 text-[#9a9a9a] hover:bg-white/5 hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Blocks className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
