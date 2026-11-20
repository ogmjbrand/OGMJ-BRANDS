'use client';

import Link from 'next/link';
import { ArrowLeft, Redo2, Undo2, Save, Monitor, Tablet, Smartphone, Sparkles, Eye, UploadCloud, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { VIEWPORTS, type DocumentEditor } from '@/lib/editor/useDocumentEditor';

const VIEWPORT_ICONS = { base: Smartphone, md: Tablet, lg: Monitor } as const;

interface EditorToolbarProps {
  editor: DocumentEditor;
  websiteId: string;
  pageId: string;
  websiteName: string;
  pageTitle: string;
  saving: boolean;
  publishing: boolean;
  publishedStatus: string | null;
  onSave: () => void;
  onPublish: () => void;
  onOpenSettings: () => void;
}

export function EditorToolbar({
  editor,
  websiteId,
  pageId,
  websiteName,
  pageTitle,
  saving,
  publishing,
  publishedStatus,
  onSave,
  onPublish,
  onOpenSettings,
}: EditorToolbarProps) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[#D4AF37]/15 bg-[#121212] px-4">
      <Link
        href={`/dashboard/builder`}
        className="flex items-center gap-1.5 text-sm text-[#9a9a9a] hover:text-[#D4AF37]"
        title="Back to Website Builder"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#F0F0F0]">{websiteName}</p>
        <p className="truncate text-xs text-[#6b6b6b]">{pageTitle || 'Untitled page'}</p>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-[#D4AF37]/15 bg-[#0d0d0d] p-1">
        {VIEWPORTS.map((v) => {
          const Icon = VIEWPORT_ICONS[v.key];
          const active = editor.viewport === v.key;
          return (
            <button
              key={v.key}
              onClick={() => editor.setViewport(v.key)}
              title={`${v.label} (${v.widthPx}px)`}
              className={`rounded-md p-1.5 transition ${active ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-[#7a7a7a] hover:text-[#E5E5E5]'}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={editor.undo}
          disabled={!editor.canUndo}
          title="Undo"
          className="rounded-md p-2 text-[#9a9a9a] transition hover:bg-white/5 hover:text-[#E5E5E5] disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={editor.redo}
          disabled={!editor.canRedo}
          title="Redo"
          className="rounded-md p-2 text-[#9a9a9a] transition hover:bg-white/5 hover:text-[#E5E5E5] disabled:opacity-30"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <button
        disabled
        title="AI-assisted editing -- architecture is in place (every edit already carries an actor: 'user' | 'ai' tag), wiring up a real assistant is a future stage, not this one"
        className="flex items-center gap-1.5 rounded-md border border-[#10B981]/20 px-3 py-1.5 text-xs text-[#10B981]/50 cursor-not-allowed"
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI Assist
        <span className="rounded-full bg-[#10B981]/10 px-1.5 py-0.5 text-[10px]">Soon</span>
      </button>

      <Link
        href={`/dashboard/builder/${websiteId}/${pageId}/preview`}
        target="_blank"
        title="Preview (opens the read-only render in a new tab)"
        className="rounded-md p-2 text-[#9a9a9a] transition hover:bg-white/5 hover:text-[#E5E5E5]"
      >
        <Eye className="h-4 w-4" />
      </Link>

      <button onClick={onOpenSettings} title="Page settings" className="rounded-md p-2 text-[#9a9a9a] transition hover:bg-white/5 hover:text-[#E5E5E5]">
        <SettingsIcon className="h-4 w-4" />
      </button>

      <button
        onClick={onPublish}
        disabled={publishing}
        title={
          publishedStatus === 'published'
            ? 'Published -- note: public anonymous visitors cannot view it yet, pending PR #72\'s still-unmerged public RLS policy'
            : 'Publish this page'
        }
        className="flex items-center gap-1.5 rounded-md border border-[#10B981]/30 px-3 py-1.5 text-xs font-medium text-[#10B981] transition hover:bg-[#10B981]/10 disabled:opacity-50"
      >
        {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
        {publishedStatus === 'published' ? 'Published' : 'Publish'}
      </button>

      <button
        onClick={onSave}
        disabled={saving || !editor.dirty}
        className="flex items-center gap-1.5 rounded-md bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#1a1a1a] transition hover:bg-[#c7a233] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Save className="h-3.5 w-3.5" />
        {saving ? 'Saving...' : editor.dirty ? 'Save' : 'Saved'}
      </button>
    </div>
  );
}
