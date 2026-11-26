import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { DocumentRenderer } from '@/components/document/DocumentRenderer';
import { DEFAULT_BREAKPOINTS, DEFAULT_TOKEN_SET } from '@/lib/document-model/tokens';
import { migrateLegacyContent } from '@/lib/document-model/migrate';
import type { DocumentRoot } from '@/lib/document-model/types';

function render(document: DocumentRoot): string {
  return renderToStaticMarkup(createElement(DocumentRenderer, { document, tokenSet: DEFAULT_TOKEN_SET }));
}

describe('DocumentRenderer', () => {
  it('renders heading, text, image, button nodes with real content', () => {
    const { document } = migrateLegacyContent(
      {
        sections: [
          { type: 'heading', text: 'Launch week', level: 1 },
          { type: 'text', body: 'We are shipping something new.' },
          { type: 'image', src: 'https://cdn.example.com/photo.jpg', alt: 'Team photo' },
          { type: 'button', label: 'See the plan', href: '/plan' },
        ],
      },
      'Launch'
    );

    const html = render(document);
    expect(html).toContain('Launch week');
    expect(html).toContain('<h1');
    expect(html).toContain('We are shipping something new.');
    expect(html).toContain('src="https://cdn.example.com/photo.jpg"');
    expect(html).toContain('alt="Team photo"');
    expect(html).toContain('>See the plan</a>');
    expect(html).toContain('href="/plan"');
  });

  it('never emits raw HTML from text content (no dangerouslySetInnerHTML injection path for node text)', () => {
    const { document } = migrateLegacyContent(
      { sections: [{ type: 'text', body: '<script>alert(1)</script>' }] },
      'Page'
    );
    const html = render(document);
    // React escapes text children automatically; the literal tag must not appear unescaped.
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('resolves a responsive style value into a base rule plus a min-width media query', () => {
    const document: DocumentRoot = {
      root: {
        id: 'root',
        kind: 'root',
        children: [
          {
            id: 'heading-1',
            kind: 'heading',
            text: 'Responsive heading',
            level: 1,
            style: { textAlign: { base: 'center', lg: 'left' } },
          },
        ],
      },
      tokenSetId: DEFAULT_TOKEN_SET.id,
      breakpoints: DEFAULT_BREAKPOINTS,
      components: {},
      assets: {},
    };

    const html = render(document);
    expect(html).toContain('--n-heading-1-text-align:center');
    expect(html).toContain('@media (min-width:1024px)');
    expect(html).toContain('--n-heading-1-text-align:left');
    expect(html).toContain('data-node="heading-1"');
  });

  it('resolves a design-token reference to its concrete value', () => {
    const document: DocumentRoot = {
      root: {
        id: 'root',
        kind: 'root',
        children: [{ id: 'h1', kind: 'heading', text: 'Tokenized', level: 2, style: { color: { token: 'colors.brand.primary' } } }],
      },
      tokenSetId: DEFAULT_TOKEN_SET.id,
      breakpoints: DEFAULT_BREAKPOINTS,
      components: {},
      assets: {},
    };
    const html = render(document);
    expect(html).toContain(DEFAULT_TOKEN_SET.colors['brand.primary']);
  });

  it('renders a component instance by substituting slot content into its template', () => {
    const document: DocumentRoot = {
      root: {
        id: 'root',
        kind: 'root',
        children: [
          {
            id: 'instance-1',
            kind: 'componentInstance',
            componentId: 'callout',
            slotContent: { body: [{ id: 'slot-text', kind: 'text', text: 'Slotted content' }] },
          },
        ],
      },
      tokenSetId: DEFAULT_TOKEN_SET.id,
      breakpoints: DEFAULT_BREAKPOINTS,
      components: {
        callout: {
          id: 'callout',
          name: 'Callout',
          propSchema: [],
          slots: ['body'],
          variants: [],
          template: { id: 'tpl', kind: 'container', children: [{ id: 'tpl-slot', kind: 'slot', slotName: 'body' }] },
        },
      },
      assets: {},
    };
    const html = render(document);
    expect(html).toContain('Slotted content');
    expect(html).toContain('data-component="callout"');
  });

  it('falls back to a default-content slot when an instance supplies none', () => {
    const document: DocumentRoot = {
      root: {
        id: 'root',
        kind: 'root',
        children: [{ id: 'instance-1', kind: 'componentInstance', componentId: 'callout' }],
      },
      tokenSetId: DEFAULT_TOKEN_SET.id,
      breakpoints: DEFAULT_BREAKPOINTS,
      components: {
        callout: {
          id: 'callout',
          name: 'Callout',
          propSchema: [],
          slots: ['body'],
          variants: [],
          template: {
            id: 'tpl',
            kind: 'container',
            children: [{ id: 'tpl-slot', kind: 'slot', slotName: 'body', defaultContent: [{ id: 'default-text', kind: 'text', text: 'Default copy' }] }],
          },
        },
      },
      assets: {},
    };
    expect(render(document)).toContain('Default copy');
  });

  it('collects CSS rules for styled nodes inside a slot\'s defaultContent, not just inside normal children', () => {
    // Regression: collectCssRules originally walked only getChildren(node),
    // which excludes a slot's defaultContent -- a styled default-content
    // node would be rendered referencing a CSS variable the <style> block
    // never actually defined, so its style silently never applied.
    const document: DocumentRoot = {
      root: { id: 'root', kind: 'root', children: [{ id: 'instance-1', kind: 'componentInstance', componentId: 'callout' }] },
      tokenSetId: DEFAULT_TOKEN_SET.id,
      breakpoints: DEFAULT_BREAKPOINTS,
      components: {
        callout: {
          id: 'callout', name: 'Callout', propSchema: [], slots: ['body'], variants: [],
          template: {
            id: 'tpl', kind: 'container',
            children: [{
              id: 'tpl-slot', kind: 'slot', slotName: 'body',
              defaultContent: [{ id: 'default-text', kind: 'text', text: 'Default copy', style: { background: '#112233' } }],
            }],
          },
        },
      },
      assets: {},
    };
    const html = render(document);
    expect(html).toMatch(/--n-instance-1__default-text-background:#112233/);
  });

  it('renders an invisible placeholder (never throws) for a componentInstance referencing a missing component', () => {
    const document: DocumentRoot = {
      root: { id: 'root', kind: 'root', children: [{ id: 'instance-1', kind: 'componentInstance', componentId: 'does-not-exist' }] },
      tokenSetId: DEFAULT_TOKEN_SET.id,
      breakpoints: DEFAULT_BREAKPOINTS,
      components: {},
      assets: {},
    };
    expect(() => render(document)).not.toThrow();
    expect(render(document)).toContain('data-ogmj-missing-component="does-not-exist"');
  });

  describe('component-instance cycle safety', () => {
    // SECURITY: componentId is just a string reference -- nothing in
    // schema.ts walks the component graph for cycles, so each document
    // below is structurally small and schema-shape-valid, yet would expand
    // infinitely if the renderer naively followed every componentId. See
    // markCyclicComponentInstances in DocumentRenderer.tsx.

    it('renders a safe inert placeholder, without throwing, for a DIRECT self-reference (A -> A)', () => {
      const document: DocumentRoot = {
        root: { id: 'root', kind: 'root', children: [{ id: 'instance-1', kind: 'componentInstance', componentId: 'compA' }] },
        tokenSetId: DEFAULT_TOKEN_SET.id,
        breakpoints: DEFAULT_BREAKPOINTS,
        components: {
          compA: {
            id: 'compA',
            name: 'Self-referencing',
            propSchema: [],
            slots: [],
            variants: [],
            template: { id: 'inner', kind: 'componentInstance', componentId: 'compA' },
          },
        },
        assets: {},
      };
      expect(() => render(document)).not.toThrow();
      const html = render(document);
      expect(html).toContain('data-ogmj-cyclic-component="compA"');
    });

    it('renders a safe inert placeholder, without throwing, for an INDIRECT two-component cycle (A -> B -> A)', () => {
      const document: DocumentRoot = {
        root: { id: 'root', kind: 'root', children: [{ id: 'instance-1', kind: 'componentInstance', componentId: 'compA' }] },
        tokenSetId: DEFAULT_TOKEN_SET.id,
        breakpoints: DEFAULT_BREAKPOINTS,
        components: {
          compA: {
            id: 'compA', name: 'A', propSchema: [], slots: [], variants: [],
            template: { id: 'a-inner', kind: 'componentInstance', componentId: 'compB' },
          },
          compB: {
            id: 'compB', name: 'B', propSchema: [], slots: [], variants: [],
            template: { id: 'b-inner', kind: 'componentInstance', componentId: 'compA' },
          },
        },
        assets: {},
      };
      expect(() => render(document)).not.toThrow();
      const html = render(document);
      // compB's own template is the one that tries to re-enter compA, which
      // is already on the ancestor chain -- that re-entry is what's flagged.
      expect(html).toContain('data-ogmj-cyclic-component="compA"');
    });

    it('renders a safe inert placeholder, without throwing, for a LONGER cycle (A -> B -> C -> A)', () => {
      const document: DocumentRoot = {
        root: { id: 'root', kind: 'root', children: [{ id: 'instance-1', kind: 'componentInstance', componentId: 'compA' }] },
        tokenSetId: DEFAULT_TOKEN_SET.id,
        breakpoints: DEFAULT_BREAKPOINTS,
        components: {
          compA: {
            id: 'compA', name: 'A', propSchema: [], slots: [], variants: [],
            template: { id: 'a-inner', kind: 'componentInstance', componentId: 'compB' },
          },
          compB: {
            id: 'compB', name: 'B', propSchema: [], slots: [], variants: [],
            template: { id: 'b-inner', kind: 'componentInstance', componentId: 'compC' },
          },
          compC: {
            id: 'compC', name: 'C', propSchema: [], slots: [], variants: [],
            template: { id: 'c-inner', kind: 'componentInstance', componentId: 'compA' },
          },
        },
        assets: {},
      };
      expect(() => render(document)).not.toThrow();
      const html = render(document);
      expect(html).toContain('data-ogmj-cyclic-component="compA"');
    });

    it('preserves a LEGITIMATE (non-cyclic) nested component instance: one component whose template instantiates a different component', () => {
      const document: DocumentRoot = {
        root: { id: 'root', kind: 'root', children: [{ id: 'instance-1', kind: 'componentInstance', componentId: 'outer' }] },
        tokenSetId: DEFAULT_TOKEN_SET.id,
        breakpoints: DEFAULT_BREAKPOINTS,
        components: {
          outer: {
            id: 'outer', name: 'Outer', propSchema: [], slots: [], variants: [],
            template: { id: 'outer-inner', kind: 'componentInstance', componentId: 'inner' },
          },
          inner: {
            id: 'inner', name: 'Inner', propSchema: [], slots: [], variants: [],
            template: { id: 'inner-text', kind: 'text', text: 'Nested content' },
          },
        },
        assets: {},
      };
      const html = render(document);
      expect(html).toContain('Nested content');
      expect(html).toContain('data-component="outer"');
      expect(html).toContain('data-component="inner"');
      expect(html).not.toContain('data-ogmj-cyclic-component');
    });

    it('catches a cyclic componentInstance reachable only through a SLOT\'s defaultContent, not just through children', () => {
      // Regression: markCyclicComponentInstances originally walked only
      // getChildren(node), which returns undefined for a slot node --
      // defaultContent was invisible to it, so a cycle hidden inside a
      // slot's own default content would never be flagged and would
      // recurse without bound at render time.
      const document: DocumentRoot = {
        root: { id: 'root', kind: 'root', children: [{ id: 'instance-1', kind: 'componentInstance', componentId: 'compA' }] },
        tokenSetId: DEFAULT_TOKEN_SET.id,
        breakpoints: DEFAULT_BREAKPOINTS,
        components: {
          compA: {
            id: 'compA', name: 'A', propSchema: [], slots: ['body'], variants: [],
            template: {
              id: 'tpl',
              kind: 'slot',
              slotName: 'body',
              defaultContent: [{ id: 'inner', kind: 'componentInstance', componentId: 'compA' }],
            },
          },
        },
        assets: {},
      };
      expect(() => render(document)).not.toThrow();
      const html = render(document);
      expect(html).toContain('data-ogmj-cyclic-component="compA"');
    });

    it('preserves the SAME (non-cyclic) component legitimately instantiated twice in unrelated branches', () => {
      const document: DocumentRoot = {
        root: {
          id: 'root', kind: 'root',
          children: [
            { id: 'instance-1', kind: 'componentInstance', componentId: 'badge' },
            { id: 'instance-2', kind: 'componentInstance', componentId: 'badge' },
          ],
        },
        tokenSetId: DEFAULT_TOKEN_SET.id,
        breakpoints: DEFAULT_BREAKPOINTS,
        components: {
          badge: {
            id: 'badge', name: 'Badge', propSchema: [], slots: [], variants: [],
            template: { id: 'badge-text', kind: 'text', text: 'New' },
          },
        },
        assets: {},
      };
      const html = render(document);
      expect(html).not.toContain('data-ogmj-cyclic-component');
      expect((html.match(/>New</g) ?? []).length).toBe(2);
    });
  });

  it('renders a 3D scene as a static poster placeholder, never a WebGL canvas', () => {
    const document: DocumentRoot = {
      root: {
        id: 'root',
        kind: 'root',
        children: [
          {
            id: 'scene-1',
            kind: 'scene3d',
            scene: {
              camera: { position: { x: 0, y: 0, z: 5 } },
              lights: [],
              objects: [],
              posterAssetRef: 'poster-1',
            },
          },
        ],
      },
      tokenSetId: DEFAULT_TOKEN_SET.id,
      breakpoints: DEFAULT_BREAKPOINTS,
      components: {},
      assets: { 'poster-1': { id: 'poster-1', kind: 'image', url: 'https://cdn.example.com/poster.jpg' } },
    };
    const html = render(document);
    expect(html).toContain('data-ogmj-scene3d-placeholder="true"');
    expect(html).toContain('src="https://cdn.example.com/poster.jpg"');
    expect(html).not.toContain('<canvas');
  });

  it('renders an empty 3D placeholder safely when no poster asset is set', () => {
    const document: DocumentRoot = {
      root: {
        id: 'root',
        kind: 'root',
        children: [{ id: 'scene-1', kind: 'scene3d', scene: { camera: { position: { x: 0, y: 0, z: 1 } }, lights: [], objects: [] } }],
      },
      tokenSetId: DEFAULT_TOKEN_SET.id,
      breakpoints: DEFAULT_BREAKPOINTS,
      components: {},
      assets: {},
    };
    expect(() => render(document)).not.toThrow();
    expect(render(document)).toContain('data-ogmj-scene3d-empty="true"');
  });

  it('renders unrecognized custom node types by their children instead of vanishing', () => {
    const document: DocumentRoot = {
      root: {
        id: 'root',
        kind: 'root',
        children: [
          {
            id: 'custom-1',
            kind: 'custom',
            customType: 'future-pricing-table',
            props: { plans: 3 },
            children: [{ id: 'inner-text', kind: 'text', text: 'Still visible' }],
          },
        ],
      },
      tokenSetId: DEFAULT_TOKEN_SET.id,
      breakpoints: DEFAULT_BREAKPOINTS,
      components: {},
      assets: {},
    };
    const html = render(document);
    expect(html).toContain('data-ogmj-custom-type="future-pricing-table"');
    expect(html).toContain('Still visible');
  });

  it('attaches a load-triggered motion class and carries full motion data for a future motion engine', () => {
    const document: DocumentRoot = {
      root: {
        id: 'root',
        kind: 'root',
        children: [
          {
            id: 'hero',
            kind: 'section',
            children: [],
            motion: { triggers: [{ on: 'load', animation: { keyframes: [{ at: 0, opacity: 0 }, { at: 1, opacity: 1 }], durationMs: 600 } }] },
          },
        ],
      },
      tokenSetId: DEFAULT_TOKEN_SET.id,
      breakpoints: DEFAULT_BREAKPOINTS,
      components: {},
      assets: {},
    };
    const html = render(document);
    expect(html).toContain('ogmj-fade-in');
    expect(html).toContain('data-motion=');
    expect(html).toContain('&quot;on&quot;:&quot;load&quot;');
  });

  it('applies a mask declaration as real CSS, rather than silently ignoring it', () => {
    const document: DocumentRoot = {
      root: {
        id: 'root', kind: 'root',
        children: [{ id: 'n1', kind: 'container', children: [], style: { effects: { mask: { type: 'linear-gradient', value: 'linear-gradient(black, transparent)' } } } }],
      },
      tokenSetId: DEFAULT_TOKEN_SET.id, breakpoints: DEFAULT_BREAKPOINTS, components: {}, assets: {},
    };
    const html = render(document);
    expect(html).toContain('mask-image:linear-gradient(black, transparent)');
  });

  describe('componentInstance variant and per-instance propOverrides', () => {
    function docWithHero(options: { variantId?: string; instanceOverrides?: Record<string, unknown> }): DocumentRoot {
      return {
        root: {
          id: 'root',
          kind: 'root',
          children: [
            {
              id: 'instance-1',
              kind: 'componentInstance',
              componentId: 'hero',
              variantId: options.variantId,
              propOverrides: options.instanceOverrides,
            },
          ],
        },
        tokenSetId: DEFAULT_TOKEN_SET.id,
        breakpoints: DEFAULT_BREAKPOINTS,
        components: {
          hero: {
            id: 'hero',
            name: 'Hero',
            propSchema: [],
            slots: [],
            variants: [{ id: 'dark', name: 'Dark', propOverrides: { 'tpl-heading': { style: { background: '#000000' } } } }],
            template: {
              id: 'tpl',
              kind: 'container',
              children: [{ id: 'tpl-heading', kind: 'heading', text: 'Default headline', level: 1, style: { background: '#ffffff' } }],
            },
          },
        },
        assets: {},
      };
    }

    it('applying a variant restyles the specific template node it targets', () => {
      const html = render(docWithHero({ variantId: 'dark' }));
      // CSS variable names are namespaced by the instance id (instance-1__...)
      // so two instances of the same component never collide -- see
      // namespaceLeafIds in DocumentRenderer.tsx.
      expect(html).toContain('--n-instance-1__tpl-heading-background:#000000');
    });

    it('with no variant selected, the template node keeps its own default style', () => {
      const html = render(docWithHero({}));
      expect(html).toContain('--n-instance-1__tpl-heading-background:#ffffff');
    });

    it('a per-instance propOverride patches content on a specific template node without detaching from the component', () => {
      const html = render(docWithHero({ instanceOverrides: { 'tpl-heading': { text: 'Custom headline for this instance' } } }));
      expect(html).toContain('Custom headline for this instance');
      expect(html).toContain('data-component="hero"'); // still a real instance, not detached
    });

    it('instance-level overrides win over the variant on the same key, but the variant\'s other overrides on that node survive', () => {
      const html = render(
        docWithHero({
          variantId: 'dark',
          instanceOverrides: { 'tpl-heading': { text: 'Instance headline' } },
        })
      );
      expect(html).toContain('Instance headline');
      expect(html).toContain('--n-instance-1__tpl-heading-background:#000000'); // variant's style override still applied
    });

    it('two instances of the SAME component with different variants do not bleed CSS into each other', () => {
      const document: DocumentRoot = {
        root: {
          id: 'root',
          kind: 'root',
          children: [
            { id: 'instance-1', kind: 'componentInstance', componentId: 'hero', variantId: 'dark' },
            { id: 'instance-2', kind: 'componentInstance', componentId: 'hero' },
          ],
        },
        tokenSetId: DEFAULT_TOKEN_SET.id,
        breakpoints: DEFAULT_BREAKPOINTS,
        components: {
          hero: {
            id: 'hero',
            name: 'Hero',
            propSchema: [],
            slots: [],
            variants: [{ id: 'dark', name: 'Dark', propOverrides: { 'tpl-heading': { style: { background: '#000000' } } } }],
            template: {
              id: 'tpl',
              kind: 'container',
              children: [{ id: 'tpl-heading', kind: 'heading', text: 'Headline', level: 1, style: { background: '#ffffff' } }],
            },
          },
        },
        assets: {},
      };
      const html = render(document);
      // Without per-instance id namespacing both instances would emit the
      // SAME CSS variable name for "tpl-heading", and whichever rule came
      // first would win for both -- this proves they're independent.
      expect(html).toContain('--n-instance-1__tpl-heading-background:#000000');
      expect(html).toContain('--n-instance-2__tpl-heading-background:#ffffff');
    });

    it('cannot patch structural keys (id/kind/children/componentId) via propOverrides', () => {
      const document = docWithHero({ instanceOverrides: { 'tpl-heading': { kind: 'button', id: 'hijacked', children: [] } } });
      const html = render(document);
      // The node still rendered as its real kind (<h1>), proving the
      // disallowed keys in the patch were silently dropped, not applied.
      expect(html).toContain('<h1');
      expect(html).not.toContain('hijacked');
    });
  });

  it('records a shaderRef as an explicit data attribute instead of silently dropping it', () => {
    const document: DocumentRoot = {
      root: {
        id: 'root', kind: 'root',
        children: [{ id: 'n1', kind: 'container', children: [], style: { effects: { shaderRef: { shaderId: 'liquid-distort', params: { intensity: 0.5 } } } } }],
      },
      tokenSetId: DEFAULT_TOKEN_SET.id, breakpoints: DEFAULT_BREAKPOINTS, components: {}, assets: {},
    };
    const html = render(document);
    expect(html).toContain('data-ogmj-shader-ref="liquid-distort"');
  });
});
