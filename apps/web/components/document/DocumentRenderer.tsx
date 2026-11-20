/**
 * OGMJ BRANDS — Shared Document Renderer (Phase 1)
 *
 * Pure, synchronous, data-in/markup-out. It takes an already-validated
 * `DocumentRoot` (see `@/lib/document-model`) and renders it to React
 * elements. It does not fetch anything — page-level loaders (e.g. a future
 * successor to PR #72's `lib/sites/public-site.ts`) are responsible for
 * reading from the database and migrating legacy content before handing a
 * document to this component. That split is what lets the exact same
 * component serve the public renderer AND a future editor's live preview
 * pane: both just need a DocumentRoot, however they got one.
 *
 * Node kinds this component doesn't yet have a real runtime for (3D scenes,
 * most motion, shader effects) render a safe, labeled, static fallback
 * instead of either crashing or silently vanishing — "no premature 3D
 * infrastructure" without the document format having to pretend those
 * capabilities don't exist.
 */

import type { CSSProperties } from 'react';
import type {
  AssetId,
  AssetRef,
  ButtonNode,
  ComponentId,
  ComponentInstanceNode,
  ContainerNode,
  CustomNode,
  DesignTokenSet,
  DocumentNode,
  DocumentRoot,
  HeadingNode,
  ImageNode,
  RootNode,
  Scene3DNode,
  SectionNode,
  SlotNode,
  TextNode,
  VideoNode,
} from '@/lib/document-model/types';
import { getChildren } from '@/lib/document-model/tree';
import { resolveStyleValue } from '@/lib/document-model/tokens';
import { isSafeCssColor, isSafeCssFragment, isSafeCssLength, isSafeIdentifier, safeHref, safeSrc } from '@/lib/document-model/security';

/**
 * SECURITY (defense in depth): `schema.ts` already rejects an unsafe
 * identifier, URL, or CSS value before a document is stored. This
 * renderer does NOT assume that already happened for whatever document
 * it's handed, so every one of those same checks is re-applied here,
 * independently, immediately before the value is interpolated into HTML
 * or into the raw CSS text inside the <style> tag. A value that fails its
 * check is dropped (that one property, or that one node) rather than
 * rendered partially or substituted with something unvalidated.
 */

function safeObjectLookup<T>(record: Record<string, T> | undefined, key: string): T | undefined {
  if (!record || !isSafeIdentifier(key) || !Object.prototype.hasOwnProperty.call(record, key)) return undefined;
  return record[key];
}

interface RenderContext {
  document: DocumentRoot;
  tokenSet: DesignTokenSet;
  /** Collects generated CSS rules so they can be emitted once, in one <style> tag. */
  cssRules: string[];
  /** Dedupes rules between the CSS-collection pre-pass and the actual JSX render pass. */
  emittedRuleKeys: Set<string>;
  /**
   * componentInstance nodes (by object identity) whose expansion was found
   * to be cyclic by `markCyclicComponentInstances` -- see that function's
   * comment for why this has to be a pre-computed set consulted later,
   * rather than a stack pushed/popped live during the JSX render pass.
   */
  cyclicInstances: Set<ComponentInstanceNode>;
}

// ================================
// RESPONSIVE / TOKEN RESOLUTION -> CSS
// ================================

type CssPropertyName =
  | 'width' | 'height' | 'padding' | 'margin' | 'background' | 'color' | 'display'
  | 'flex-direction' | 'gap' | 'align-items' | 'justify-content' | 'text-align' | 'border-radius';

const DISPLAY_MAP: Record<string, string> = { block: 'block', flex: 'flex', grid: 'grid', none: 'none' };
const ALIGN_MAP: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
const JUSTIFY_MAP: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' };

/** Is this value per-breakpoint, or a single bare value? */
function isResponsiveMap(value: unknown): value is { base: unknown } & Record<string, unknown> {
  return typeof value === 'object' && value !== null && !('token' in (value as Record<string, unknown>)) && 'base' in (value as Record<string, unknown>);
}

