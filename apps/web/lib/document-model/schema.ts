/**
 * Zod validation for the document model. This is the enforcement layer —
 * the TS types in `types.ts` only constrain code written against them, not
 * JSON arriving from the database, an API request, or an AI tool call.
 * Every one of those three entry points must call `validateDocument` (or
 * `validateVersionedDocument`) before the result is trusted.
 *
 * Security note: identifier, URL, and CSS-value fields are validated here
 * with the same allow-list functions `DocumentRenderer.tsx` re-checks at
 * render time (see `security.ts`). Schema validation is the first line of
 * defense — it's what stops an unsafe document from ever being stored —
 * but the renderer does not assume every document it's handed went through
 * this schema first, so both layers enforce the same rules independently.
 */

import { z } from 'zod';
import { CURRENT_SCHEMA_VERSION } from './types';
import {
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENT_DEPTH,
  MAX_NODE_COUNT,
  checkDocumentLimits,
  isSafeCssColor,
  isSafeCssFragment,
  isSafeCssLength,
  isSafeHref,
  isSafeIdentifier,
  isSafeSrc,
} from './security';

// `isSafeIdentifier` (not just the SAFE_IDENTIFIER_PATTERN regex) so the
// reserved-property-name check (__proto__/constructor/prototype) is
// enforced here too -- a regex-only check would still accept them.
const safeId = (what: string) =>
  z.string().refine(isSafeIdentifier, `${what} must be 1-128 characters of letters, digits, "_" or "-", and not a reserved property name`);

const safeHrefSchema = z.string().refine(isSafeHref, 'unsafe or malformed URL (allowed: http(s), mailto, tel, site-relative, #anchor)');
const safeSrcSchema = z.string().refine(isSafeSrc, 'unsafe or malformed asset URL (allowed: http(s), site-relative)');
const cssLengthSchema = z.string().refine(isSafeCssLength, 'unsafe or malformed CSS length/size value');
const cssColorSchema = z.string().refine(isSafeCssColor, 'unsafe or malformed CSS color value');
const cssFragmentSchema = z.string().refine(isSafeCssFragment, 'unsafe CSS fragment (no quotes, braces, semicolons, angle brackets, or comment delimiters)');

const responsive = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.union([
    valueSchema,
    z.object({ base: valueSchema }).catchall(valueSchema),
  ]);

const tokenRefSchema = z.object({ token: z.string().min(1).max(128) });
const styleValue = <T extends z.ZodTypeAny>(valueSchema: T) => z.union([valueSchema, tokenRefSchema]);

const shadowSpecSchema = z.object({
  offsetX: z.number(),
  offsetY: z.number(),
  blur: z.number().nonnegative(),
  spread: z.number().optional(),
  color: styleValue(cssColorSchema),
  inset: z.boolean().optional(),
});

const filterSpecSchema = z
  .object({
    blurPx: z.number().nonnegative().optional(),
    brightness: z.number().optional(),
    contrast: z.number().optional(),
    saturate: z.number().optional(),
    grayscale: z.number().min(0).max(1).optional(),
    hueRotateDeg: z.number().optional(),
  })
  .strict();

const maskSpecSchema = z.object({
  type: z.enum(['linear-gradient', 'radial-gradient', 'image']),
  value: cssFragmentSchema,
});

const shaderEffectRefSchema = z.object({
  shaderId: safeId('shaderId'),
  params: z.record(z.union([z.number(), z.string().max(256), z.boolean()])).optional(),
});

const effectDefinitionSchema = z.object({
  filters: filterSpecSchema.optional(),
  mask: maskSpecSchema.optional(),
  shadows: z.array(shadowSpecSchema).optional(),
  shaderRef: shaderEffectRefSchema.optional(),
});

const animationKeyframeSchema = z.object({
  at: z.number().min(0).max(1),
  opacity: z.number().min(0).max(1).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  z: z.number().optional(),
  scale: z.number().optional(),
  rotateDeg: z.number().optional(),
});

const animationSpecSchema = z.object({
  keyframes: z.array(animationKeyframeSchema).min(1).max(64),
  durationMs: z.number().positive(),
  easing: z.string().max(128).optional(),
  delayMs: z.number().nonnegative().optional(),
  repeat: z.union([z.number().positive(), z.literal('infinite')]).optional(),
  scrubbed: z.boolean().optional(),
});

const motionTriggerSchema = z.object({
  on: z.enum(['load', 'scroll', 'hover', 'click', 'inView']),
  animation: animationSpecSchema,
});

const motionDefinitionSchema = z.object({
  triggers: z.array(motionTriggerSchema).max(16),
  reducedMotionFallback: z.enum(['none', 'fade-only']).optional(),
});

const vector3Schema = z.object({ x: z.number(), y: z.number(), z: z.number() });

