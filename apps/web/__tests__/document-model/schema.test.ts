import { describe, expect, it } from 'vitest';
import { validateDocument, validateVersionedDocument } from '@/lib/document-model/schema';
import { DEFAULT_BREAKPOINTS, DEFAULT_TOKEN_SET } from '@/lib/document-model/tokens';
import { CURRENT_SCHEMA_VERSION, type DocumentRoot } from '@/lib/document-model/types';

function minimalDocument(): DocumentRoot {
  return {
    root: { id: 'root', kind: 'root', children: [{ id: 'h1', kind: 'heading', text: 'Hello', level: 1 }] },
    tokenSetId: DEFAULT_TOKEN_SET.id,
    breakpoints: DEFAULT_BREAKPOINTS,
    components: {},
    assets: {},
  };
}

describe('validateDocument', () => {
  it('accepts a minimal valid document', () => {
    const result = validateDocument(minimalDocument());
    expect(result.success).toBe(true);
  });

  it('accepts nested containers, components, slots and 3D nodes', () => {
    const doc: DocumentRoot = {
      root: {
        id: 'root',
        kind: 'root',
        children: [
          {
            id: 'hero',
            kind: 'componentInstance',
            componentId: 'hero-card',
            variantId: 'dark',
            slotContent: { body: [{ id: 't1', kind: 'text', text: 'Body copy' }] },
          },
          {
            id: 'scene',
            kind: 'scene3d',
            scene: {
              camera: { position: { x: 0, y: 0, z: 5 } },
              lights: [{ type: 'ambient', intensity: 0.5 }],
              objects: [{ id: 'obj1', assetRef: 'model-1' }],
            },
          },
        ],
      },
      tokenSetId: DEFAULT_TOKEN_SET.id,
      breakpoints: DEFAULT_BREAKPOINTS,
      components: {
        'hero-card': {
          id: 'hero-card',
          name: 'Hero Card',
          propSchema: [],
          slots: ['body'],
          variants: [{ id: 'dark', name: 'Dark' }],
          template: {
            id: 'tpl-root',
            kind: 'container',
            children: [{ id: 'tpl-slot', kind: 'slot', slotName: 'body' }],
          },
        },
      },
      assets: {},
    };
    const result = validateDocument(doc);
    expect(result.success).toBe(true);
  });

  it('rejects a node with an unknown kind', () => {
    const doc = minimalDocument();
    // @ts-expect-error -- intentionally invalid for the test
    doc.root.children.push({ id: 'bad', kind: 'not-a-real-kind' });
    const result = validateDocument(doc);
    expect(result.success).toBe(false);
  });

  it('rejects a heading missing required text', () => {
    const doc = minimalDocument();
    // @ts-expect-error -- intentionally invalid for the test
    doc.root.children = [{ id: 'h1', kind: 'heading', level: 1 }];
    const result = validateDocument(doc);
    expect(result.success).toBe(false);
  });

  it('rejects responsive values with an out-of-range breakpoint object shape', () => {
    const doc = minimalDocument();
    doc.root.children[0] = {
      id: 'h1',
      kind: 'heading',
      text: 'Hi',
      level: 1,
      style: { textAlign: { base: 'center', lg: 'not-a-valid-align' as never } },
    };
    const result = validateDocument(doc);
    expect(result.success).toBe(false);
  });
});

describe('validateVersionedDocument', () => {
  it('accepts the current schema version', () => {
    const result = validateVersionedDocument({ schemaVersion: CURRENT_SCHEMA_VERSION, document: minimalDocument() });
    expect(result.success).toBe(true);
  });

  it('rejects a schema version newer than this build supports', () => {
    const result = validateVersionedDocument({ schemaVersion: CURRENT_SCHEMA_VERSION + 1, document: minimalDocument() });
    expect(result.success).toBe(false);
  });
});