/**
 * Emits one CSS variable declaration per breakpoint for a single style prop
 * on a single node, and returns the `var(...)` reference to use in the
 * node's own inline style. This is how "designed for desktop, tablet,
 * mobile and custom breakpoints" becomes real, server-rendered CSS with no
 * client JS and no CSS-in-JS dependency.
 *
 * SECURITY: `nodeId` is interpolated into a hand-built CSS attribute
 * selector (`[data-node="<id>"]`) and `validate` gates every resolved
 * value, string or not, before it is interpolated into the raw CSS text
 * written into the <style> block below. Both checks run regardless of
 * whether the document was already validated by `schema.ts` — an id or a
 * value that fails either check is dropped silently (no rule emitted, no
 * `var()` reference returned) rather than partially trusted.
 */
function resolveResponsiveCssVar(
  nodeId: string,
  cssProp: CssPropertyName,
  rawValue: unknown,
  ctx: RenderContext,
  validate: (value: string) => boolean
): string | undefined {
  if (rawValue === undefined) return undefined;
  if (!isSafeIdentifier(nodeId)) return undefined;
  const varName = `--n-${nodeId}-${cssProp}`;
  const dedupeKey = `${nodeId}:${cssProp}`;
  if (ctx.emittedRuleKeys.has(dedupeKey)) return `var(${varName})`;

  const resolve = (v: unknown): string | null => {
    const resolved = resolveStyleValue(v as never, ctx.tokenSet) as unknown;
    if (typeof resolved !== 'string' || !validate(resolved)) return null;
    return resolved;
  };

  const rules: string[] = [];
  if (isResponsiveMap(rawValue)) {
    const entries = rawValue as Record<string, unknown>;
    const baseVal = resolve(entries.base);
    if (baseVal === null) return undefined; // an invalid base value invalidates the whole responsive set
    rules.push(`[data-node="${nodeId}"]{${varName}:${baseVal};}`);
    for (const bp of ctx.document.breakpoints) {
      if (bp.key === 'base' || entries[bp.key] === undefined || !isSafeIdentifier(bp.key) || !Number.isFinite(bp.minWidthPx)) continue;
      const overrideVal = resolve(entries[bp.key]);
      if (overrideVal === null) continue; // skip just this one breakpoint override, not the whole property
      rules.push(`@media (min-width:${bp.minWidthPx}px){[data-node="${nodeId}"]{${varName}:${overrideVal};}}`);
    }
  } else {
    const val = resolve(rawValue);
    if (val === null) return undefined;
    rules.push(`[data-node="${nodeId}"]{${varName}:${val};}`);
  }

  ctx.emittedRuleKeys.add(dedupeKey);
  ctx.cssRules.push(...rules);
  return `var(${varName})`;
}

const KEYWORD_VALIDATOR = (map: Record<string, string>) => (value: string) => value in map;

function nodeInlineStyle(node: DocumentNode, ctx: RenderContext): CSSProperties {
  const style = (node as { style?: Record<string, unknown> }).style;
  if (!style) return {};

  const out: Record<string, string> = {};
  const set = (cssProp: CssPropertyName, value: unknown, validate: (value: string) => boolean) => {
    const resolved = resolveResponsiveCssVar(node.id, cssProp, value, ctx, validate);
    if (resolved) out[cssProp] = resolved;
  };

  set('width', style.width, isSafeCssLength);
  set('height', style.height, isSafeCssLength);
  set('padding', style.padding, isSafeCssLength);
  set('margin', style.margin, isSafeCssLength);
  set('background', style.background, isSafeCssColor);
  set('color', style.color, isSafeCssColor);
  set('display', style.display, KEYWORD_VALIDATOR(DISPLAY_MAP));
  set('flex-direction', style.flexDirection, KEYWORD_VALIDATOR({ row: 'row', column: 'column' }));
  set('gap', style.gap, isSafeCssLength);
  set('align-items', style.align, KEYWORD_VALIDATOR(ALIGN_MAP));
  set('justify-content', style.justify, KEYWORD_VALIDATOR(JUSTIFY_MAP));
  set('text-align', style.textAlign, KEYWORD_VALIDATOR({ left: 'left', center: 'center', right: 'right' }));
  set('border-radius', style.borderRadius, isSafeCssLength);

  const effects = style.effects as
    | { filters?: Record<string, number>; mask?: { type: string; value: unknown }; shaderRef?: { shaderId: unknown } }
    | undefined;
  const filterParts: string[] = [];
  if (effects?.filters) {
    const f = effects.filters;
    if (f.blurPx) filterParts.push(`blur(${f.blurPx}px)`);
    if (f.brightness !== undefined) filterParts.push(`brightness(${f.brightness})`);
    if (f.contrast !== undefined) filterParts.push(`contrast(${f.contrast})`);
    if (f.saturate !== undefined) filterParts.push(`saturate(${f.saturate})`);
    if (f.grayscale !== undefined) filterParts.push(`grayscale(${f.grayscale})`);
    if (f.hueRotateDeg !== undefined) filterParts.push(`hue-rotate(${f.hueRotateDeg}deg)`);
  }
  if (filterParts.length) out.filter = filterParts.join(' ');

  // `mask` gets real (CSS-native) effect today, re-validated here even though
  // schema.ts already constrains it, because this fragment is the one place
  // the document model allows a hand-written CSS value rather than a fully
  // structured one -- see security.ts' isSafeCssFragment doc comment.
  if (effects?.mask && isSafeCssFragment(effects.mask.value)) {
    out.maskImage = effects.mask.value as string;
    out.WebkitMaskImage = effects.mask.value as string;
  }
  // shaderRef has no runtime in Phase 1 (see Scene3DBlock's note on 3D for
  // the same reasoning) -- explicitly recorded as a data attribute by the
  // caller (nodeExtraAttributes below) so it is never silently dropped.

  return out as React.CSSProperties;
}

