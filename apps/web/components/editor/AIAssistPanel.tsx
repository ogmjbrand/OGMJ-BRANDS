'use client';

/**
 * Real AI Assist UI: types an instruction, sees exactly what the AI
 * proposes (and anything it proposed that failed validation, with why),
 * then explicitly applies or discards -- never auto-applied. Applying
 * dispatches each accepted operation through the SAME `editor.apply` path
 * every other edit uses, tagged actor: 'ai', so undo (one operation at a
 * time, most-recent-first) and the eventual Save work completely
 * normally with no AI-specific plumbing anywhere else in the editor.
 *
 * "Conversational refinement": there is no chat history here on purpose --
 * the document itself is the ground truth of what's changed so far, so
 * typing a second instruction after applying the first naturally refines
 * the live result (see websiteAssist.ts's module doc comment).
 */
import { useState } from 'react';
import { AlertTriangle, Loader2, Sparkles, X } from 'lucide-react';
import type { DocumentEditor } from '@/lib/editor/useDocumentEditor';
import type { RejectedOperation } from '@/lib/ai/websiteAssist';
import type { ValidatedDocumentOperation } from '@/lib/document-model';

interface AIAssistPanelProps {
  editor: DocumentEditor;
  websiteId: string;
  onClose: () => void;
}

interface Proposal {
  instruction: string;
  explanation: string;
  operations: ValidatedDocumentOperation[];
  rejected: RejectedOperation[];
}

/** A short, human-readable one-liner for a proposed operation -- shown for review before anything is applied. */
function describeOperation(op: ValidatedDocumentOperation): string {
  switch (op.op) {
    case 'insertNode':
      return `Insert a "${op.node.kind}" into "${op.parentId}"`;
    case 'removeNode':
      return `Remove "${op.nodeId}"`;
    case 'moveNode':
      return `Move "${op.nodeId}" into "${op.newParentId}"`;
    case 'updateNodeProps':
      return `Update "${op.path.join('.')}" on "${op.nodeId}"`;
    case 'setSlotContent':
      return op.content ? `Fill slot "${op.slotName}" on "${op.nodeId}"` : `Clear slot "${op.slotName}" on "${op.nodeId}"`;
    case 'applyVariant':
      return op.variantId ? `Apply variant "${op.variantId}" to "${op.nodeId}"` : `Clear the variant on "${op.nodeId}"`;
    case 'upsertAsset':
      return op.asset ? `Add/replace asset "${op.assetId}"` : `Delete asset "${op.assetId}"`;
    case 'upsertComponent':
      return op.definition ? `Add/replace component "${op.componentId}"` : `Delete component "${op.componentId}"`;
    default:
      return 'Unknown operation';
  }
}

export function AIAssistPanel({ editor, websiteId, onClose }: AIAssistPanelProps) {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [applied, setApplied] = useState(false);

  async function handleGenerate() {
    if (!instruction.trim() || loading) return;
    setLoading(true);
    setError(null);
    setApplied(false);
    try {
      const res = await fetch('/api/ai/website-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId, instruction: instruction.trim(), document: editor.document }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'AI request failed');
      }
      setProposal({ instruction: instruction.trim(), explanation: result.data.explanation, operations: result.data.operations, rejected: result.data.rejected });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!proposal) return;
    for (const op of proposal.operations) {
      editor.apply(op, 'ai');
    }
    setApplied(true);
  }

  function handleDiscard() {
    setProposal(null);
    setInstruction('');
    setApplied(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div className="flex h-full w-[28rem] flex-col bg-[#101010] text-sm text-[#E5E5E5]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#D4AF37]/15 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#10B981]" />
            <h2 className="text-base font-semibold text-[#D4AF37]">AI Assist</h2>
          </div>
          <button onClick={onClose} className="text-[#9a9a9a] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <p className="text-xs leading-snug text-[#6b6b6b]">
            Describe a change to THIS page -- e.g. &quot;add a pricing section&quot; or &quot;make the heading larger and center it&quot;. You&apos;ll see
            exactly what it proposes before anything is applied, and every applied change can be undone.
          </p>

          <div className="space-y-2">
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={3}
              placeholder="What should change on this page?"
              className="w-full rounded-md border border-[#D4AF37]/20 bg-[#121212] px-2.5 py-1.5 text-sm text-[#F0F0F0] outline-none focus:border-[#D4AF37]"
            />
            <button
              onClick={handleGenerate}
              disabled={!instruction.trim() || loading}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#10B981] py-2 text-xs font-semibold text-[#07070A] transition hover:bg-[#0ea371] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {loading ? 'Thinking…' : 'Generate'}
            </button>
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-md border border-[#B91C1C]/30 bg-[#B91C1C]/10 p-2 text-xs text-[#f09a9a]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}

          {editor.lastError && (
            <p className="flex items-start gap-2 rounded-md border border-[#B91C1C]/30 bg-[#B91C1C]/10 p-2 text-xs text-[#f09a9a]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              An applied operation failed against the live document: {editor.lastError}
            </p>
          )}

          {proposal && (
            <div className="space-y-3 rounded-md border border-[#D4AF37]/15 bg-[#161616] p-3">
              <p className="text-xs text-[#E5E5E5]">{proposal.explanation || 'No explanation provided.'}</p>

              {proposal.operations.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wide text-[#6b6b6b]">
                    {proposal.operations.length} change{proposal.operations.length === 1 ? '' : 's'} proposed
                  </p>
                  <ul className="space-y-1 text-xs text-[#9a9a9a]">
                    {proposal.operations.map((op, i) => (
                      <li key={i} className="truncate">
                        • {describeOperation(op)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {proposal.rejected.length > 0 && (
                <div className="space-y-1 border-t border-white/5 pt-2">
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#f09a9a]">
                    <AlertTriangle className="h-3 w-3" />
                    {proposal.rejected.length} proposed change{proposal.rejected.length === 1 ? '' : 's'} rejected (not applied)
                  </p>
                  <ul className="space-y-1 text-xs text-[#f09a9a]/80">
                    {proposal.rejected.map((r, i) => (
                      <li key={i} className="truncate" title={r.reason}>
                        • {r.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {proposal.operations.length === 0 && proposal.rejected.length === 0 && (
                <p className="text-xs text-[#6b6b6b]">The AI made no changes for this instruction.</p>
              )}

              {!applied ? (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleApply}
                    disabled={proposal.operations.length === 0}
                    className="flex-1 rounded-md bg-[#D4AF37] py-1.5 text-xs font-semibold text-[#1a1a1a] transition hover:bg-[#c7a233] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Apply {proposal.operations.length > 0 ? `(${proposal.operations.length})` : ''}
                  </button>
                  <button onClick={handleDiscard} className="flex-1 rounded-md border border-white/10 py-1.5 text-xs text-[#9a9a9a] hover:text-[#E5E5E5]">
                    Discard
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-[#10B981]">Applied. Undo (Ctrl/Cmd+Z) reverts it like any other edit; remember to Save when you're happy.</p>
                  <button onClick={handleDiscard} className="w-full rounded-md border border-white/10 py-1.5 text-xs text-[#9a9a9a] hover:text-[#E5E5E5]">
                    Ask something else
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
