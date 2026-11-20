/**
 * OGMJ BRANDS — Document model security primitives.
 *
 * Every function here follows the same rule: ALLOW-LIST, never block-list.
 * A block-list ("reject strings containing `;` or `{`") is how CSS/URL
 * injection bugs survive code review — there is always one more character
 * combination nobody thought of. Everything below instead defines the
 * narrow shape a value is allowed to have and rejects everything else,
 * including values that would otherwise look harmless.
 *
 * These checks are applied in TWO places, deliberately: once in
 * `schema.ts` (so a malicious or malformed document is rejected before it
 * is ever stored or handed to the renderer) and again in
 * `DocumentRenderer.tsx` (so the renderer never trusts that whatever
 * called it already validated — defense in depth, not redundancy for its
 * own sake).
 */

// ================================
// IDENTIFIERS
// ================================

/**
 * Every id in the document model (node id, component id, variant id, asset
 * id, slot name, token-set id, breakpoint key, custom node type) is
 * rendered directly into HTML attributes and, for node ids specifically,
 * into a hand-built CSS attribute selector (`[data-node="<id>"]`) inside a
 * raw `<style>` block. React attribute serialization safely escapes HTML
 * attribute values on its own, but the CSS selector string is NOT passed
 * through React's escaping — it is plain string interpolation into a
 * `dangerouslySetInnerHTML` block. A one-character allow-list on every
 * identifier closes that off entirely: there is no character in this set
 * that can end a `"..."` CSS string, a `[...]` selector, or a declaration.
 */
export const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Identifiers are also used as plain-object keys (`document.components[id]`,
 * `document.assets[id]`) — these three names, although they match the
 * character allow-list above, resolve to JS's own prototype machinery
 * rather than an absent property, which would otherwise let a crafted
 * document make a lookup silently return `Object.prototype` instead of
 * `undefined` and crash (or worse) whatever reads it next.
 */
const DANGEROUS_PROPERTY_NAMES = new Set(['__proto__', 'constructor', 'prototype']);

export function isSafeIdentifier(value: unknown): value is string {
  return typeof value === 'string' && SAFE_IDENTIFIER_PATTERN.test(value) && !DANGEROUS_PROPERTY_NAMES.has(value);
}

/** Used by legacy-content migration: keep an existing id if it's already safe, otherwise mint a new one. */
export function sanitizeIdentifier(value: unknown, fallback: string): string {
  return isSafeIdentifier(value) ? (value as string) : fallback;
}

/**
 * A plain-object lookup keyed by document-supplied data (`document.assets[id]`,
 * `document.components[id]`) must reject `__proto__`/`constructor`/`prototype`
 * -- those resolve to real JS prototype machinery on a plain object instead
 * of `undefined`, which can crash (or worse) whatever reads the result next.
 * The single canonical implementation lives here so the renderer and the
 * document-model's own operations never each carry their own copy that can
 * independently drift out of sync.
 */
export function safeObjectLookup<T>(record: Record<string, T> | undefined, key: string): T | undefined {
  if (!record || !isSafeIdentifier(key) || !Object.prototype.hasOwnProperty.call(record, key)) return undefined;
  return record[key];
}

// ================================
// URLS (href / src)
// ================================

const ALLOWED_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/** A site-relative path ("/about"), but not "//evil.com" or the "/\evil.com" backslash variant browsers treat as another host. */
function isSiteRelative(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\');
}

function isInPageAnchor(value: string): boolean {
  return value.startsWith('#');
}

/**
 * Returns the URL unchanged if it is safe to use as a link `href`, or
 * `undefined` if it must not be rendered at all. Explicitly rejects
 * `javascript:`, `data:`, `vbscript:`, `file:`, and any scheme not on the
 * allow-list — by construction (only `ALLOWED_URL_SCHEMES` ever returns
 * true), not by trying to enumerate what's dangerous.
 */
export function safeHref(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (isSiteRelative(trimmed) || isInPageAnchor(trimmed)) return trimmed;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return undefined;
  }
  return ALLOWED_URL_SCHEMES.has(url.protocol) ? url.toString() : undefined;
}

/** Media sources are narrower than links: only http(s) or site-relative — no mailto:/tel: images. */
export function safeSrc(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (isSiteRelative(trimmed)) return trimmed;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return undefined;
  }
  return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
}

export function isSafeHref(value: unknown): boolean {
  return safeHref(value) !== undefined;
}

export function isSafeSrc(value: unknown): boolean {
  return safeSrc(value) !== undefined;
}

// ================================
// CSS VALUES
// ================================
//
// Every one of these is an ALLOW-LIST regex, not a character block-list.
// A value that doesn't match is rejected outright — the renderer never
// tries to "clean up" or partially use a value that failed validation.

/** CSS length/size values: "16px", "1.5rem", "100%", "auto", "0", etc. */
export const SAFE_CSS_LENGTH_PATTERN =
  /^(0|-?\d+(\.\d+)?(px|rem|em|%|vh|vw|vmin|vmax|ch|fr)|auto|fit-content|max-content|min-content|none)$/;

/** CSS color values: hex, rgb()/rgba()/hsl()/hsla() with purely numeric arguments, or a bare color-keyword-shaped word. */
export const SAFE_CSS_COLOR_PATTERN =
  /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*(,\s*(0|1|0?\.\d+)\s*)?\)|hsla?\(\s*-?\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*(0|1|0?\.\d+)\s*)?\)|[a-zA-Z]{3,32})$/;

