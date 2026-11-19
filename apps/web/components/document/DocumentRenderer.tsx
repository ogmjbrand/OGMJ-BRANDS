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

interface RenderContext {
  document: DocumentRoot;
  tokenSet: DesignTokenSet;
  /** Collects generated CSS rules so they can be emitted once, in one <style> tag. */
  cssRules: string[];
  /** Dedupes rules between the CSS-collection pre-pass and the actual JSX render pass. */
  emittedRuleKeys: Set<string>;
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
 */
function resolveResponsiveCssVar(
  nodeId: string,
  cssProp: CssPropertyName,
  rawValue: unknown,
  ctx: RenderContext,
  valueMap?: Record<string, string>
): string | undefined {
  if (rawValue === undefined) return undefined;
  const varName = `--n-${nodeId}-${cssProp}`;
  const dedupeKey = `${nodeId}:${cssProp}`;
  if (ctx.emittedRuleKeys.has(dedupeKey)) return `var(${varName})`;
  ctx.emittedRuleKeys.add(dedupeKey);
  const mapValue = (v: unknown) => {
    const str = resolveStyleValue(v as never, ctx.tokenSet) as unknown as string;
    return valueMap ? valueMap[String(str)] ?? String(str) : String(str);
  };

  if (isResponsiveMap(rawValue)) {
    const entries = rawValue as Record<string, unknown>;
    const baseVal = mapValue(entries.base);
    ctx.cssRules.push(`[data-node="${nodeId}"]{${varName}:${baseVal};}`);
    for (const bp of ctx.document.breakpoints) {
      if (bp.key === 'base' || entries[bp.key] === undefined) continue;
      ctx.cssRules.push(
        `@media (min-width:${bp.minWidthPx}px){[data-node="${nodeId}"]{${varName}:${mapValue(entries[bp.key])};}}`
      );
    }
  } else {
    ctx.cssRules.push(`[data-node="${nodeId}"]{${varName}:${mapValue(rawValue)};}`);
  }
  return `var(${varName})`;
}

function nodeInlineStyle(node: DocumentNode, ctx: RenderContext): CSSProperties {
  const style = (node as { style?: Record<string, unknown> }).style;
  if (!style) return {};

  const out: Record<string, string> = {};
  const set = (cssProp: CssPropertyName, value: unknown, valueMap?: Record<string, string>) => {
    const resolved = resolveResponsiveCssVar(node.id, cssProp, value, ctx, valueMap);
    if (resolved) out[cssProp] = resolved;
  };

  set('width', style.width);
  set('height', style.height);
  set('padding', style.padding);
  set('margin', style.margin);
  set('background', style.background);
  set('color', style.color);
  set('display', style.display, DISPLAY_MAP);
  set('flex-direction', style.flexDirection);
  set('gap', style.gap);
  set('align-items', style.align, ALIGN_MAP);
  set('justify-content', style.justify, JUSTIFY_MAP);
  set('text-align', style.textAlign);
  set('border-radius', style.borderRadius);

  const effects = style.effects as { filters?: Record<string, number>; shadows?: unknown[] } | undefined;
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

  // CSS-expressible effects render today; shaderRef is recorded but not executed (see ShaderPlaceholder note below).

  return out as React.CSSProperties;
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
  return ctx.document.assets[assetRef];
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
    const definition = ctx.document.components[node.componentId];
    if (definition) collectCssRules(substituteSlots(definition.template, node.slotContent), ctx);
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
    <Tag data-node={node.id} className={loadFadeClass} style={nodeInlineStyle(node, ctx)} {...attrs}>
      <RenderChildren children={node.children} ctx={ctx} />
    </Tag>
  );
}

function HeadingBlock({ node, ctx }: { node: HeadingNode; ctx: RenderContext }) {
  const Tag = (`h${node.level}` as unknown) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return <Tag data-node={node.id} style={nodeInlineStyle(node, ctx)}>{node.text}</Tag>;
}

function TextBlock({ node, ctx }: { node: TextNode; ctx: RenderContext }) {
  // Always plain text — marks are a constrained list, never raw HTML.
  return (
    <p data-node={node.id} style={nodeInlineStyle(node, ctx)}>
      {node.text}
    </p>
  );
}

function ImageBlock({ node, ctx }: { node: ImageNode; ctx: RenderContext }) {
  const asset = resolveAsset(node.assetRef, ctx);
  if (!asset) return null;
  return (
    <figure data-node={node.id} style={nodeInlineStyle(node, ctx)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- asset hosts are arbitrary */}
      <img src={asset.url} alt={asset.altText ?? ''} loading="lazy" style={{ objectFit: node.objectFit ?? 'cover' }} />
      {node.caption ? <figcaption>{node.caption}</figcaption> : null}
    </figure>
  );
}

function VideoBlock({ node, ctx }: { node: VideoNode; ctx: RenderContext }) {
  const asset = resolveAsset(node.assetRef, ctx);
  if (!asset) return null;
  const poster = node.posterAssetRef ? resolveAsset(node.posterAssetRef, ctx) : undefined;
  return (
    <video
      data-node={node.id}
      style={nodeInlineStyle(node, ctx)}
      src={asset.url}
      poster={poster?.url}
      autoPlay={node.autoplay}
      loop={node.loop}
      muted={node.muted}
      controls={!node.autoplay}
    />
  );
}

function ButtonBlock({ node, ctx }: { node: ButtonNode; ctx: RenderContext }) {
  const external = /^https?:/.test(node.href);
  return (
    <a
      data-node={node.id}
      data-variant={node.variant ?? 'primary'}
      style={nodeInlineStyle(node, ctx)}
      href={node.href}
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
  const definition = ctx.document.components[node.componentId];
  if (!definition) return <MissingComponentPlaceholder node={node} />;
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

/** No 3D runtime ships in Phase 1 — render the poster image (or a labeled placeholder) instead of WebGL. */
function Scene3DBlock({ node, ctx }: { node: Scene3DNode; ctx: RenderContext }) {
  const poster = node.scene.posterAssetRef ? resolveAsset(node.scene.posterAssetRef, ctx) : undefined;
  return (
    <div data-node={node.id} data-ogmj-scene3d-placeholder="true" style={nodeInlineStyle(node, ctx)}>
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster.url} alt={poster.altText ?? '3D scene preview'} />
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
  const ctx: RenderContext = { document, tokenSet, cssRules: [], emittedRuleKeys: new Set() };
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
