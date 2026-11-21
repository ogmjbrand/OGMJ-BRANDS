/**
 * AI-powered "New Website" creation -- the logic behind it, kept separate
 * from any React component so it's directly unit-testable (this codebase's
 * existing convention: no component-level tests anywhere, but every piece
 * of real logic a component drives lives in a plain, tested `.ts` module).
 *
 * Deliberately NOT a new AI endpoint or provider path: this module only
 * builds inputs for the EXISTING `/api/ai/website-assist` route and the
 * EXISTING `editor.apply` path (see AIAssistPanel.tsx) -- it never calls
 * an AI provider itself.
 */
import type { DocumentOperation, DocumentRoot } from '@/lib/document-model';
import { PRESET_COMPONENTS } from './presetComponents';

export interface GenerationRequest {
  description: string;
  requirements?: string;
}

/**
 * The instruction sent to the EXISTING proposeWebsiteOperations() (via
 * POST /api/ai/website-assist) when generating a brand-new homepage,
 * rather than a free-form manual edit. Framed as a full-page generation
 * request, with the same no-fabrication rule the website-assist system
 * prompt now also states generally (see lib/ai/websiteAssist.ts) --
 * repeated here too since this is the one call site that most needs it.
 */
export function buildGenerationInstruction(request: GenerationRequest): string {
  const lines = [
    'Generate a complete, professionally structured homepage for this business from scratch.',
    "Intelligently select, combine and customize the available preset components where they genuinely fit this business -- don't force every one onto the page if it doesn't make sense, and use plain content/container/section nodes for anything no preset covers.",
    'Make sure the layout reads well on both desktop and mobile using the responsive style overrides the document model already supports.',
    "Do not invent specific facts about the business -- no fabricated testimonials, customer names, statistics, pricing, or years in business beyond what's stated below. Where a section like testimonials would normally go but none were given, use clearly-labeled placeholder copy (e.g. \"Customer testimonials coming soon\") rather than inventing one.",
    '',
    `Business description:\n${request.description.trim()}`,
  ];
  if (request.requirements?.trim()) {
    lines.push('', `Specific requirements:\n${request.requirements.trim()}`);
  }
  return lines.join('\n');
}

/** A document with no component definitions yet -- true for every brand-new page. */
export function documentNeedsPresetSeed(document: Pick<DocumentRoot, 'components'>): boolean {
  return !document.components || Object.keys(document.components).length === 0;
}

/**
 * The exact operations ComponentsPanel's "Load the starter library" button
 * already dispatches one at a time -- reused verbatim (same 9 presets,
 * same operation shape) rather than re-describing them, so generation and
 * the manual Components panel can never drift into offering a different
 * component library.
 */
export function presetSeedOperations(): DocumentOperation[] {
  return PRESET_COMPONENTS.map((def) => ({ op: 'upsertComponent' as const, componentId: def.id, definition: def }));
}

const STORAGE_KEY_PREFIX = 'ogmj:ai-website-generate:';

/**
 * Hands a generation request from the "New Website" dialog (which creates
 * the website + first page, then navigates away) to the page editor that
 * opens next -- sessionStorage rather than a URL query param, since a
 * business description can be arbitrarily long free text. Keyed by page
 * id and consumed exactly once (see takeGenerationRequest) so a refresh
 * of the editor never re-triggers generation.
 */
export function stashGenerationRequest(pageId: string, request: GenerationRequest): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_PREFIX + pageId, JSON.stringify(request));
  } catch {
    // sessionStorage unavailable (private mode, disabled storage, SSR) --
    // generation simply won't auto-start; the user still lands in a normal,
    // working, blank editor. Not a fatal condition.
  }
}

/** Reads and immediately clears a stashed generation request, if one is waiting for this page. */
export function takeGenerationRequest(pageId: string): GenerationRequest | null {
  try {
    const key = STORAGE_KEY_PREFIX + pageId;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    sessionStorage.removeItem(key);
    const parsed = JSON.parse(raw) as { description?: unknown; requirements?: unknown };
    if (typeof parsed.description !== 'string' || !parsed.description.trim()) return null;
    return {
      description: parsed.description,
      requirements: typeof parsed.requirements === 'string' ? parsed.requirements : undefined,
    };
  } catch {
    return null;
  }
}