const scene3DSpecSchema = z.object({
  camera: z.object({
    position: vector3Schema,
    lookAt: vector3Schema.optional(),
    fovDeg: z.number().positive().optional(),
  }),
  lights: z
    .array(
      z.object({
        type: z.enum(['ambient', 'directional', 'point']),
        color: cssColorSchema.optional(),
        intensity: z.number().optional(),
        position: vector3Schema.optional(),
      })
    )
    .max(32),
  objects: z
    .array(
      z.object({
        id: safeId('object id'),
        assetRef: safeId('assetRef'),
        position: vector3Schema.optional(),
        rotationDeg: vector3Schema.optional(),
        scale: vector3Schema.optional(),
      })
    )
    .max(256),
  interactions: z
    .array(
      z.object({
        type: z.enum(['orbit', 'drag-rotate', 'scroll-camera-path', 'hover-highlight']),
        targetObjectId: safeId('targetObjectId').optional(),
      })
    )
    .optional(),
  posterAssetRef: safeId('posterAssetRef').optional(),
});

const baseNodeStyleSchema = z.object({
  width: responsive(cssLengthSchema).optional(),
  height: responsive(cssLengthSchema).optional(),
  padding: responsive(cssLengthSchema).optional(),
  margin: responsive(cssLengthSchema).optional(),
  background: styleValue(cssColorSchema).optional(),
  color: styleValue(cssColorSchema).optional(),
  display: responsive(z.enum(['block', 'flex', 'grid', 'none'])).optional(),
  flexDirection: responsive(z.enum(['row', 'column'])).optional(),
  gap: responsive(cssLengthSchema).optional(),
  align: responsive(z.enum(['start', 'center', 'end', 'stretch'])).optional(),
  justify: responsive(z.enum(['start', 'center', 'end', 'between'])).optional(),
  textAlign: responsive(z.enum(['left', 'center', 'right'])).optional(),
  borderRadius: styleValue(cssLengthSchema).optional(),
  effects: effectDefinitionSchema.optional(),
});

const baseNodeFieldsSchema = {
  id: safeId('node id'),
  name: z.string().max(256).optional(),
  style: baseNodeStyleSchema.optional(),
  motion: motionDefinitionSchema.optional(),
  a11yLabel: z.string().max(256).optional(),
  hidden: responsive(z.boolean()).optional(),
};

// `documentNodeSchema` is recursive (containers hold children), so it's
// declared with z.lazy and assigned via a mutable ZodType reference.
// Zod's recursive parse has no depth limit of its own -- `checkDocumentLimits`
// in security.ts MUST run (via validateDocument/validateVersionedDocument
// below) on the raw input before it ever reaches this schema, or a
// pathologically deep document will stack-overflow the parser itself.
export const documentNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({ ...baseNodeFieldsSchema, kind: z.literal('root'), children: z.array(documentNodeSchema).max(MAX_NODE_COUNT) }),
    z.object({ ...baseNodeFieldsSchema, kind: z.literal('section'), children: z.array(documentNodeSchema).max(MAX_NODE_COUNT) }),
    z.object({ ...baseNodeFieldsSchema, kind: z.literal('container'), children: z.array(documentNodeSchema).max(MAX_NODE_COUNT) }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('heading'),
      text: z.string().max(10_000),
      level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
    }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('text'),
      text: z.string().max(100_000),
      marks: z
        .array(
          z.object({
            start: z.number().int().nonnegative(),
            end: z.number().int().nonnegative(),
            type: z.enum(['bold', 'italic', 'link']),
            href: safeHrefSchema.optional(),
          })
        )
        .max(1000)
        .optional(),
    }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('image'),
      assetRef: safeId('assetRef'),
      caption: z.string().max(1000).optional(),
      objectFit: z.enum(['cover', 'contain']).optional(),
    }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('video'),
      assetRef: safeId('assetRef'),
      autoplay: z.boolean().optional(),
      loop: z.boolean().optional(),
      muted: z.boolean().optional(),
      posterAssetRef: safeId('posterAssetRef').optional(),
    }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('button'),
      label: z.string().max(1000),
      href: safeHrefSchema,
      variant: z.enum(['primary', 'secondary', 'ghost']).optional(),
    }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('slot'),
      slotName: safeId('slotName'),
      defaultContent: z.array(documentNodeSchema).max(MAX_NODE_COUNT).optional(),
    }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('componentInstance'),
      componentId: safeId('componentId'),
      variantId: safeId('variantId').optional(),
      propOverrides: z.record(z.unknown()).optional(),
      slotContent: z.record(z.array(documentNodeSchema).max(MAX_NODE_COUNT)).optional(),
    }),
    z.object({ ...baseNodeFieldsSchema, kind: z.literal('scene3d'), scene: scene3DSpecSchema }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('custom'),
      customType: safeId('customType'),
      props: z.record(z.unknown()),
      children: z.array(documentNodeSchema).max(MAX_NODE_COUNT).optional(),
    }),
  ])
);

