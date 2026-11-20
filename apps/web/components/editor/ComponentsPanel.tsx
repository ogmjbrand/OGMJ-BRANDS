'use client';

/**
 * The component library: insert an instance of a reusable component at the
 * current selection, and create/rename/duplicate/delete component
 * DEFINITIONS -- all through `upsertComponent`, the same operation
 * `presetComponents.ts`'s presets are seeded with. Per-instance editing
 * (variant + propOverrides) lives in the Inspector once an instance is
 * selected; this panel is about the shared definitions themselves.
 */
import { useState } from 'react';
import { Blocks, Copy, Plus, Trash2 } from 'lucide-react';
import { canHaveChildren, findNode, getChildren, walk } from '@/lib/document-model';
import { freshNodeId } from '@/lib/editor/createDefaultNode';
import { PRESET_COMPONENTS, withPresetComponents } from '@/lib/editor/presetComponents';
import type { DocumentEditor } from '@/lib/editor/useDocumentEditor';
import { TextField } from './Inspector';

/** How many instances on THIS page currently reference `componentId` -- shown before a destructive delete. Deliberately only counts `document.root` (what's visible on this page), not other components' templates, which can legitimately reference each other without that being "usage" in the same sense. */
function countInstancesOnPage(editor: DocumentEditor, componentId: string): number {
  let count = 0;
  for (const node of walk(editor.document.root)) {
    if (node.kind === 'componentInstance' && node.componentId === componentId) count++;
  }
  return count;
}

export function ComponentsPanel({ editor }: { editor: DocumentEditor }) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const components = Object.values(editor.document.components).sort((a, b) => a.name.localeCompare(b.name));

  function insertInstance(componentId: string) {
    const selected = editor.selectedNodeId ? findNode(editor.document.root, editor.selectedNodeId) : null;
    const parentId = selected && canHaveChildren(selected) ? selected.id : editor.document.root.id;
    const parent = findNode(editor.document.root, parentId);
    const index = parent ? (getChildren(parent)?.length ?? 0) : 0;
    const instanceId = freshNodeId('instance');
    editor.apply({ op: 'insertNode', parentId, index, node: { id: instanceId, kind: 'componentInstance', componentId } });
    editor.select(instanceId);
  }

  function duplicateComponent(componentId: string) {
    const source = editor.document.components[componentId];
    if (!source) return;
    const newId = freshNodeId(componentId);
    editor.apply({ op: 'upsertComponent', componentId: newId, definition: { ...source, id: newId, name: `${source.name} copy` } });
  }

  function renameComponent(componentId: string, name: string) {
    const source = editor.document.components[componentId];
    if (!source || !name.trim()) return;
    editor.apply({ op: 'upsertComponent', componentId, definition: { ...source, name: name.trim() } });
  }

  function deleteComponent(componentId: string) {
    const used = countInstancesOnPage(editor, componentId);
    if (used > 0) {
      const ok = window.confirm(
        `${used} element${used === 1 ? '' : 's'} on this page use this component. Deleting it will leave ${used === 1 ? 'that element' : 'those elements'} showing nothing (a safe, invisible placeholder) until you remove ${used === 1 ? 'it' : 'them'} or restore the component. Delete anyway?`
      );
      if (!ok) return;
    }
    editor.apply({ op: 'upsertComponent', componentId, definition: undefined });
  }

  return (
    <div className="space-y-3 p-3">
      {components.length === 0 && (
        <div className="space-y-2 rounded-md border border-[#D4AF37]/15 bg-[#161616] p-3 text-xs text-[#9a9a9a]">
          <p>No reusable components yet.</p>
          <button
            onClick={() => {
              for (const def of PRESET_COMPONENTS) editor.apply({ op: 'upsertComponent', componentId: def.id, definition: def });
            }}
            className="w-full rounded-md border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-medium text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
          >
            Load the starter library ({PRESET_COMPONENTS.length} components)
          </button>
        </div>
      )}

      {components.map((def) => (
        <div key={def.id} className="space-y-2 rounded-md border border-[#D4AF37]/15 bg-[#161616] p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Blocks className="h-4 w-4 shrink-0 text-[#D4AF37]" />
              {renamingId === def.id ? (
                <TextField
                  value={def.name}
                  onChange={(v) => {
                    renameComponent(def.id, v);
                    setRenamingId(null);
                  }}
                />
              ) : (
                <button
                  onClick={() => setRenamingId(def.id)}
                  title="Click to rename"
                  className="truncate text-left text-sm text-[#E5E5E5] hover:underline"
                >
                  {def.name}
                </button>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button onClick={() => duplicateComponent(def.id)} title="Duplicate" className="rounded p-1 text-[#9a9a9a] hover:bg-white/5 hover:text-[#E5E5E5]">
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => deleteComponent(def.id)} title="Delete" className="rounded p-1 text-[#9a9a9a] hover:bg-red-500/10 hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {def.variants.length > 0 && <p className="text-[11px] text-[#6b6b6b]">{def.variants.length} variant{def.variants.length === 1 ? '' : 's'}</p>}
          <button
            onClick={() => insertInstance(def.id)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[#D4AF37]/20 bg-[#121212] px-3 py-1.5 text-xs text-[#E5E5E5] transition hover:border-[#D4AF37]/50"
          >
            <Plus className="h-3.5 w-3.5" />
            Insert
          </button>
        </div>
      ))}
    </div>
  );
}