/** Non-style data attributes this node should carry — currently just the shaderRef passthrough. Kept out of nodeInlineStyle so it's not re-run by collectCssRules. */
function nodeExtraAttributes(node: DocumentNode): Record<string, string> {
  const style = (node as { style?: { effects?: { shaderRef?: { shaderId?: unknown } } } }).style;
  const shaderId = style?.effects?.shaderRef?.shaderId;
  if (typeof shaderId === 'string' && isSafeIdentifier(shaderId)) {
    return { 'data-ogmj-shader-ref': shaderId };
  }
  return {};
}

/** Data attributes carrying motion intent for a future JS motion engine; CSS-only fade is applied today as a tasteful baseline. */
function motionAttributes(node: DocumentNode): { attrs: Record<string, string>; loadFadeClass?: string } {
  const motion = (node as { motion?: { triggers: Array<{ on: string }> } }).motion;
  if (!motion || motion.triggers.length === 0) return { attrs: {} };
  return {
    attrs: { 'data-motion': JSON.stringify(motion) },
    loadFadeClass: motion.triggers.some((t) => t.on === 'load') ? 'ogmj-fade-in' : undefined,
  };
}

function resolveAsset(assetRef: AssetId, ctx: RenderContext): AssetRef | undefined {
  return safeObjectLookup(ctx.document.assets, assetRef);
}

/**
 * JSX element creation is lazy (`<RenderNode .../>` just builds a React
 * element descriptor; component bodies run later, inside
 * renderToStaticMarkup's own walk). The <style> tag's contents are built as
 * a plain string by DocumentRenderer's own function body, which runs
 * *before* any of that lazy tree is walked — so collecting CSS rules as a
 * side effect of rendering would leave the <style> tag empty. This plain
 * (non-JSX) tree walk runs first and populates `ctx.cssRules` eagerly;
 * `emittedRuleKeys` then makes the later, real render pass's calls to
 * `nodeInlineStyle` idempotent instead of duplicating every rule.
 */
function collectCssRules(node: DocumentNode, ctx: RenderContext): void {
  nodeInlineStyle(node, ctx);
  const children = getChildren(node);
  if (children) {
    for (const child of children) collectCssRules(child, ctx);
  }
  if (node.kind === 'componentInstance') {
    // Same safe lookup as ComponentInstanceBlock below -- see its comment.
    // SECURITY: never expand a cyclic instance here either -- see
    // markCyclicComponentInstances, which has already run by this point.
    if (ctx.cyclicInstances.has(node)) return;
    const definition = safeObjectLookup(ctx.document.components, node.componentId);
    if (definition) collectCssRules(substituteSlots(definition.template, node.slotContent), ctx);
  }
}

