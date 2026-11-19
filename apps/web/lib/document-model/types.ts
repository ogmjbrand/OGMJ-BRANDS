/**
 * OGMJ BRANDS — Shared Visual Document Model (Phase 1)
 *
 * This is the one document representation the (future) visual editor, the
 * (future) AI Creative Director, and the public renderer all read and write.
 * It lives inside the existing `web_pages.content` jsonb column — there is
 * no new table and no second page/site schema.
 *
 * Every node kind added here must stay DATA, never CODE: a node can carry a
 * shader *reference* (an id + params), never a shader *program*; a component
 * can carry a *template* of nodes, never a function body. That boundary is
 * what keeps AI- and user-authored documents safe to render without a
 * sandboxed code-execution runtime.
 */

// ================================
// PRIMITIVES
// ================================

export type NodeId = string;
export type ComponentId = string;
export type VariantId = string;
export type AssetId = string;
export type TokenSetId = string;

/**
 * A value that may vary per breakpoint. `base` (or a bare value) is the
 * default; other keys override it at that breakpoint and above, following
 * the same "min-width cascades up" model as Tailwind/CSS media queries.
 * Keeping this generic (rather than one Responsive type per prop) is what
 * lets *any* future prop become responsive without a schema change.
 */
export type Responsive<T> = T | ({ base: T } & Partial<Record<BreakpointKey, T>>);

export const DEFAULT_BREAKPOINTS: BreakpointDefinition[] = [
  { key: 'base', minWidthPx: 0, label: 'Mobile' },
  { key: 'sm', minWidthPx: 640, label: 'Small tablet' },
  { key: 'md', minWidthPx: 768, label: 'Tablet' },
  { key: 'lg', minWidthPx: 1024, label: 'Desktop' },
  { key: 'xl', minWidthPx: 1280, label: 'Large desktop' },
];

export type BreakpointKey = 'base' | 'sm' | 'md' | 'lg' | 'xl' | string;

export interface BreakpointDefinition {
  key: BreakpointKey;
  minWidthPx: number;
  label?: string;
}

// ================================
// DESIGN TOKENS
// ================================

/**
 * A named, versioned set of design primitives. Nodes reference tokens by
 * key (e.g. `{ token: 'color.brand.primary' }`) rather than embedding raw
 * values, so a brand-wide palette/typography change is one token-set edit,
 * not a find-and-replace across every page.
 */
export interface DesignTokenSet {
  id: TokenSetId;
  name: string;
  colors: Record<string, string>;
  typography: {
    fontFamilies: Record<string, string>;
    fontSizes: Record<string, string>;
    fontWeights: Record<string, number>;
    lineHeights: Record<string, string | number>;
    letterSpacing?: Record<string, string>;
  };
  spacing: Record<string, string>;
  radii: Record<string, string>;
  shadows: Record<string, string>;
  gradients?: Record<string, { type: 'linear' | 'radial'; stops: Array<{ color: string; at: number }>; angleDeg?: number }>;
}

/** A reference into a DesignTokenSet, resolved at render time. */
export interface TokenRef {
  token: string; // dot path, e.g. "color.brand.primary" or "spacing.lg"
}

export type StyleValue<T> = T | TokenRef;

// ================================
// VISUAL EFFECTS
// ================================

export interface ShadowSpec {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread?: number;
  color: StyleValue<string>;
  inset?: boolean;
}

export interface FilterSpec {
  blurPx?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;
  grayscale?: number;
  hueRotateDeg?: number;
}

export interface MaskSpec {
  type: 'linear-gradient' | 'radial-gradient' | 'image';
  value: string; // CSS mask-image value, or an AssetId when type === 'image'
}

/**
 * A reference to a shader/GPU effect by id + params — never a program body.
 * Phase 1 defines the shape; no shader runtime ships until it's needed.
 */
export interface ShaderEffectRef {
  shaderId: string;
  params?: Record<string, number | string | boolean>;
}

export interface EffectDefinition {
  filters?: FilterSpec;
  mask?: MaskSpec;
  shadows?: ShadowSpec[];
  shaderRef?: ShaderEffectRef;
}

// ================================
// MOTION & INTERACTION
// ================================

export type MotionTriggerKind = 'load' | 'scroll' | 'hover' | 'click' | 'inView';

export interface AnimationKeyframe {
  at: number; // 0..1
  opacity?: number;
  x?: number;
  y?: number;
  z?: number;
  scale?: number;
  rotateDeg?: number;
}

