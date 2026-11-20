'use client';

/**
 * OGMJ Visual Website Editor (Phase 2, stage 1).
 *
 * Deliberately thin: all of the actual editing logic — the document shape,
 * reversible operations, undo/redo, and the renderer — already exists from
 * Phase 1 (`@/lib/document-model`, `DocumentRenderer`). This page is the
 * UI that drives them, not a second implementation of any of them.
 */
import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { loadEditablePage, saveEditablePage } from '@/lib/services/document-editor.service';
import { useDocumentEditor } from '@/lib/editor/useDocumentEditor';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { LayerTree } from '@/components/editor/LayerTree';
import { Inspector } from '@/components/editor/Inspector';
import { BlockPalette } from '@/components/editor/BlockPalette';
import type { VersionedDocument } from '@/lib/document-model';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; pageId: string; title: string; document: VersionedDocument };

function EditorBody({
  pageId,
  websiteId,
  title,
  initial,
}: {
  pageId: string;
  websiteId: string;
  title: string;
  initial: VersionedDocument;
}) {
  const editor = useDocumentEditor(initial.document);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveEditablePage(pageId, { schemaVersion: initial.schemaVersion, document: editor.document });
      editor.markSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [pageId, initial.schemaVersion, editor]);

  // Keyboard shortcuts: Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z / Cmd/Ctrl+Y redo, Cmd/Ctrl+S save.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        editor.redo();
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        editor.undo();
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        editor.redo();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editor, handleSave]);

  // Never lose an edit silently by navigating away.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!editor.dirty) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [editor.dirty]);

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a] text-[#E5E5E5]">
      <EditorToolbar editor={editor} websiteId={websiteId} pageTitle={title} saving={saving} onSave={handleSave} />

      {(saveError || editor.lastError) && (
        <div className="flex items-center gap-2 border-b border-[#B91C1C]/30 bg-[#B91C1C]/10 px-4 py-2 text-xs text-[#f09a9a]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {saveError || editor.lastError}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-64 shrink-0 flex-col border-r border-[#D4AF37]/15 bg-[#101010]">
          <div className="border-b border-[#D4AF37]/15 px-3 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]/80">Add blocks</h2>
          </div>
          <BlockPalette editor={editor} />
          <div className="border-y border-[#D4AF37]/15 px-3 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]/80">Layers</h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <LayerTree editor={editor} />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <EditorCanvas editor={editor} />
        </main>

        <aside className="w-80 shrink-0 overflow-y-auto border-l border-[#D4AF37]/15 bg-[#101010]">
          <Inspector editor={editor} />
        </aside>
      </div>
    </div>
  );
}

export default function PageEditorPage({ params }: { params: { websiteId: string; pageId: string } }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    loadEditablePage(params.pageId)
      .then((page) => {
        if (cancelled) return;
        setState({ status: 'ready', pageId: page.id, title: page.title, document: page.document });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Failed to load page' });
      });
    return () => {
      cancelled = true;
    };
  }, [params.pageId]);

  if (state.status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-[#D4AF37]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#0a0a0a] text-center">
        <AlertCircle className="h-10 w-10 text-[#B91C1C]" />
        <p className="text-[#E5E5E5]">{state.message}</p>
      </div>
    );
  }

  return <EditorBody pageId={state.pageId} websiteId={params.websiteId} title={state.title} initial={state.document} />;
}
