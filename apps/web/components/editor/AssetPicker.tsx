'use client';

/**
 * Shared by the Inspector's image field and the sidebar Assets panel.
 *
 * Two fully real ways to add an image: "Upload" (a real file -> Supabase
 * Storage, via asset-upload.ts) and "Add by URL" (validated through the
 * same `safeSrc` allow-list the renderer/schema already enforce). Both end
 * the same way -- `onAddByUrl` -> the caller's `upsertAsset` -- so an
 * uploaded image is a completely normal asset from the document model's
 * point of view. Upload requires the `website-assets` bucket, PREPARED but
 * not applied (see asset-upload.ts); until an authorized operator applies
 * that migration, an upload attempt fails with a clear, caught error
 * rather than silently going nowhere.
 */
import { useRef, useState } from 'react';
import { Search, Link2, ImageOff, Trash2, Upload as UploadIcon } from 'lucide-react';
import { safeSrc, type AssetId, type AssetKind, type AssetRef } from '@/lib/document-model';
import { uploadImageFile, validateImageFile, ACCEPTED_IMAGE_TYPES } from '@/lib/services/asset-upload';

interface AssetPickerProps {
  assets: Record<AssetId, AssetRef>;
  kindFilter?: AssetKind;
  selectedAssetId?: AssetId;
  /** Needed to scope the uploaded object's storage path -- see asset-upload.ts. */
  businessId: string;
  onSelect: (assetId: AssetId) => void;
  onAddByUrl: (url: string, altText: string) => void;
  onDelete?: (assetId: AssetId) => void;
}

export function AssetPicker({ assets, kindFilter, selectedAssetId, businessId, onSelect, onAddByUrl, onDelete }: AssetPickerProps) {
  const [query, setQuery] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const [altDraft, setAltDraft] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    const validationError = validateImageFile(file);
    if (validationError) {
      setUploadError(validationError.message);
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadImageFile(file, businessId);
      onAddByUrl(url, '');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const entries = Object.values(assets).filter((a) => {
    if (kindFilter && a.kind !== kindFilter) return false;
    if (!query.trim()) return true;
    const haystack = `${a.altText ?? ''} ${a.url}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  function handleAdd() {
    const safe = safeSrc(urlDraft.trim());
    if (!safe) {
      setUrlError('Enter a valid http(s) or site-relative image URL');
      return;
    }
    setUrlError(null);
    onAddByUrl(safe, altDraft.trim());
    setUrlDraft('');
    setAltDraft('');
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b6b6b]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assets..."
          className="w-full rounded-md border border-[#D4AF37]/15 bg-[#121212] py-1.5 pl-7 pr-2 text-xs text-[#E5E5E5] outline-none focus:border-[#D4AF37]"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {entries.length === 0 && <p className="col-span-3 py-4 text-center text-xs text-[#6b6b6b]">No assets yet.</p>}
        {entries.map((asset) => (
          <div key={asset.id} className="group relative">
            <button
              onClick={() => onSelect(asset.id)}
              title={asset.altText || asset.url}
              className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border bg-[#161616] ${
                selectedAssetId === asset.id ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]' : 'border-[#D4AF37]/15 hover:border-[#D4AF37]/50'
              }`}
            >
              {asset.kind === 'image' && safeSrc(asset.url) ? (
                // SECURITY (defense in depth): re-validate at render time,
                // same as DocumentRenderer's own ImageBlock -- never trust
                // that an asset reaching this list was already validated.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={safeSrc(asset.url)} alt={asset.altText ?? ''} className="h-full w-full object-cover" />
              ) : (
                <ImageOff className="h-5 w-5 text-[#6b6b6b]" />
              )}
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(asset.id)}
                title="Delete asset"
                className="absolute -right-1 -top-1 hidden rounded-full bg-[#B91C1C] p-1 text-white group-hover:block"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-md border border-[#D4AF37]/15 bg-[#161616] p-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[#D4AF37]/80">
          <UploadIcon className="h-3 w-3" />
          Upload image
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={(e) => handleFileSelected(e.target.files?.[0])}
          disabled={uploading}
          className="w-full rounded-sm border border-[#D4AF37]/15 bg-[#0d0d0d] px-2 py-1 text-xs text-[#9a9a9a] outline-none file:mr-2 file:rounded-sm file:border-0 file:bg-[#D4AF37]/15 file:px-2 file:py-1 file:text-[#D4AF37]"
        />
        {uploading && <p className="text-[11px] text-[#9a9a9a]">Uploading…</p>}
        {uploadError && <p className="text-[11px] text-[#f09a9a]">{uploadError}</p>}
      </div>

      <div className="space-y-2 rounded-md border border-[#D4AF37]/15 bg-[#161616] p-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[#D4AF37]/80">
          <Link2 className="h-3 w-3" />
          Add image by URL
        </div>
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full rounded-sm border border-[#D4AF37]/15 bg-[#0d0d0d] px-2 py-1 text-xs text-[#E5E5E5] outline-none focus:border-[#D4AF37]"
        />
        <input
          value={altDraft}
          onChange={(e) => setAltDraft(e.target.value)}
          placeholder="Alt text (for accessibility)"
          className="w-full rounded-sm border border-[#D4AF37]/15 bg-[#0d0d0d] px-2 py-1 text-xs text-[#E5E5E5] outline-none focus:border-[#D4AF37]"
        />
        {urlError && <p className="text-[11px] text-[#f09a9a]">{urlError}</p>}
        <button
          onClick={handleAdd}
          disabled={!urlDraft.trim()}
          className="w-full rounded-sm bg-[#D4AF37]/15 px-2 py-1 text-xs font-medium text-[#D4AF37] transition hover:bg-[#D4AF37]/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