export function isSafeCssLength(value: unknown): boolean {
  return typeof value === 'string' && SAFE_CSS_LENGTH_PATTERN.test(value.trim());
}

export function isSafeCssColor(value: unknown): boolean {
  return typeof value === 'string' && SAFE_CSS_COLOR_PATTERN.test(value.trim());
}

/**
 * `mask.value` is the one place the schema still allows a hand-written CSS
 * fragment (a gradient or `url(...)` expression) rather than a fully
 * structured value, because CSS mask syntax is too varied to usefully
 * decompose for Phase 1. It is NOT a safe-by-construction allow-list like
 * the patterns above — it is a last-resort rejection of the characters
 * that would let a mask value break out of its declaration or the
 * surrounding `<style>` block (quotes, braces, semicolons, angle brackets,
 * comment delimiters, newlines, backslashes). Prefer
 * `isSafeCssColor`/`isSafeCssLength` wherever a value can be fully
 * structured instead of reaching for this.
 *
 * Backslash is rejected even though a CSS hex-escape sequence (e.g. `\7d`
 * for `}`) was empirically confirmed NOT to achieve a rule breakout in
 * Chromium (escapes decode into a token's string content, not into a fresh
 * structural separator token) -- it's excluded anyway so this blocklist
 * doesn't depend on that parser-specific tokenization behavior holding
 * across engines or future spec changes. No legitimate gradient/`url(...)`
 * mask value needs a literal backslash.
 */
const CSS_BREAKOUT_PATTERN = /["'{};<>\n\r\\]|\/\*|\*\//;

export function isSafeCssFragment(value: unknown): boolean {
  return typeof value === 'string' && value.length <= 256 && !CSS_BREAKOUT_PATTERN.test(value);
}

// ================================
// DOCUMENT SIZE / RECURSION LIMITS
// ================================

export const MAX_DOCUMENT_DEPTH = 64;
export const MAX_NODE_COUNT = 5000;
export const MAX_DOCUMENT_BYTES = 2_000_000; // 2MB of JSON

export interface DocumentLimitViolation {
  kind: 'depth' | 'nodeCount' | 'byteSize' | 'malformed';
  message: string;
}

/**
 * Measures an UNTRUSTED, not-yet-validated document's depth and node count
 * using an explicit stack, never function recursion — so a pathological
 * input (the thing we're specifically defending against) cannot overflow
 * the call stack while we're still deciding whether to reject it. This
 * must run, and must pass, BEFORE the document is handed to the recursive
 * Zod schema in schema.ts; Zod's own recursive parse has no depth limit of
 * its own and will stack-overflow on exactly the input this function
 * exists to catch.
 */
export function checkDocumentLimits(rawDocument: unknown): DocumentLimitViolation | null {
  let byteSize: number;
  try {
    byteSize = JSON.stringify(rawDocument)?.length ?? 0;
  } catch {
    return { kind: 'malformed', message: 'Document could not be serialized to measure its size' };
  }
  if (byteSize > MAX_DOCUMENT_BYTES) {
    return { kind: 'byteSize', message: `Document is ${byteSize} bytes, exceeding the ${MAX_DOCUMENT_BYTES}-byte limit` };
  }

  const root = (rawDocument as { root?: unknown } | null)?.root;
  if (root === undefined) return null; // malformed shape -- let Zod produce the specific, useful error

  // A component's own `template` (and any `slot.defaultContent` inside it)
  // is just as recursive as `root`, and `components: z.record(...)` is
  // parsed by the same unguarded-depth Zod schema -- so pathological
  // nesting hidden inside a component template needs the same pre-check,
  // sharing the same node-count budget as everything reachable from `root`.
  const componentTemplateRoots: unknown[] = [];
  const components = (rawDocument as { components?: unknown } | null)?.components;
  if (components && typeof components === 'object') {
    for (const definition of Object.values(components as Record<string, unknown>)) {
      const template = (definition as { template?: unknown } | null)?.template;
      if (template !== undefined) componentTemplateRoots.push(template);
    }
  }

  let nodeCount = 0;
  const stack: Array<{ node: unknown; depth: number }> = [
    { node: root, depth: 1 },
    ...componentTemplateRoots.map((node) => ({ node, depth: 1 })),
  ];
  while (stack.length > 0) {
    const { node, depth } = stack.pop() as { node: unknown; depth: number };
    if (depth > MAX_DOCUMENT_DEPTH) {
      return { kind: 'depth', message: `Document tree depth exceeds the limit of ${MAX_DOCUMENT_DEPTH}` };
    }
    nodeCount++;
    if (nodeCount > MAX_NODE_COUNT) {
      return { kind: 'nodeCount', message: `Document has more than ${MAX_NODE_COUNT} nodes` };
    }
    if (node && typeof node === 'object') {
      const children = (node as { children?: unknown }).children;
      if (Array.isArray(children)) {
        for (const child of children) stack.push({ node: child, depth: depth + 1 });
      }
      const slotContent = (node as { slotContent?: unknown }).slotContent;
      if (slotContent && typeof slotContent === 'object' && !Array.isArray(slotContent)) {
        for (const value of Object.values(slotContent as Record<string, unknown>)) {
          if (Array.isArray(value)) {
            for (const child of value) stack.push({ node: child, depth: depth + 1 });
          }
        }
      }
    }
  }
  return null;
}
