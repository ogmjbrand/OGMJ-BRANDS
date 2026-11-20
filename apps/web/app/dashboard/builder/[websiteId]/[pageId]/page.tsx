'use client';

/**
 * OGMJ Visual Website Editor (Phase 2).
 *
 * Deliberately thin: all of the actual editing logic — the document shape,
 * reversible operations, undo/redo, and the renderer — already exists from
 * Phase 1 (`@/lib/document-model`, `DocumentRenderer`). This page is the
 * UI that drives them, not a second implementation of any of them.
 */
import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { publishPage } from '@/lib/services/builder.service';
import { loadEditablePage, loadWebsiteName, saveEditablePage, type EditablePage } from '@/lib/services/document-editor.service';
import { useDocumentEditor } from '@/lib/editor/useDocumentEditor';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { Inspector } from '@/components/editor/Inspector';
import { SettingsDrawer } from '@/components/editor/SettingsDrawer';

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; page: EditablePage };

function EditorBody({ page: initialPage, websiteId, businessId }: { page: EditablePage; websiteId: string; businessId: string }) {
  const [page, setPage] = useState(initialPage);
  const editor = useDocumentEditor(initialPage.document.document);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishedStatus, setPublishedStatus] = useState<string | null>(null);
  const [websiteName, setWebsiteName] = useState(websiteId);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadWebsiteName(websiteId).then(setWebsiteName);
  }, [websiteId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveEditablePage(page.id, { schemaVersion: initialPage.document.schemaVersion, document: editor.document });
      editor.markSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [page.id, initialPage.document.schemaVersion, editor]);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    setSaveError(null);
    try {
      // Save first -- publishing a page with unsaved canvas edits would
      // publish a stale version, which is worse than refusing to publish.
      if (editor.dirty) await handleSave();
      const result = await publishPage(page.id);
      if (result.success) {
        setPublishedStatus('published');
      } else {
        setSaveError(result.error?.message ?? 'Failed to publish');
      }
    } finally {
      setPublishing(false);
    }
  }, [page.id, editor.dirty, handleSave]);

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
      <EditorToolbar
        editor={editor}
        websiteId={websiteId}
        pageId={page.id}
        websiteName={websiteName}
        pageTitle={page.title}
        saving={saving}
        publishing={publishing}
        publishedStatus={publishedStatus}
        onSave={handleSave}
        onPublish={handlePublish}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {(saveError || editor.lastError) && (
        <div className="flex items-center gap-2 border-b border-[#B91C1C]/30 bg-[#B91C1C]/10 px-4 py-2 text-xs text-[#f09a9a]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {saveError || editor.lastError}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <EditorSidebar editor={editor} businessId={businessId} websiteId={websiteId} pageId={page.id} />

        <main className="min-w-0 flex-1">
          <EditorCanvas editor={editor} />
        </main>

        <aside className="w-80 shrink-0 overflow-y-auto border-l border-[#D4AF37]/15 bg-[#101010]">
          <Inspector editor={editor} />
        </aside>
      </div>

      {settingsOpen && (
        <SettingsDrawer
          pageId={page.id}
          initial={{ title: page.title, slug: page.slug, seo: page.seo }}
          onClose={() => setSettingsOpen(false)}
          onSaved={(next) => setPage((p) => ({ ...p, ...next }))}
        />
      )}
    </div>
  );
}

export default function PageEditorPage({ params }: { params: { websiteId: string; pageId: string } }) {
  const { currentBusiness } = useBusinessContext();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    loadEditablePage(params.pageId)
      .then((page) => {
        if (!cancelled) setState({ status: 'ready', page });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', message: err instanceof Error ? err.message : 'Failed to load page' });
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

  return <EditorBody page={state.page} websiteId={params.websiteId} businessId={currentBusiness?.id ?? state.page.businessId} />;
}
