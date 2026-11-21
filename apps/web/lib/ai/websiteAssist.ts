/**
 * OGMJ BRANDS — AI Website Assist (Phase 3, Milestone F).
 *
 * Honestly scoped: this is NOT "describe an entire multi-page luxury
 * fashion site and get it all back fully built" -- it is a real, working
 * integration that takes one instruction plus the CURRENT page's document
 * and proposes a bounded batch of `DocumentOperation`s against it, reusing
 * the exact Anthropic client and model already configured and working for
 * /api/ai/assist (see lib/ai/anthropic.ts). Because the ground truth for
 * "what changed so far" is the document itself (not a stored chat
 * transcript), a user can issue several instructions in a row -- "add a
 * pricing section", then "make the heading bigger" -- and each one
 * naturally refines the result of the last, without this module needing
 * any session/conversation state of its own.
 *
 * SAFETY: every operation the model proposes is independently validated
 * by `validateOperation` (operationSchema.ts) before it is ever returned
 * to a caller -- this module never trusts the model's JSON output just
 * because it parsed. A response is capped at MAX_OPERATIONS_PER_REQUEST
 * operations and the whole proposal is rejected outright if the model
 * tries to smuggle more than that, rather than silently truncating (which
 * would apply a prefix of a change the model intended as a whole).
 */
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient, isAIConfigured, AI_MODEL } from './anthropic';
import { validateOperation, type DocumentRoot, type ValidatedDocumentOperation } from '@/lib/document-model';

export const MAX_OPERATIONS_PER_REQUEST = 20;
/** A document much larger than this is already an unusual amount of context to hand an LLM in one call; refuse clearly rather than sending an enormous, expensive request. */
const MAX_DOCUMENT_JSON_BYTES_FOR_AI = 200_000;

export class WebsiteAssistError extends Error {}

export interface RejectedOperation {
  raw: unknown;
  reason: string;
}

export interface WebsiteAssistResult {
  explanation: string;
  operations: ValidatedDocumentOperation[];
  rejected: RejectedOperation[];
}

const SYSTEM_PROMPT = `You are the AI editing assistant inside OGMJ BRANDS' visual website builder.

You propose changes to ONE page's document by emitting a JSON array of operations against the existing Document Model -- you never write HTML or a page description, only operations.

Respond with ONLY a single JSON object, no markdown fences, no prose outside it, matching exactly:
{"explanation": "one or two plain sentences describing what you're about to do", "operations": [ ... ]}

Each operation is one of these shapes (op is always present and literal):
- {"op":"insertNode","parentId":"<existing container node id>","index":<integer>,"node":<a DocumentNode>}
- {"op":"removeNode","nodeId":"<existing node id>"}
- {"op":"moveNode","nodeId":"<existing node id>","newParentId":"<existing container node id>","newIndex":<integer>}
- {"op":"updateNodeProps","nodeId":"<existing node id>","path":["field","subfield",...],"value":<any JSON value>}
- {"op":"setSlotContent","nodeId":"<a componentInstance node id>","slotName":"<slot name>","content":[<DocumentNode>, ...]}  (omit "content" entirely to clear the slot)
- {"op":"applyVariant","nodeId":"<a componentInstance node id>","variantId":"<variant id>"}  (omit "variantId" entirely to clear the variant)
- {"op":"upsertAsset","assetId":"<id>","asset":{"id":"<same id>","kind":"image","url":"https://...","altText":"..."}}
- {"op":"upsertComponent","componentId":"<id>","definition":{...}}  (rarely needed -- prefer inserting/editing nodes)

If the document you're given already has entries under "components", those are real, reusable component definitions (e.g. a navbar, hero, footer, pricing section) -- check their "id", "variants" and "propSchema" there first and prefer inserting a "componentInstance" node referencing one of them over building the same kind of section from scratch with plain nodes. Don't force a component onto content it doesn't fit, and plain nodes are still the right choice for anything no available component covers.

A DocumentNode is one of: {"id","kind":"root"|"section"|"container","children":[...]}, {"id","kind":"heading","text","level":1-6}, {"id","kind":"text","text"}, {"id","kind":"image","assetRef"}, {"id","kind":"button","label","href","variant":"primary"|"secondary"|"ghost"}, {"id","kind":"componentInstance","componentId","variantId"?,"propOverrides"?,"slotContent"?}. Every node may also carry an optional "style" object with: width, height, padding, margin, background, color, display ("block"|"flex"|"grid"|"none"), flexDirection ("row"|"column"), gap, align ("start"|"center"|"end"|"stretch"), justify ("start"|"center"|"end"|"between"), textAlign ("left"|"center"|"right"), borderRadius. A style value may instead be {"base": value, "md": value, "lg": value} for responsive overrides.

CRITICAL RULES:
- Every "id" you invent (for a new node, a new asset) MUST be a fresh string you make up, 1-128 characters, using only letters, digits, "_" and "-" -- never reuse an id that already exists in the current document, and never use "__proto__", "constructor", or "prototype" as any id or path segment.
- Only reference a "parentId"/"nodeId"/"newParentId" that actually exists in the CURRENT document you were given below -- never invent one.
- Only a node whose kind is "root", "section", "container", or "custom" can be a parentId (hold children) -- never target a "heading"/"text"/"button"/"image" node as a parent.
- "href" values must be http(s), mailto:, tel:, a site-relative path starting with "/", or an in-page anchor starting with "#" -- never "javascript:" or "data:".
- Produce the SMALLEST set of operations that accomplishes the instruction. Do not restate or touch nodes that don't need to change.
- Never invent specific facts about the business you weren't given -- no fabricated testimonials, customer names, statistics, pricing, or claims not present in the current document or the instruction. Where content like a testimonial or stat would normally go but none was provided, use clearly-labeled placeholder copy instead of inventing one.
- Never emit more than ${MAX_OPERATIONS_PER_REQUEST} operations in one response.
- If the instruction is unclear or you cannot safely accomplish it with these operations, return an empty "operations" array and explain why in "explanation".`;

