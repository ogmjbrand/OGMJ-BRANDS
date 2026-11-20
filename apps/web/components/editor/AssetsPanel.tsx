'use client';

/**
 * General asset-library management (browse/add/delete/alt-text), distinct
 * from the per-element picker embedded in the Inspector's image field --
 * this one isn't tied to a particular node, so "select" here opens a
 * detail/edit strip rather than assigning an element.
 */
import { useState } from 'react';
import { freshNodeId } from '@/lib/editor/createDefaultNode';
import type { DocumentEditor } from '@/lib/editor/useDocumentEditor';
import { AssetPicker } from './AssetPicker';

export function AssetsPanel({ editor }: { editor: DocumentEditor }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? editor.document.assets[selectedId] : undefined;

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.url} alt={selected.altText ?? ''} className="max-h-32 w-full rounded-sm object-contain" />
          <p className="truncate text-[11px] text-[#6b6b6b]">{selected.url}</p>
          <input
            value={selected.altText ?? ''}
            onChange={(e) =>
              editor.apply({ op: 'upsertAsset', assetId: selected.id, asset: { ...selected, altText: e.target.value || undefined } })
            }
            placeholder="Alt text"
            className="w-full rounded-sm border border-[#D4AF37]/15 bg-[#0d0d0d] px-2 py-1 text-xs text-[#E5E5E5] outline-none focus:border-[#D4AF37]"
          />
        </div>
      )}
    </div>
  );
}
