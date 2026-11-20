'use client';

/**
 * Read-only preview: the actual document, through the actual
 * DocumentRenderer, with zero editing chrome -- distinct from both the
 * editor (which overlays selection/drop UI on the same render) and a
 * published site (which is a separate, public, unauthenticated route
 * gated by PR #72's still-pending RLS decision, not this one).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { DocumentRenderer } from '@/components/document/DocumentRenderer';
import { DEFAULT_TOKEN_SET, type DocumentRoot } from '@/lib/document-model';
import { loadEditablePage } from '@/lib/services/document-editor.service';

export default function PreviewPage({ params }: { params: { websiteId: string; pageId: string } }) {
  const [document, setDocument] = useState<DocumentRoot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadEditablePage(params.pageId)
      .then((page) => {
        if (!cancelled) setDocument(page.document.document);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load page');
      });
    return () => {
      cancelled = true;
    };
  }, [params.pageId]);

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 flex h-10 items-center gap-2 bg-[#07070A] px-3 text-xs text-[#E5E5E5]">
        <Link href={`/dashboard/builder/${params.websiteId}/${params.pageId}`} className="flex items-center gap-1.5 hover:text-[#D4AF37]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to editor
        </Link>
        <span className="ml-auto rounded bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#D4AF37]">Preview</span>
      </div>

      {error && (
        <div className="flex items-center justify-center gap-2 p-12 text-[#B91C1C]">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}
      {!document && !error && (
        <div className="flex justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
        </div>
      )}
      {document && <DocumentRenderer document={document} tokenSet={DEFAULT_TOKEN_SET} />}
    </div>
  );
}
