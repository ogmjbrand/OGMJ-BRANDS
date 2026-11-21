/**
 * Zod validation for `DocumentOperation` -- the one thing `schema.ts`
 * never covered (see its own module header: it validates `DocumentRoot`/
 * `VersionedDocument` shapes, never an individual operation). That gap was
 * harmless while every operation came from this project's own typed UI
 * code; it stops being harmless the moment an operation can be PROPOSED by
 * an LLM (see lib/ai/websiteAssist.ts) -- untrusted input by this
 * project's own doctrine, exactly like anything schema.ts already guards.
 *
 * Reuses schema.ts's existing building blocks (`documentNodeSchema`,
 * `safeId`, `assetRefSchema`, `componentDefinitionSchema`) rather than
 * re-describing the same shapes a second time. Any embedded node/template
 * goes through `checkOperationNodeLimits` BEFORE Zod, for the same reason
 * `validateDocument` runs `checkDocumentLimits` first: `documentNodeSchema`
 * is a recursive Zod schema with no depth limit of its own.
 */
import { z } from 'zod';
import { assetRefSchema, componentDefinitionSchema, documentNodeSchema, safeId } from './schema';
import { MAX_NODE_COUNT, checkOperationNodeLimits } from './security';
import type { DocumentOperation } from './types';

const nodeIdSchema = safeId('node id');

/** `updateNodeProps`' path segments are plain-object keys written via `setNodeProp` (tree.ts) -- same allowlist, same reasoning as every other identifier here. */
const pathSchema = z.array(safeId('path segment')).min(1).max(16);

export const documentOperationSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('insertNode'), parentId: nodeIdSchema, index: z.number().int().nonnegative(), node: documentNodeSchema }),
  z.object({ op: z.literal('removeNode'), nodeId: nodeIdSchema }),
  z.object({ op: z.literal('moveNode'), nodeId: nodeIdSchema, newParentId: nodeIdSchema, newIndex: z.number().int().nonnegative() }),
  z.object({ op: z.literal('updateNodeProps'), nodeId: nodeIdSchema, path: pathSchema, value: z.unknown() }),
  z.object({ op: z.literal('setSlotContent'), nodeId: nodeIdSchema, slotName: safeId('slot name'), content: z.array(documentNodeSchema).max(MAX_NODE_COUNT).optional() }),
  z.object({ op: z.literal('applyVariant'), nodeId: nodeIdSchema, variantId: safeId('variant id').optional() }),
  z.object({ op: z.literal('upsertAsset'), assetId: safeId('asset id'), asset: assetRefSchema.optional() }),
  z.object({ op: z.literal('upsertComponent'), componentId: safeId('component id'), definition: componentDefinitionSchema.optional() }),
]);

/**
 * `z.infer<typeof documentOperationSchema>` would type every embedded node
 * field (e.g. insertNode's `node`) as `unknown`, since `documentNodeSchema`
 * is deliberately `z.ZodType<unknown>` (see schema.ts) to describe a
 * recursive shape Zod can't express as a precise static type on its own.
 * The real `DocumentOperation` from types.ts IS the precise type for
 * exactly this shape -- `validateOperation` casts to it below once the
 * structure has actually been checked by Zod, rather than every caller
 * (the AI panel, the route, tests) needing its own cast.
 */
export type ValidatedDocumentOperation = DocumentOperation;

export interface OperationValidationResult {
  success: boolean;
  operation?: ValidatedDocumentOperation;
  errors: string[];
}

/** Every embedded node/template in `rawOperation`, by op kind -- the set `checkOperationNodeLimits` must clear before Zod ever sees it. */
function embeddedNodesIn(rawOperation: unknown): unknown[] {
  const op = (rawOperation as { op?: unknown } | null)?.op;
  const r = rawOperation as Record<string, unknown>;
  if (op === 'insertNode') return [r.node];
  if (op === 'setSlotContent') return Array.isArray(r.content) ? r.content : [];
  if (op === 'upsertComponent') {
    const template = (r.definition as { template?: unknown } | null)?.template;
    return template !== undefined ? [template] : [];
  }
  return [];
}

/**
 * Validates one candidate operation (already-parsed JSON, not yet trusted
 * in any way) against the real `DocumentOperation` shape. Does NOT check
 * that it will actually apply cleanly (a dangling `parentId`, for
 * instance, is only caught when `applyOperation` itself throws a
 * `DocumentOperationError`) -- this is the SHAPE/safety gate that must
 * pass before an operation is even attempted.
 */
export function validateOperation(rawOperation: unknown): OperationValidationResult {
  for (const node of embeddedNodesIn(rawOperation)) {
    const violation = checkOperationNodeLimits(node);
    if (violation) return { success: false, errors: [`${violation.kind}: ${violation.message}`] };
  }

  const parsed = documentOperationSchema.safeParse(rawOperation);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`) };
  }
  return { success: true, operation: parsed.data as unknown as ValidatedDocumentOperation, errors: [] };
}