/**
 * SECURITY: a componentInstance's `componentId` is just a string reference
 * into `document.components` -- nothing in schema.ts walks that reference
 * graph for cycles, so a structurally small, schema-VALID document can still
 * describe infinite expansion (A's template contains an instance of A, or
 * A -> B -> A, or a longer cycle). `checkDocumentLimits` cannot catch this
 * either: it measures each component template's own static shape, never the
 * expansion graph formed by componentId references between templates.
 *
 * This must run as a single eager, non-JSX, plain-recursion walk -- same
 * reasoning as `collectCssRules` above: JSX element creation is lazy, so a
 * push-before/pop-after-return guard inside the JSX `ComponentInstanceBlock`
 * component would always pop before React ever walks into the (lazy) child
 * tree it just returned, making live stack tracking there a no-op. Instead,
 * this walk resolves the full expansion ahead of time and records which
 * SPECIFIC componentInstance node objects are cyclic (by identity, since the
 * same component can be legitimately instantiated more than once in
 * unrelated branches -- only a repeat along the SAME ancestor chain is a
 * cycle). The later, lazy JSX pass then just consults that pre-computed set.
 *
 * `chain` is the set of component ids currently being expanded along the
 * current root-to-node path; it is restored (an id removed) after each
 * recursive call returns, so sibling/cousin branches don't contaminate each
 * other, while true ancestor repeats are still caught regardless of length.
 */
function markCyclicComponentInstances(node: DocumentNode, ctx: RenderContext, chain: Set<ComponentId>): void {
  if (node.kind === 'componentInstance') {
    const definition = safeObjectLookup(ctx.document.components, node.componentId);
    if (!definition) return; // missing component is handled separately at render time, not a cycle
    if (chain.has(definition.id)) {
      ctx.cyclicInstances.add(node);
      return; // do not recurse further into a cyclic branch
    }
    chain.add(definition.id);
    markCyclicComponentInstances(substituteSlots(definition.template, node.slotContent), ctx, chain);
    chain.delete(definition.id);
    return;
  }
  const children = getChildren(node);
  if (children) {
    for (const child of children) markCyclicComponentInstances(child, ctx, chain);
  }
}

// ================================
// NODE RENDERERS (the component registry)
// ================================

function RenderChildren({ children, ctx }: { children: DocumentNode[]; ctx: RenderContext }) {
  return <>{children.map((child) => <RenderNode key={child.id} node={child} ctx={ctx} />)}</>;
}

function RootOrContainer({ node, ctx }: { node: RootNode | SectionNode | ContainerNode; ctx: RenderContext }) {
  const { attrs, loadFadeClass } = motionAttributes(node);
  const Tag = node.kind === 'section' ? 'section' : 'div';
  return (
    <Tag data-node={node.id} className={loadFadeClass} style={nodeInlineStyle(node, ctx)} {...attrs} {...nodeExtraAttributes(node)}>
      <RenderChildren children={node.children} ctx={ctx} />
    </Tag>
  );
}

function HeadingBlock({ node, ctx }: { node: HeadingNode; ctx: RenderContext }) {
  const Tag = (`h${node.level}` as unknown) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return (
    <Tag data-node={node.id} style={nodeInlineStyle(node, ctx)} {...nodeExtraAttributes(node)}>
      {node.text}
    </Tag>
  );
}

function TextBlock({ node, ctx }: { node: TextNode; ctx: RenderContext }) {
  // Always plain text — marks are a constrained list, never raw HTML.
  return (
    <p data-node={node.id} style={nodeInlineStyle(node, ctx)} {...nodeExtraAttributes(node)}>
      {node.text}
    </p>
  );
}

function ImageBlock({ node, ctx }: { node: ImageNode; ctx: RenderContext }) {
  const asset = resolveAsset(node.assetRef, ctx);
  if (!asset) return null;
  // SECURITY (defense in depth): re-validate the asset URL at render time even
  // though schema.ts already constrains AssetRef.url -- see the module header.
  const src = safeSrc(asset.url);
  if (!src) return null;
  return (
    <figure data-node={node.id} style={nodeInlineStyle(node, ctx)} {...nodeExtraAttributes(node)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- asset hosts are arbitrary */}
      <img src={src} alt={asset.altText ?? ''} loading="lazy" style={{ objectFit: node.objectFit ?? 'cover' }} />
      {node.caption ? <figcaption>{node.caption}</figcaption> : null}
    </figure>
  );
}

