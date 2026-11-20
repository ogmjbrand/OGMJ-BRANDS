'use client';

import { useState } from 'react';
import { FileText, Layers, Plus, Image as ImageIcon } from 'lucide-react';
import type { DocumentEditor } from '@/lib/editor/useDocumentEditor';
import { BlockPalette } from './BlockPalette';
import { LayerTree } from './LayerTree';
import { PagesPanel } from './PagesPanel';
import { AssetsPanel } from './AssetsPanel';

type Tab = 'pages' | 'layers' | 'add' | 'assets';

const TABS: Array<{ key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'pages', label: 'Pages', icon: FileText },
  { key: 'layers', label: 'Layers', icon: Layers },
  { key: 'add', label: 'Add', icon: Plus },
  { key: 'assets', label: 'Assets', icon: ImageIcon },
];

interface EditorSidebarProps {
  editor: DocumentEditor;
  businessId: string;
  websiteId: string;
  pageId: string;
}

export function EditorSidebar({ editor, businessId, websiteId, pageId }: EditorSidebarProps) {
  const [tab, setTab] = useState<Tab>('add');

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-[#D4AF37]/15 bg-[#101010]">
      <div className="flex border-b border-[#D4AF37]/15">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            title={label}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] uppercase tracking-wide transition ${
              tab === key ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]' : 'border-b-2 border-transparent text-[#7a7a7a] hover:text-[#E5E5E5]'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'pages' && <PagesPanel businessId={businessId} websiteId={websiteId} currentPageId={pageId} />}
        {tab === 'layers' && <LayerTree editor={editor} />}
        {tab === 'add' && <BlockPalette editor={editor} />}
        {tab === 'assets' && <AssetsPanel editor={editor} />}
      </div>
    </aside>
  );
}
