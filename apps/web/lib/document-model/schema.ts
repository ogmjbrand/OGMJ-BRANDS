/**
 * Zod validation for the document model. This is the enforcement layer —
 * the TS types in `types.ts` only constrain code written against them, not
 * JSON arriving from the database, an API request, or an AI tool call.
 * Every one of those three entry points must call `validateDocument` (or
 * `validateVersionedDocument`) before the result is trusted.
 */

import { z } from 'zod';
import { CURRENT_SCHEMA_VERSION } from './types';

const responsive = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.union([
    valueSchema,
    z.object({ base: valueSchema }).catchall(valueSchema),
  ]);

const tokenRefSchema = z.object({ token: z.string().min(1) });
const styleValue = <T extends z.ZodTypeAny>(valueSchema: T) => z.union([valueSchema, tokenRefSchema]);

const shadowSpecSchema = z.object({
  offsetX: z.number(),
  offsetY: z.number(),
  blur: z.number().nonnegative(),
  spread: z.number().optional(),
  color: styleValue(z.string()),
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
  value: z.string(),
});

const shaderEffectRefSchema = z.object({
  shaderId: z.string().min(1),
  params: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
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
  keyframes: z.array(animationKeyframeSchema).min(1),
  durationMs: z.number().positive(),
  easing: z.string().optional(),
  delayMs: z.number().nonnegative().optional(),
  repeat: z.union([z.number().positive(), z.literal('infinite')]).optional(),
  scrubbed: z.boolean().optional(),
});

const motionTriggerSchema = z.object({
  on: z.enum(['load', 'scroll', 'hover', 'click', 'inView']),
  animation: animationSpecSchema,
});

const motionDefinitionSchema = z.object({
  triggers: z.array(motionTriggerSchema),
  reducedMotionFallback: z.enum(['none', 'fade-only']).optional(),
});

const vector3Schema = z.object({ x: z.number(), y: z.number(), z: z.number() });

const scene3DSpecSchema = z.object({
  camera: z.object({
    position: vector3Schema,
    lookAt: vector3Schema.optional(),
    fovDeg: z.number().positive().optional(),
  }),
  lights: z.array(
    z.object({
      type: z.enum(['ambient', 'directional', 'point']),
      color: z.string().optional(),
      intensity: z.number().optional(),
      position: vector3Schema.optional(),
    })
  ),
  objects: z.array(
    z.object({
      id: z.string(),
      assetRef: z.string(),
      position: vector3Schema.optional(),
      rotationDeg: vector3Schema.optional(),
      scale: vector3Schema.optional(),
    })
  ),
  interactions: z
    .array(
      z.object({
        type: z.enum(['orbit', 'drag-rotate', 'scroll-camera-path', 'hover-highlight']),
        targetObjectId: z.string().optional(),
      })
    )
    .optional(),
  posterAssetRef: z.string().optional(),
});

const baseNodeStyleSchema = z.object({
  width: responsive(z.string()).optional(),
  height: responsive(z.string()).optional(),
  padding: responsive(z.string()).optional(),
  margin: responsive(z.string()).optional(),
  background: styleValue(z.string()).optional(),
  color: styleValue(z.string()).optional(),
  display: responsive(z.enum(['block', 'flex', 'grid', 'none'])).optional(),
  flexDirection: responsive(z.enum(['row', 'column'])).optional(),
  gap: responsive(z.string()).optional(),
  align: responsive(z.enum(['start', 'center', 'end', 'stretch'])).optional(),
  justify: responsive(z.enum(['start', 'center', 'end', 'between'])).optional(),
  textAlign: responsive(z.enum(['left', 'center', 'right'])).optional(),
  borderRadius: styleValue(z.string()).optional(),
  effects: effectDefinitionSchema.optional(),
});

const baseNodeFieldsSchema = {
  id: z.string().min(1),
  name: z.string().optional(),
  style: baseNodeStyleSchema.optional(),
  motion: motionDefinitionSchema.optional(),
  a11yLabel: z.string().optional(),
  hidden: responsive(z.boolean()).optional(),
};

