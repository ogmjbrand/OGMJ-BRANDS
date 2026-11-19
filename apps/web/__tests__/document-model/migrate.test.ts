import { describe, expect, it } from 'vitest';
import { migrateLegacyContent } from '@/lib/document-model/migrate';
import { validateVersionedDocument } from '@/lib/document-model/schema';
import { CURRENT_SCHEMA_VERSION } from '@/lib/document-model/types';

describe('migrateLegacyContent', () => {
  it('migrates every PR #72 block type into typed nodes', () => {
    const legacy = {
      sections: [
        { type: 'heading', text: 'Welcome', level: 1 },
        { type: 'text', body: 'Some paragraph copy.' },
        { type: 'image', src: 'https://example.com/a.jpg', alt: 'A photo', caption: 'Caption text' },
        { type: 'button', label: 'Get started', href: '/signup' },
      ],
    };

    const result = migrateLegacyContent(legacy, 'My Page');
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);

    const validation = validateVersionedDocument(result);
    expect(validation.success).toBe(true);

    const children = result.document.root.children;
    expect(children).toHaveLength(4);
    expect(children[0]).toMatchObject({ kind: 'heading', text: 'Welcome', level: 1 });
    expect(children[1]).toMatchObject({ kind: 'text', text: 'Some paragraph copy.' });
    expect(children[2]).toMatchObject({ kind: 'image', caption: 'Caption text' });
    expect(children[3]).toMatchObject({ kind: 'button', label: 'Get started', href: '/signup' });

    const imageNode = children[2] as { assetRef: string };
    expect(result.document.assets[imageNode.assetRef]).toMatchObject({ url: 'https://example.com/a.jpg', altText: 'A photo' });
  });

  it('reads fields nested under props/content/data, matching PR #72 field() lookup order', () => {
    const legacy = { sections: [{ type: 'heading', props: { title: 'Nested title', level: 3 } }] };
    const result = migrateLegacyContent(legacy, 'Page');
    expect(result.document.root.children[0]).toMatchObject({ kind: 'heading', text: 'Nested title', level: 3 });
  });

  it('preserves unknown block types losslessly as custom nodes', () => {
    const legacy = { sections: [{ type: 'testimonial-carousel', quotes: ['a', 'b'], theme: 'light' }] };
    const result = migrateLegacyContent(legacy, 'Page');
    const node = result.document.root.children[0];
    expect(node.kind).toBe('custom');
    expect((node as { customType: string }).customType).toBe('testimonial-carousel');
    expect((node as { props: Record<string, unknown> }).props).toMatchObject({
      quotes: ['a', 'b'],
      theme: 'light',
    });
  });

  it('never throws on malformed legacy content', () => {
    expect(() => migrateLegacyContent(null, 'Page')).not.toThrow();
    expect(() => migrateLegacyContent({ sections: 'not-an-array' }, 'Page')).not.toThrow();
    expect(() => migrateLegacyContent({ sections: [null, 42, 'a string'] }, 'Page')).not.toThrow();

    const result = migrateLegacyContent(undefined, 'Empty Page');
    expect(validateVersionedDocument(result).success).toBe(true);
    expect(result.document.root.children).toEqual([]);
  });

  it('is idempotent when content is already a VersionedDocument', () => {
    const first = migrateLegacyContent({ sections: [{ type: 'heading', text: 'Hi', level: 2 }] }, 'Page');
    const second = migrateLegacyContent(first, 'Page');
    expect(second).toEqual(first);
  });
});