function VideoBlock({ node, ctx }: { node: VideoNode; ctx: RenderContext }) {
  const asset = resolveAsset(node.assetRef, ctx);
  if (!asset) return null;
  const src = safeSrc(asset.url);
  if (!src) return null;
  const poster = node.posterAssetRef ? resolveAsset(node.posterAssetRef, ctx) : undefined;
  const posterSrc = poster ? safeSrc(poster.url) : undefined;
  return (
    <video
      data-node={node.id}
      style={nodeInlineStyle(node, ctx)}
      {...nodeExtraAttributes(node)}
      src={src}
      poster={posterSrc}
      autoPlay={node.autoplay}
      loop={node.loop}
      muted={node.muted}
      controls={!node.autoplay}
    />
  );
}

function ButtonBlock({ node, ctx }: { node: ButtonNode; ctx: RenderContext }) {
  // SECURITY: re-validate at render time even though schema.ts already
  // requires a safe href -- never trust that every caller validated first.
  // An unsafe/unparseable href renders as inert text, not a dead link, so
  // the button's content isn't silently dropped either.
  const href = safeHref(node.href);
  if (!href) {
    return (
      <span data-node={node.id} data-variant={node.variant ?? 'primary'} style={nodeInlineStyle(node, ctx)} {...nodeExtraAttributes(node)}>
        {node.label}
      </span>
    );
  }
  const external = /^https?:/.test(href);
  return (
    <a
      data-node={node.id}
      data-variant={node.variant ?? 'primary'}
      style={nodeInlineStyle(node, ctx)}
      {...nodeExtraAttributes(node)}
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {node.label}
    </a>
  );
}

/** A bare SlotNode outside of component-instance substitution: render its default content. */
function SlotBlock({ node, ctx }: { node: SlotNode; ctx: RenderContext }) {
  return <RenderChildren children={node.defaultContent ?? []} ctx={ctx} />;
}

/**
 * Resolves a component instance: look up the definition + variant, splice
 * `slotContent` into the template's `slot` nodes (falling back to each
 * slot's own defaultContent), and render the result. This is the one place
 * nested compositions, reuse, variants, and slots all come together.
 */
function substituteSlots(template: DocumentNode, slotContent: Record<string, DocumentNode[]> | undefined): DocumentNode {
  if (template.kind === 'slot') {
    const content = slotContent?.[template.slotName];
    if (content) {
      // A slot filled with multiple nodes becomes a transparent wrapper.
      return { id: template.id, kind: 'container', children: content };
    }
    return template;
  }
  const children = getChildren(template);
  if (!children) return template;
  const nextChildren = children.map((c) => substituteSlots(c, slotContent));
  return { ...template, children: nextChildren } as DocumentNode;
}

function ComponentInstanceBlock({ node, ctx }: { node: ComponentInstanceNode; ctx: RenderContext }) {
  // SECURITY: a plain-object lookup keyed by document-supplied data must
  // reject __proto__/constructor/prototype (see security.ts) -- otherwise
  // a crafted componentId can resolve to Object.prototype instead of
  // undefined and crash the .variants.find() call below.
  const definition = safeObjectLookup(ctx.document.components, node.componentId);
  if (!definition) return <MissingComponentPlaceholder node={node} />;
  // SECURITY: a self- or mutually-referencing component graph is flagged by
  // markCyclicComponentInstances before this JSX pass ever runs (see its
  // comment for why that has to happen eagerly, ahead of time, rather than
  // via a stack tracked live here) -- never expand it, or this recurses
  // without bound and crashes the render.
  if (ctx.cyclicInstances.has(node)) return <CyclicComponentPlaceholder node={node} />;
  const variant = node.variantId ? definition.variants.find((v) => v.id === node.variantId) : undefined;
  // Variant/instance propOverrides are resolved against propSchema defaults in a
  // future editor-facing prop-binding layer; Phase 1 establishes the shape and
  // slot substitution, which is the part the renderer must get right today.
  void variant;
  const resolved = substituteSlots(definition.template, node.slotContent);
  return (
    <div data-node={node.id} data-component={definition.id} data-variant={node.variantId ?? 'default'}>
      <RenderNode node={resolved} ctx={ctx} />
    </div>
  );
}

function MissingComponentPlaceholder({ node }: { node: ComponentInstanceNode }) {
  return (
    <div data-node={node.id} data-ogmj-missing-component={node.componentId} style={{ display: 'none' }} />
  );
}