// `documentNodeSchema` is recursive (containers hold children), so it's
// declared with z.lazy and assigned via a mutable ZodType reference.
export const documentNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({ ...baseNodeFieldsSchema, kind: z.literal('root'), children: z.array(documentNodeSchema) }),
    z.object({ ...baseNodeFieldsSchema, kind: z.literal('section'), children: z.array(documentNodeSchema) }),
    z.object({ ...baseNodeFieldsSchema, kind: z.literal('container'), children: z.array(documentNodeSchema) }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('heading'),
      text: z.string(),
      level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
    }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('text'),
      text: z.string(),
      marks: z
        .array(
          z.object({
            start: z.number().int().nonnegative(),
            end: z.number().int().nonnegative(),
            type: z.enum(['bold', 'italic', 'link']),
            href: z.string().optional(),
          })
        )
        .optional(),
    }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('image'),
      assetRef: z.string(),
      caption: z.string().optional(),
      objectFit: z.enum(['cover', 'contain']).optional(),
    }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('video'),
      assetRef: z.string(),
      autoplay: z.boolean().optional(),
      loop: z.boolean().optional(),
      muted: z.boolean().optional(),
      posterAssetRef: z.string().optional(),
    }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('button'),
      label: z.string(),
      href: z.string(),
      variant: z.enum(['primary', 'secondary', 'ghost']).optional(),
    }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('slot'),
      slotName: z.string().min(1),
      defaultContent: z.array(documentNodeSchema).optional(),
    }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('componentInstance'),
      componentId: z.string(),
      variantId: z.string().optional(),
      propOverrides: z.record(z.unknown()).optional(),
      slotContent: z.record(z.array(documentNodeSchema)).optional(),
    }),
    z.object({ ...baseNodeFieldsSchema, kind: z.literal('scene3d'), scene: scene3DSpecSchema }),
    z.object({
      ...baseNodeFieldsSchema,
      kind: z.literal('custom'),
      customType: z.string().min(1),
      props: z.record(z.unknown()),
      children: z.array(documentNodeSchema).optional(),
    }),
  ])
);

const breakpointDefinitionSchema = z.object({
  key: z.string(),
  minWidthPx: z.number().nonnegative(),
  label: z.string().optional(),
});

const designTokenSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  colors: z.record(z.string()),
  typography: z.object({
    fontFamilies: z.record(z.string()),
    fontSizes: z.record(z.string()),
    fontWeights: z.record(z.number()),
    lineHeights: z.record(z.union([z.string(), z.number()])),
    letterSpacing: z.record(z.string()).optional(),
  }),
  spacing: z.record(z.string()),
  radii: z.record(z.string()),
  shadows: z.record(z.string()),
  gradients: z
    .record(
      z.object({
        type: z.enum(['linear', 'radial']),
        stops: z.array(z.object({ color: z.string(), at: z.number().min(0).max(1) })),
        angleDeg: z.number().optional(),
      })
    )
    .optional(),
});

const assetRefSchema = z.object({
  id: z.string(),
  kind: z.enum(['image', 'video', 'audio', 'font', 'model3d']),
  url: z.string(),
  mimeType: z.string().optional(),
  widthPx: z.number().positive().optional(),
  heightPx: z.number().positive().optional(),
  durationMs: z.number().positive().optional(),
  altText: z.string().optional(),
  generatedBy: z.enum(['upload', 'ai-generated']).optional(),
});

const componentDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  propSchema: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['string', 'number', 'boolean', 'color', 'assetRef']),
      default: z.unknown().optional(),
    })
  ),
  slots: z.array(z.string()),
  variants: z.array(
    z.object({ id: z.string(), name: z.string(), propOverrides: z.record(z.unknown()).optional() })
  ),
  template: documentNodeSchema,
});

export const documentRootSchema = z.object({
  root: z.object({ ...baseNodeFieldsSchema, kind: z.literal('root'), children: z.array(documentNodeSchema) }),
  tokenSetId: z.string(),
  breakpoints: z.array(breakpointDefinitionSchema).min(1),
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

export function validateDocument(input: unknown): ValidationResult<z.infer<typeof documentRootSchema>> {
  return toResult(documentRootSchema.safeParse(input));
}

export function validateVersionedDocument(input: unknown): ValidationResult<z.infer<typeof versionedDocumentSchema>> {
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