const breakpointDefinitionSchema = z.object({
  key: safeId('breakpoint key'),
  minWidthPx: z.number().nonnegative().max(100_000),
  label: z.string().max(128).optional(),
});

const designTokenSetSchema = z.object({
  id: safeId('token set id'),
  name: z.string().max(256),
  colors: z.record(cssColorSchema),
  typography: z.object({
    fontFamilies: z.record(cssFragmentSchema),
    fontSizes: z.record(cssLengthSchema),
    fontWeights: z.record(z.number()),
    lineHeights: z.record(z.union([z.string().max(32), z.number()])),
    letterSpacing: z.record(cssLengthSchema).optional(),
  }),
  spacing: z.record(cssLengthSchema),
  radii: z.record(cssLengthSchema),
  shadows: z.record(cssFragmentSchema),
  gradients: z
    .record(
      z.object({
        type: z.enum(['linear', 'radial']),
        stops: z.array(z.object({ color: cssColorSchema, at: z.number().min(0).max(1) })).max(32),
        angleDeg: z.number().optional(),
      })
    )
    .optional(),
});

const assetRefSchema = z.object({
  id: safeId('asset id'),
  kind: z.enum(['image', 'video', 'audio', 'font', 'model3d']),
  url: safeSrcSchema,
  mimeType: z.string().max(128).optional(),
  widthPx: z.number().positive().optional(),
  heightPx: z.number().positive().optional(),
  durationMs: z.number().positive().optional(),
  altText: z.string().max(1000).optional(),
  generatedBy: z.enum(['upload', 'ai-generated']).optional(),
});

const componentDefinitionSchema = z.object({
  id: safeId('component id'),
  name: z.string().max(256),
  propSchema: z
    .array(
      z.object({
        name: safeId('prop name'),
        type: z.enum(['string', 'number', 'boolean', 'color', 'assetRef']),
        default: z.unknown().optional(),
      })
    )
    .max(128),
  slots: z.array(safeId('slot name')).max(64),
  variants: z
    .array(z.object({ id: safeId('variant id'), name: z.string().max(256), propOverrides: z.record(z.unknown()).optional() }))
    .max(64),
  template: documentNodeSchema,
});

export const documentRootSchema = z.object({
  root: z.object({ ...baseNodeFieldsSchema, kind: z.literal('root'), children: z.array(documentNodeSchema).max(MAX_NODE_COUNT) }),
  tokenSetId: safeId('token set id'),
  breakpoints: z.array(breakpointDefinitionSchema).min(1).max(16),
  components: z.record(componentDefinitionSchema),
  assets: z.record(assetRefSchema),
});

export const versionedDocumentSchema = z.object({
  schemaVersion: z.number().int().positive(),
  document: documentRootSchema,
});

export const designTokenSetSchemaExport = designTokenSetSchema;

export type ValidationResult<T> = { success: true; data: T } | { success: false; errors: string[] };

function toResult<T>(parsed: z.SafeParseReturnType<unknown, T>): ValidationResult<T> {
  if (parsed.success) return { success: true, data: parsed.data };
  return {
    success: false,
    errors: parsed.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
  };
}

/**
 * Runs the non-recursive size/depth/node-count pre-check (security.ts)
 * before ever handing `input` to Zod's recursive schema. This is the fix
 * for documents that would otherwise crash validation with an uncaught
 * `RangeError: Maximum call stack size exceeded` instead of failing with a
 * normal, catchable validation error.
 */
function checkLimitsOrError(input: unknown): ValidationResult<never> | null {
  const violation = checkDocumentLimits(input);
  if (!violation) return null;
  return { success: false, errors: [`${violation.kind}: ${violation.message}`] };
}

export function validateDocument(input: unknown): ValidationResult<z.infer<typeof documentRootSchema>> {
  const limitError = checkLimitsOrError(input);
  if (limitError) return limitError;
  return toResult(documentRootSchema.safeParse(input));
}

export function validateVersionedDocument(input: unknown): ValidationResult<z.infer<typeof versionedDocumentSchema>> {
  const limitError = checkLimitsOrError((input as { document?: unknown } | null)?.document ?? input);
  if (limitError) return limitError;
  const result = toResult(versionedDocumentSchema.safeParse(input));
  if (!result.success) return result;
  if (result.data.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return { success: false, errors: [`schemaVersion ${result.data.schemaVersion} is newer than this build supports (${CURRENT_SCHEMA_VERSION})`] };
  }
  return result;
}

export function validateDesignTokenSet(input: unknown): ValidationResult<z.infer<typeof designTokenSetSchema>> {
  return toResult(designTokenSetSchema.safeParse(input));
}

export { MAX_DOCUMENT_BYTES, MAX_DOCUMENT_DEPTH, MAX_NODE_COUNT };