interface ParsedModelResponse {
  explanation?: unknown;
  operations?: unknown;
}

/** Claude is asked to return raw JSON, but strips a markdown fence defensively in case one slips through anyway. */
function extractJson(text: string): ParsedModelResponse {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through to fence-stripping below
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // fall through
    }
  }
  throw new WebsiteAssistError('The AI response was not valid JSON.');
}

export async function proposeWebsiteOperations(instruction: string, document: DocumentRoot): Promise<WebsiteAssistResult> {
  if (!isAIConfigured()) {
    throw new WebsiteAssistError('AI is not configured on this deployment (ANTHROPIC_API_KEY is not set).');
  }
  if (!instruction.trim()) {
    throw new WebsiteAssistError('Instruction must not be empty.');
  }

  const documentJson = JSON.stringify(document);
  if (documentJson.length > MAX_DOCUMENT_JSON_BYTES_FOR_AI) {
    throw new WebsiteAssistError(
      `This page's document is too large to send to the AI assistant in one request (${documentJson.length} bytes, limit ${MAX_DOCUMENT_JSON_BYTES_FOR_AI}). Try a smaller, more focused page.`
    );
  }

  const client = getAnthropicClient();
  let response: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 8_000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Current document (JSON):\n${documentJson}\n\nInstruction: ${instruction.trim()}` }],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) throw new WebsiteAssistError('Invalid ANTHROPIC_API_KEY.');
    if (error instanceof Anthropic.RateLimitError) throw new WebsiteAssistError('AI rate limit reached -- try again shortly.');
    // Classified explicitly (consistent with lib/ai/providers/anthropicProvider.ts)
    // rather than falling through to APIError/the raw rethrow below: a timeout
    // is a distinct, actionable failure mode (retry is reasonable; a bad key or
    // bad request is not), and leaving it unclassified means the raw SDK error
    // object reaches this module's caller's catch block undifferentiated.
    if (error instanceof Anthropic.APIConnectionTimeoutError) throw new WebsiteAssistError('AI request timed out.');
    if (error instanceof Anthropic.APIError) throw new WebsiteAssistError(`AI request failed (${error.status}).`);
    throw error;
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const parsed = extractJson(text);
  const explanation = typeof parsed.explanation === 'string' ? parsed.explanation : '';
  const rawOperations = Array.isArray(parsed.operations) ? parsed.operations : [];

  if (rawOperations.length > MAX_OPERATIONS_PER_REQUEST) {
    throw new WebsiteAssistError(
      `The AI proposed ${rawOperations.length} operations, more than the ${MAX_OPERATIONS_PER_REQUEST}-operation limit for one request. Try a narrower instruction.`
    );
  }

  const operations: ValidatedDocumentOperation[] = [];
  const rejected: RejectedOperation[] = [];
  for (const raw of rawOperations) {
    const result = validateOperation(raw);
    if (result.success && result.operation) {
      operations.push(result.operation);
    } else {
      rejected.push({ raw, reason: result.errors.join('; ') || 'Invalid operation' });
    }
  }

  return { explanation, operations, rejected };
}