/** Inert fallback for a componentInstance whose expansion would be cyclic (self- or mutually-referencing). */
function CyclicComponentPlaceholder({ node }: { node: ComponentInstanceNode }) {
  return (
    <div data-node={node.id} data-ogmj-cyclic-component={node.componentId} style={{ display: 'none' }} />
  );
}

/** No 3D runtime ships in Phase 1 — render the poster image (or a labeled placeholder) instead of WebGL. */
function Scene3DBlock({ node, ctx }: { node: Scene3DNode; ctx: RenderContext }) {
  const poster = node.scene.posterAssetRef ? resolveAsset(node.scene.posterAssetRef, ctx) : undefined;
  const posterSrc = poster ? safeSrc(poster.url) : undefined;
  return (
    <div data-node={node.id} data-ogmj-scene3d-placeholder="true" style={nodeInlineStyle(node, ctx)} {...nodeExtraAttributes(node)}>
      {posterSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={posterSrc} alt={poster?.altText ?? '3D scene preview'} />
      ) : (
        <div data-ogmj-scene3d-empty="true" />
      )}
    </div>
  );
}

function CustomBlock({ node, ctx }: { node: CustomNode; ctx: RenderContext }) {
  // Unregistered custom types still render their children (if any) rather
  // than vanishing — forward-compatible without guessing at presentation.
  return (
    <div data-node={node.id} data-ogmj-custom-type={node.customType}>
      {node.children ? <RenderChildren children={node.children} ctx={ctx} /> : null}
    </div>
  );
}

function RenderNode({ node, ctx }: { node: DocumentNode; ctx: RenderContext }) {
  switch (node.kind) {
    case 'root':
    case 'section':
    case 'container':
      return <RootOrContainer node={node} ctx={ctx} />;
    case 'heading':
      return <HeadingBlock node={node} ctx={ctx} />;
    case 'text':
      return <TextBlock node={node} ctx={ctx} />;
    case 'image':
      return <ImageBlock node={node} ctx={ctx} />;
    case 'video':
      return <VideoBlock node={node} ctx={ctx} />;
    case 'button':
      return <ButtonBlock node={node} ctx={ctx} />;
    case 'slot':
      return <SlotBlock node={node} ctx={ctx} />;
    case 'componentInstance':
      return <ComponentInstanceBlock node={node} ctx={ctx} />;
    case 'scene3d':
      return <Scene3DBlock node={node} ctx={ctx} />;
    case 'custom':
      return <CustomBlock node={node} ctx={ctx} />;
    default: {
      const exhaustive: never = node;
      void exhaustive;
      return null;
    }
  }
}

// ================================
// PUBLIC COMPONENT
// ================================

export interface DocumentRendererProps {
  document: DocumentRoot;
  tokenSet: DesignTokenSet;
}

/**
 * Pure render of a validated DocumentRoot. Callers (the public /sites route,
 * and later the editor's preview pane) are responsible for fetching and
 * validating the document before rendering it.
 */
export function DocumentRenderer({ document, tokenSet }: DocumentRendererProps) {
  const ctx: RenderContext = { document, tokenSet, cssRules: [], emittedRuleKeys: new Set(), cyclicInstances: new Set() };
  // Must run before collectCssRules and before the JSX pass -- both consult
  // ctx.cyclicInstances, and neither can afford to discover a cycle lazily
  // mid-walk (see markCyclicComponentInstances' comment for why).
  markCyclicComponentInstances(document.root, ctx, new Set());
  // JSX element creation is lazy, so collect every node's CSS rules with a
  // plain tree walk *before* building the <style> tag's content; otherwise
  // the <style> tag would be built from an empty ctx.cssRules (see
  // collectCssRules' comment above for why).
  collectCssRules(document.root, ctx);
  const tree = <RenderNode node={document.root} ctx={ctx} />;
  return (
    <>
      <style
        // Base reduced-motion rule always ships; per-node rules are appended above during render.
        dangerouslySetInnerHTML={{
          __html: [
            '@media (prefers-reduced-motion: reduce){.ogmj-fade-in{animation:none !important;opacity:1 !important;}}',
            '.ogmj-fade-in{animation:ogmj-fade-in 600ms ease-out both;}',
            '@keyframes ogmj-fade-in{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}',
            ...ctx.cssRules,
          ].join('\n'),
        }}
      />
      {tree}
    </>
  );
}