export interface AnimationSpec {
  keyframes: AnimationKeyframe[];
  durationMs: number;
  easing?: string; // e.g. "ease-out", "cubic-bezier(...)"
  delayMs?: number;
  repeat?: number | 'infinite';
  /** Scroll-linked (scrubbed) vs. time-based playback. Only meaningful for 'scroll'. */
  scrubbed?: boolean;
}

export interface MotionTrigger {
  on: MotionTriggerKind;
  animation: AnimationSpec;
}

export interface MotionDefinition {
  triggers: MotionTrigger[];
  /** Users who request reduced motion get this instead (or nothing). */
  reducedMotionFallback?: 'none' | 'fade-only';
}

// ================================
// 3D SCENE (schema only — no runtime in Phase 1)
// ================================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface CameraSpec {
  position: Vector3;
  lookAt?: Vector3;
  fovDeg?: number;
}

export interface LightSpec {
  type: 'ambient' | 'directional' | 'point';
  color?: string;
  intensity?: number;
  position?: Vector3;
}

export interface Object3DSpec {
  id: NodeId;
  assetRef: AssetId; // resolves to an AssetRef of kind 'model3d'
  position?: Vector3;
  rotationDeg?: Vector3;
  scale?: Vector3;
}

export interface Interaction3DSpec {
  type: 'orbit' | 'drag-rotate' | 'scroll-camera-path' | 'hover-highlight';
  targetObjectId?: NodeId;
}

export interface Scene3DSpec {
  camera: CameraSpec;
  lights: LightSpec[];
  objects: Object3DSpec[];
  interactions?: Interaction3DSpec[];
  /** Shown by every renderer that has no 3D runtime yet (all of Phase 1). */
  posterAssetRef?: AssetId;
}

// ================================
// ASSETS
// ================================

export type AssetKind = 'image' | 'video' | 'audio' | 'font' | 'model3d';

export interface AssetRef {
  id: AssetId;
  kind: AssetKind;
  url: string;
  mimeType?: string;
  widthPx?: number;
  heightPx?: number;
  durationMs?: number;
  altText?: string;
  /** Provenance matters once the AI Creative Director can generate assets. */
  generatedBy?: 'upload' | 'ai-generated';
}

// ================================
// DOCUMENT NODES
// ================================

export type NodeKind =
  | 'root'
  | 'section'
  | 'container'
  | 'heading'
  | 'text'
  | 'image'
  | 'video'
  | 'button'
  | 'slot'
  | 'componentInstance'
  | 'scene3d'
  | 'custom';

export interface BaseNodeStyle {
  width?: Responsive<string>;
  height?: Responsive<string>;
  padding?: Responsive<string>;
  margin?: Responsive<string>;
  background?: StyleValue<string>;
  color?: StyleValue<string>;
  display?: Responsive<'block' | 'flex' | 'grid' | 'none'>;
  flexDirection?: Responsive<'row' | 'column'>;
  gap?: Responsive<string>;
  align?: Responsive<'start' | 'center' | 'end' | 'stretch'>;
  justify?: Responsive<'start' | 'center' | 'end' | 'between'>;
  textAlign?: Responsive<'left' | 'center' | 'right'>;
  borderRadius?: StyleValue<string>;
  effects?: EffectDefinition;
}

export interface BaseNode {
  id: NodeId;
  kind: NodeKind;
  name?: string; // editor-facing label, independent of content
  style?: BaseNodeStyle;
  motion?: MotionDefinition;
  /** Visible to screen readers / omitted from the a11y tree. */
  a11yLabel?: string;
  hidden?: Responsive<boolean>;
}

export interface RootNode extends BaseNode {
  kind: 'root';
  children: DocumentNode[];
}

export interface SectionNode extends BaseNode {
  kind: 'section';
  children: DocumentNode[];
}

export interface ContainerNode extends BaseNode {
  kind: 'container';
  children: DocumentNode[];
}

