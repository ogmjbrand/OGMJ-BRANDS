'use client';

/**
 * General asset-library management (browse/add/delete/alt-text), distinct
 * from the per-element picker embedded in the Inspector's image field --
 * this one isn't tied to a particular node, so "select" here opens a
 * detail/edit strip rather than assigning an element.
 */
import { useState } from 'react';
import { freshNodeId } from '@/lib/editor/createDefaultNode';
import { safeObjectLookup, safeSrc } from '@/lib/document-model';
import type { DocumentEditor } from '@/lib/editor/useDocumentEditor';
import { AssetPicker } from './AssetPicker';
import { TextField } from './Inspector';

export function AssetsPanel({ editor }: { editor: DocumentEditor }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? safeObjectLookup(editor.document.assets, selectedId) : undefined;

  return (
    <div className="space-y-3 p-3">
      <AssetPicker
        assets={editor.document.assets}
        selectedAssetId={selectedId ?? undefined}
        onSelect={(id) => setSelectedId(id)}
        onAddByUrl={(url, altText) => {
          const id = freshNodeId('asset');
          editor.apply({ op: 'upsertAsset', assetId: id, asset: { id, kind: 'image', url, altText: altText || undefined } });
          setSelectedId(id);
        }}
        onDelete={(id) => {
          editor.apply({ op: 'upsertAsset', assetId: id, asset: undefined });
          if (selectedId === id) setSelectedId(null);
        }}
      />

      {selected && (
        <div className="space-y-2 rounded-md border border-[#D4AF37]/15 bg-[#161616] p-2.5">
          {/* SECURITY (defense in depth): re-validate at render time, same as AssetPicker's thumbnails and DocumentRenderer's ImageBlock. */}
          {safeSrc(selected.url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={safeSrc(selected.url)} alt={selected.altText ?? ''} className="max-h-32 w-full rounded-sm object-contain" />
          ) : null}
          <p className="truncate text-[11px] text-[#6b6b6b]">{selected.url}</p>
          <TextField
            value={selected.altText ?? ''}
            onChange={(v) => editor.apply({ op: 'upsertAsset', assetId: selected.id, asset: { ...selected, altText: v || undefined } })}
          />
        </div>
      )}
    </div>
  );
}
