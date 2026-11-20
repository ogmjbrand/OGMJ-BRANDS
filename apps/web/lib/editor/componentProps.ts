/**
 * Shared convention between `presetComponents.ts` (and any user-authored
 * component) and the Components-aware Inspector UI: a `ComponentPropDef`'s
 * `name` is `"<templateNodeId>__<field>"` -- see presetComponents.ts's
 * module doc comment for why double-underscore rather than a dot. This is
 * the one place that string gets parsed back apart, so the Inspector and
 * any future caller agree on the split.
 */
import { isSafeIdentifier } from '@/lib/document-model/security';

export interface ParsedPropName {
  nodeId: string;
  field: string;
}

/**
 * Splits on the LAST `__` so a node id containing its own underscores
 * (never produced by presetComponents.ts, but not disallowed by
 * `isSafeIdentifier`) still parses correctly -- the field segment is
 * always the final one.
 */
export function parsePropSchemaName(name: string): ParsedPropName | null {
  const splitAt = name.lastIndexOf('__');
  if (splitAt <= 0 || splitAt >= name.length - 2) return null;
  const nodeId = name.slice(0, splitAt);
  const field = name.slice(splitAt + 2);
  if (!isSafeIdentifier(nodeId) || !isSafeIdentifier(field)) return null;
  return { nodeId, field };
}
