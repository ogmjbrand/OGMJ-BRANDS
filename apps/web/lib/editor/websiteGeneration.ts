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
 * business description can be arbitrarily long free text. Keyed by page id.
 *
 * One-shot protection against a real page *refresh* re-triggering
 * generation comes from the `?generate=1` URL param the editor route
 * strips via router.replace() once read (see peekGenerationRequest below
 * for why this stash itself is deliberately NOT deleted on read).
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

/**
 * Reads a stashed generation request for this page, if one is waiting.
 *
 * Deliberately non-destructive (a peek, not a take): the page editor route
 * can remount shortly after the initial redirect here (observed via
 * browser-level testing -- reproducible even for a plain, pre-existing
 * editor navigation with no generation involved, so this is an existing
 * characteristic of this dynamic route, not something new this feature
 * introduced). A mount effect that *deletes* the stash on first read would
 * let that first, discarded mount consume it, then silently leave the
 * user looking at a blank editor with no explanation when the remounted
 * instance finds nothing to generate. Re-reading it on every mount instead
 * means a remount harmlessly restarts generation rather than losing it --
 * the AI call is idempotent and bounded, so re-running it once is a far
 * better outcome than silently dropping it. One-shot protection against a
 * genuine page *refresh* is NOT this function's job -- see
 * shouldAutoGenerate, which callers should use instead of calling this
 * directly from the page route.
 */
export function peekGenerationRequest(pageId: string): GenerationRequest | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_PREFIX + pageId);
    if (!raw) return null;
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

/**
 * The real one-shot consumption: called once the user actually acts on the
 * resulting proposal (applies or discards it -- see AIAssistPanel), not on
 * read, and not merely once the AI call settles. The page editor route can
 * remount shortly after the initial redirect here, possibly more than
 * once, and each remount unmounts whatever in-flight fetch or
 * already-returned-but-unseen proposal the previous instance held --
 * clearing any earlier than "the user saw and acted on it" would let one
 * of those remounts silently swallow the generation with nothing shown.
 * Leaving the stash in place until then means every remount just re-runs
 * generation (one extra AI call in the rare case this happens more than
 * once, never a silently empty editor), and a later revisit to the same
 * page in the same tab -- after the user already applied or discarded --
 * correctly does not re-generate.
 */
export function clearGenerationRequest(pageId: string): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_PREFIX + pageId);
  } catch {
    // sessionStorage unavailable -- nothing to clear.
  }
}

/**
 * In-memory (NOT sessionStorage) set of page ids whose `?generate=1` URL
 * trigger has been seen at least once during THIS script execution.
 *
 * This is what actually distinguishes the two cases peekGenerationRequest's
 * non-destructive read can't tell apart on its own: a soft remount of the
 * page route within the same browser tab/script execution (where this Set
 * is still populated, and generation SHOULD restart) versus a genuine
 * full-page refresh or revisit (where the whole module re-executes from
 * scratch, this Set comes back empty, and -- combined with the URL no
 * longer carrying `?generate=1`, already stripped before any such refresh
 * -- generation correctly does NOT restart, even though the sessionStorage
 * stash itself may still be sitting there unconsumed).
 */
const generateTriggerSeenThisLoad = new Set<string>();

/**
 * The single decision point for whether this mount of the page editor
 * route should auto-generate: pass whatever `searchParams.get('generate')
 * === '1'` evaluates to on EVERY mount (not just the first), including a
 * remount where the URL has already been stripped -- this function, not
 * the caller, is what remembers that a `?generate=1` was seen earlier in
 * this same script execution via generateTriggerSeenThisLoad.
 */
export function shouldAutoGenerate(pageId: string, urlHasGenerateFlag: boolean): GenerationRequest | null {
  if (urlHasGenerateFlag) generateTriggerSeenThisLoad.add(pageId);
  if (!generateTriggerSeenThisLoad.has(pageId)) return null;
  return peekGenerationRequest(pageId);
}