export interface HeadingNode extends BaseNode {
  kind: 'heading';
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface TextNode extends BaseNode {
  kind: 'text';
  text: string;
  /** Rich text is a constrained mark list, never raw HTML. */
  marks?: Array<{ start: number; end: number; type: 'bold' | 'italic' | 'link'; href?: string }>;
}

export interface ImageNode extends BaseNode {
  kind: 'image';
  assetRef: AssetId;
  caption?: string;
  objectFit?: 'cover' | 'contain';
}

export interface VideoNode extends BaseNode {
  kind: 'video';
  assetRef: AssetId;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  posterAssetRef?: AssetId;
}

export interface ButtonNode extends BaseNode {
  kind: 'button';
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

/** Placeholder inside a ComponentDefinition's template; filled by instances. */
export interface SlotNode extends BaseNode {
  kind: 'slot';
  slotName: string;
  /** Rendered when an instance doesn't fill this slot. */
  defaultContent?: DocumentNode[];
}

export interface ComponentInstanceNode extends BaseNode {
  kind: 'componentInstance';
  componentId: ComponentId;
  variantId?: VariantId;
  /** Per-instance prop overrides, keyed by the component's declared propSchema. */
  propOverrides?: Record<string, unknown>;
  /** Content supplied for each named slot in the component's template. */
  slotContent?: Record<string, DocumentNode[]>;
}

export interface Scene3DNode extends BaseNode {
  kind: 'scene3d';
  scene: Scene3DSpec;
}

/**
 * The only intentional escape hatch. `customType` is a free-form string the
 * renderer's component registry looks up; if no renderer is registered for
 * it, the document stays valid and the node just renders nothing visible
 * (see renderer.ts `UnknownNodeFallback`). This is how new node kinds roll
 * out without a schema migration — but `props` is still plain JSON data,
 * never a function or code string.
 */
export interface CustomNode extends BaseNode {
  kind: 'custom';
  customType: string;
  props: Record<string, unknown>;
  children?: DocumentNode[];
}

export type DocumentNode =
  | RootNode
  | SectionNode
  | ContainerNode
  | HeadingNode
  | TextNode
  | ImageNode
  | VideoNode
  | ButtonNode
  | SlotNode
  | ComponentInstanceNode
  | Scene3DNode
  | CustomNode;

// ================================
// COMPONENT SYSTEM
// ================================

export interface ComponentPropDef {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'assetRef';
  default?: unknown;
}

export interface ComponentVariant {
  id: VariantId;
  name: string;
  /** Default propOverrides applied when an instance selects this variant. */
  propOverrides?: Record<string, unknown>;
}

export interface ComponentDefinition {
  id: ComponentId;
  name: string;
  propSchema: ComponentPropDef[];
  /** Names of `slot` nodes that appear somewhere in `template`. */
  slots: string[];
  variants: ComponentVariant[];
  template: DocumentNode; // typically a ContainerNode or SectionNode containing SlotNodes
}

// ================================
// DOCUMENT ROOT & VERSIONING
// ================================

export const CURRENT_SCHEMA_VERSION = 1 as const;

export interface DocumentRoot {
  root: RootNode;
  tokenSetId: TokenSetId;
  breakpoints: BreakpointDefinition[];
  components: Record<ComponentId, ComponentDefinition>;
  assets: Record<AssetId, AssetRef>;
}

export interface VersionedDocument {
  schemaVersion: number;
  document: DocumentRoot;
}

// ================================
// AI / EDITOR OPERATIONS (reversible editing foundation)
// ================================

/**
 * The ONLY sanctioned way to mutate a document — by the editor, or by the
 * AI Creative Director. Each operation is small, targeted, and invertible,
 * which is what lets "change this element's color" leave 10,000 other
 * nodes untouched, and lets every AI edit be undone like a human edit.
 */
export type DocumentOperation =
  | { op: 'insertNode'; parentId: NodeId; index: number; node: DocumentNode }
  | { op: 'removeNode'; nodeId: NodeId }
  | { op: 'moveNode'; nodeId: NodeId; newParentId: NodeId; newIndex: number }
  | { op: 'updateNodeProps'; nodeId: NodeId; path: string[]; value: unknown }
  // `content`/`variantId` as `undefined` (key present, value absent) means
  // "this slot/variant had no prior value" -- it's what `invert()` produces
  // so undo can remove the key entirely rather than leaving behind an
  // empty-but-present `slotContent: {}` or `variantId: undefined` key.
  | { op: 'setSlotContent'; nodeId: NodeId; slotName: string; content: DocumentNode[] | undefined }
  | { op: 'applyVariant'; nodeId: NodeId; variantId: VariantId | undefined };

export interface OperationHistoryEntry {
  operation: DocumentOperation;
  inverse: DocumentOperation;
  at: string; // ISO timestamp
  actor: 'user' | 'ai';
}

export interface OperationHistory {
  past: OperationHistoryEntry[];
  future: OperationHistoryEntry[];
}
