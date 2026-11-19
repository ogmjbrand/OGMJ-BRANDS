/**
 * Backward-compatibility layer.
 *
 * `web_pages.content` already holds data today: the ad hoc
 * `{ sections: [{ type, text/title/..., props?/content?/data? }] }` shape
 * that PR #72's SectionRenderer reads leniently (see that PR's
 * SectionRenderer.tsx `field()` helper — this file mirrors its exact field
 * lookup order so nothing a page author already typed gets lost or
 * reinterpreted).
 *
 * `migrateLegacyContent` lifts that shape into a schemaVersion-1
 * DocumentRoot losslessly: every recognized block becomes a typed node,
 * and every unrecognized block becomes a `custom` node carrying its
 * original fields verbatim in `props`, so round-tripping an unknown block
 * through this migration never drops data.
 *
 * `migrateVersionedDocument` is the general upgrade path for *future*
 * schema versions: each entry in MIGRATIONS upgrades exactly one version
 * step, and callers never need to know how many steps a stored document is
 * behind.
 */

import type { AssetId, AssetRef, ButtonNode, DocumentNode, DocumentRoot, HeadingNode, ImageNode, TextNode, VersionedDocument } from './types';
import { CURRENT_SCHEMA_VERSION } from './types';
import { DEFAULT_BREAKPOINTS, DEFAULT_TOKEN_SET } from './tokens';

type LegacyBlock = Record<string, unknown>;

function asRecord(value: unknown): LegacyBlock | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as LegacyBlock) : null;
}

/** Same lookup order as PR #72's SectionRenderer `field()`: top-level, then props/content/data. */
function field(block: LegacyBlock, ...keys: string[]): string | undefined {
  const sources = [block, asRecord(block.props), asRecord(block.content), asRecord(block.data)];
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value;
      if (typeof value === 'number') return String(value);
    }
  }
  return undefined;
}

function stableId(prefix: string, index: number, seed: string): string {
  return `${prefix}-${index}-${seed.length}`;
}

function migrateLegacyBlock(block: unknown, index: number, assets: Record<AssetId, AssetRef>): DocumentNode {
  const record = asRecord(block);
  if (!record) {
    return { id: stableId('legacy', index, 'unknown'), kind: 'custom', customType: 'unknown', props: { value: block } };
  }

  const rawType = typeof record.type === 'string' ? record.type.toLowerCase() : '';
  const id = typeof record.id === 'string' ? record.id : stableId('legacy', index, rawType);

  switch (rawType) {
    case 'heading':
    case 'title': {
      const text = field(record, 'text', 'title', 'heading');
      const levelRaw = Number(field(record, 'level'));
      const node: HeadingNode = {
        id,
        kind: 'heading',
        text: text ?? '',
        level: (levelRaw >= 1 && levelRaw <= 6 ? levelRaw : 2) as HeadingNode['level'],
      };
      return node;
    }

    case 'text':
    case 'paragraph':
    case 'richtext': {
      const text = field(record, 'text', 'body', 'html', 'value');
      const node: TextNode = { id, kind: 'text', text: text ?? '' };
      return node;
    }

    case 'image': {
      const src = field(record, 'src', 'url', 'image', 'imageUrl');
      const alt = field(record, 'alt', 'caption');
      const caption = field(record, 'caption');
      const assetId = `legacy-asset-${id}`;
      if (src) {
        assets[assetId] = { id: assetId, kind: 'image', url: src, altText: alt, generatedBy: 'upload' };
      }
      const node: ImageNode = { id, kind: 'image', assetRef: assetId, caption };
      return node;
    }

    case 'button':
    case 'cta': {
      const label = field(record, 'label', 'text', 'title');
      const href = field(record, 'href', 'url', 'link');
      const node: ButtonNode = { id, kind: 'button', label: label ?? '', href: href ?? '#' };
      return node;
    }

    default:
      // Unknown block type: preserve every original field, nothing is dropped.
      return { id, kind: 'custom', customType: rawType || 'unknown', props: record };
  }
}

/**
 * Converts a legacy `web_pages.content` value (or an already-structured one
 * — see the `content.schemaVersion` short-circuit) into a current
 * VersionedDocument. Never throws: malformed legacy content becomes an
 * empty root rather than a failed page load.
 */
export function migrateLegacyContent(legacyContent: unknown, pageTitle: string): VersionedDocument {
  const record = asRecord(legacyContent);

  // Already migrated (e.g. re-processing a document that's already current).
  if (record && typeof record.schemaVersion === 'number') {
    return migrateVersionedDocument(record as unknown as VersionedDocument);
  }

  const sections = record && Array.isArray(record.sections) ? record.sections : [];
  const assets: Record<AssetId, AssetRef> = {};
  const children = sections.map((block, index) => migrateLegacyBlock(block, index, assets));

  const document: DocumentRoot = {
    root: { id: 'root', kind: 'root', name: pageTitle, children },
    tokenSetId: DEFAULT_TOKEN_SET.id,
    breakpoints: DEFAULT_BREAKPOINTS,
    components: {},
    assets,
  };

  return { schemaVersion: CURRENT_SCHEMA_VERSION, document };
}

/**
 * Version-to-version upgrade registry. Add an entry here for every new
 * CURRENT_SCHEMA_VERSION bump; never delete an old entry while any stored
 * document might still be at that version.
 */
const MIGRATIONS: Record<number, (doc: VersionedDocument) => VersionedDocument> = {
  // 1 -> 2 would go here, e.g.:
  // 1: (doc) => ({ schemaVersion: 2, document: upgradeV1toV2(doc.document) }),
};

export function migrateVersionedDocument(doc: VersionedDocument): VersionedDocument {
  let current = doc;
  while (current.schemaVersion < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS[current.schemaVersion];
    if (!step) {
      throw new Error(
        `No migration registered from schemaVersion ${current.schemaVersion} to ${current.schemaVersion + 1}`
      );
    }
    current = step(current);
  }
  return current;
}
