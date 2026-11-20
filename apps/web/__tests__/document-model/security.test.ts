import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DocumentRenderer } from '@/components/document/DocumentRenderer';
import { validateDocument } from '@/lib/document-model/schema';
import { DEFAULT_BREAKPOINTS, DEFAULT_TOKEN_SET } from '@/lib/document-model/tokens';
import { MAX_DOCUMENT_DEPTH, MAX_NODE_COUNT, checkDocumentLimits, safeObjectLookup } from '@/lib/document-model/security';
import type { DocumentRoot } from '@/lib/document-model/types';

function emptyDoc(): DocumentRoot {
  return { root: { id: 'root', kind: 'root', children: [] }, tokenSetId: DEFAULT_TOKEN_SET.id, breakpoints: DEFAULT_BREAKPOINTS, components: {}, assets: {} };
}

function render(document: DocumentRoot): string {
  return renderToStaticMarkup(createElement(DocumentRenderer, { document, tokenSet: DEFAULT_TOKEN_SET }));
}

describe('URL security', () => {
  const UNSAFE_URLS = [
    'javascript:alert(document.cookie)',
    'JaVaScRiPt:alert(1)', // scheme matching must not be case-sensitive-bypassable
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    '//evil.example.com/phish', // protocol-relative
    '/\\evil.example.com/phish', // backslash variant browsers treat as another host
  ];
  const SAFE_URLS = ['https://example.com/page', 'http://example.com', 'mailto:hi@example.com', 'tel:+15551234567', '/about', '#section-2'];

  for (const url of UNSAFE_URLS) {
    it(`rejects unsafe button href at schema validation time: ${url}`, () => {
      const doc = emptyDoc();
      doc.root.children = [{ id: 'btn', kind: 'button', label: 'Click', href: url }];
      expect(validateDocument(doc).success).toBe(false);
    });

    it(`never renders unsafe button href even if validation was skipped: ${url}`, () => {
      const doc = emptyDoc();
      doc.root.children = [{ id: 'btn', kind: 'button', label: 'Click', href: url }];
      const html = render(doc); // deliberately render an UNVALIDATED document -- defense in depth
      expect(html).not.toContain(`href="${url}"`);
      expect(html.toLowerCase()).not.toContain('javascript:');
      expect(html.toLowerCase()).not.toContain('vbscript:');
      expect(html).not.toContain('data:text/html');
      expect(html).toContain('Click'); // label still renders, as inert text
      expect(html).not.toContain('<a '); // falls back to a <span>, never an anchor
    });

    it(`rejects unsafe asset url at schema validation time: ${url}`, () => {
      const doc = emptyDoc();
      doc.root.children = [{ id: 'img', kind: 'image', assetRef: 'asset-1' }];
      doc.assets['asset-1'] = { id: 'asset-1', kind: 'image', url };
      expect(validateDocument(doc).success).toBe(false);
    });

    it(`never renders an <img> for an unsafe asset url even if validation was skipped: ${url}`, () => {
      const doc = emptyDoc();
      doc.root.children = [{ id: 'img', kind: 'image', assetRef: 'asset-1' }];
      doc.assets['asset-1'] = { id: 'asset-1', kind: 'image', url };
      const html = render(doc);
      expect(html).not.toContain('<img');
    });

    it(`rejects unsafe VIDEO asset url at schema validation time: ${url}`, () => {
      const doc = emptyDoc();
      doc.root.children = [{ id: 'vid', kind: 'video', assetRef: 'asset-1' }];
      doc.assets['asset-1'] = { id: 'asset-1', kind: 'video', url };
      expect(validateDocument(doc).success).toBe(false);
    });

    it(`never renders a <video> element for an unsafe asset url even if validation was skipped: ${url}`, () => {
      const doc = emptyDoc();
      doc.root.children = [{ id: 'vid', kind: 'video', assetRef: 'asset-1' }];
      doc.assets['asset-1'] = { id: 'asset-1', kind: 'video', url };
      const html = render(doc);
      expect(html).not.toContain('<video');
      expect(html.toLowerCase()).not.toContain('javascript:');
      expect(html.toLowerCase()).not.toContain('vbscript:');
      expect(html).not.toContain('data:text/html');
    });
  }

  for (const url of SAFE_URLS) {
    it(`accepts a legitimate href: ${url}`, () => {
      const doc = emptyDoc();
      doc.root.children = [{ id: 'btn', kind: 'button', label: 'Click', href: url }];
      expect(validateDocument(doc).success).toBe(true);
      expect(render(doc)).toContain('<a ');
    });
  }
});

describe('CSS injection', () => {
  it('rejects a node id crafted to break out of the generated CSS attribute selector, at schema time', () => {
    const doc = emptyDoc();
    doc.root.children = [{ id: '1"}body{background:url(https://evil.example/exfil)}/*', kind: 'heading', text: 'hi', level: 1, style: { textAlign: 'center' } }];
    expect(validateDocument(doc).success).toBe(false);
  });

  it('never emits an id-based CSS breakout into the <style> block, even though the raw id is still visible (safely HTML-escaped) in the data-node attribute', () => {
    const doc = emptyDoc();
    const maliciousId = '1"}body{background:url(https://evil.example/exfil)}/*';
    doc.root.children = [{ id: maliciousId, kind: 'heading', text: 'hi', level: 1, style: { textAlign: 'center' } }];
    const html = render(doc);
    const styleBlock = html.slice(html.indexOf('<style'), html.indexOf('</style>') + '</style>'.length);
    expect(styleBlock).not.toContain('body{background:url(https://evil.example/exfil)}');
    expect(styleBlock).not.toContain('--n-1'); // no CSS variable was ever generated for the rejected node id
    // The id itself may still appear, inertly, inside an HTML-escaped attribute value -- that's fine; the quote that would be needed to break OUT of the attribute is escaped.
    expect(html).toContain('data-node="1&quot;}body{background:url(https://evil.example/exfil)}/*"');
  });

  it('rejects a CSS-injecting background value at schema time', () => {
    const doc = emptyDoc();
    doc.root.children = [{ id: 'n1', kind: 'text', text: 'hi', style: { background: 'red;} body{background:url(https://evil.example/exfil2)} /*' } }];
    expect(validateDocument(doc).success).toBe(false);
  });

  it('never emits a value-based CSS breakout in rendered output even if validation was skipped', () => {
    const doc = emptyDoc();
    doc.root.children = [{ id: 'n1', kind: 'text', text: 'hi', style: { background: 'red;} body{background:url(https://evil.example/exfil2)} /*' } }];
    const html = render(doc);
    expect(html).not.toContain('body{background:url(https://evil.example/exfil2)}');
  });

  it('rejects an injecting value inside a RESPONSIVE override specifically (not just the base value)', () => {
    const doc = emptyDoc();
    doc.root.children = [
      { id: 'n1', kind: 'heading', text: 'hi', level: 1, style: { textAlign: { base: 'center', lg: 'left; } body{color:red} /*' as never } } },
    ];
    expect(validateDocument(doc).success).toBe(false);
  });

  it('a responsive override that fails validation does not suppress the (valid) base rule at render time', () => {
    const doc = emptyDoc();
    // Bypassing validateDocument on purpose: proves the renderer's own per-value
    // check isolates the bad breakpoint instead of dropping the whole property.
    doc.root.children = [
      { id: 'n1', kind: 'heading', text: 'hi', level: 1, style: { textAlign: { base: 'center', lg: 'left;}body{color:red}/*' as never } } },
    ];
    const html = render(doc);
    expect(html).toContain('--n-n1-text-align:center');
    expect(html).not.toContain('body{color:red}');
  });

  it('a malicious value resolved FROM the design token set is caught the same way as an inline value', () => {
    // DocumentRenderer takes `tokenSet` as a prop separate from the validated
    // document (a future caller might resolve it from a business's own token
    // set without re-validating it per render) -- the renderer's per-value
    // CSS check must therefore also cover values that only become unsafe
    // *after* token resolution, not just literal inline strings.
    const doc = emptyDoc();
    doc.root.children = [{ id: 'n1', kind: 'heading', text: 'hi', level: 1, style: { color: { token: 'colors.brand.primary' } } }];
    const badTokenSet = { ...DEFAULT_TOKEN_SET, colors: { ...DEFAULT_TOKEN_SET.colors, 'brand.primary': 'red;}body{color:red}/*' } };
    const html = renderToStaticMarkup(createElement(DocumentRenderer, { document: doc, tokenSet: badTokenSet as never }));
    expect(html).toContain('hi'); // the node itself still renders
    expect(html).not.toContain('body{color:red}'); // but the unsafe resolved color is dropped, not interpolated
  });

  it('rejects a document whose only problem is an unsafe mask value, but still renders safely if forced through', () => {
    const breakoutValue = ['url(x)', '}', 'body{color:red}'].join('');
    const doc = emptyDoc();
    doc.root.children = [{ id: 'n1', kind: 'container', children: [], style: { effects: { mask: { type: 'linear-gradient', value: breakoutValue } } } }];
    expect(validateDocument(doc).success).toBe(false);
    const html = render(doc);
    expect(html).not.toContain('body{color:red}');
  });

  it('rejects __proto__/constructor/prototype as identifiers, closing the prototype-pollution lookup path', () => {
    for (const dangerous of ['__proto__', 'constructor', 'prototype']) {
      const doc = emptyDoc();
      doc.root.children = [{ id: 'instance', kind: 'componentInstance', componentId: dangerous }];
      expect(validateDocument(doc).success).toBe(false);
      // Even unvalidated, the lookup must not resolve to Object.prototype and crash.
      expect(() => render(doc)).not.toThrow();
      expect(render(doc)).toContain('data-ogmj-missing-component');
    }
  });

  it('rejects identifiers over 128 characters', () => {
    const doc = emptyDoc();
    doc.root.children = [{ id: 'n'.repeat(200), kind: 'text', text: 'hi' }];
    expect(validateDocument(doc).success).toBe(false);
  });

  it('rejects identifiers containing characters outside [A-Za-z0-9_-]', () => {
    for (const badId of ['has space', 'has"quote', 'has<tag>', 'has;semi', 'has\nnewline']) {
      const doc = emptyDoc();
      doc.root.children = [{ id: badId, kind: 'text', text: 'hi' }];
      expect(validateDocument(doc).success).toBe(false);
    }
  });
});

describe('document size and recursion limits', () => {
  it('rejects (without crashing) a tree deeper than MAX_DOCUMENT_DEPTH', () => {
    let node: DocumentRoot['root']['children'][number] = { id: 'leaf', kind: 'heading', text: 'x', level: 1 };
    for (let i = 0; i < MAX_DOCUMENT_DEPTH + 10; i++) {
      node = { id: `n${i}`, kind: 'container', children: [node] };
    }
    const doc = emptyDoc();
    doc.root.children = [node];
    let result: ReturnType<typeof validateDocument> | undefined;
    expect(() => {
      result = validateDocument(doc);
    }).not.toThrow();
    expect(result?.success).toBe(false);
    if (!result?.success) expect(result?.errors.join(' ')).toContain('depth');
  });

  it('rejects (without crashing) a document with more than MAX_NODE_COUNT nodes', () => {
    const doc = emptyDoc();
    doc.root.children = Array.from({ length: MAX_NODE_COUNT + 10 }, (_, i) => ({ id: `n${i}`, kind: 'text' as const, text: 'x' }));
    let result: ReturnType<typeof validateDocument> | undefined;
    expect(() => {
      result = validateDocument(doc);
    }).not.toThrow();
    expect(result?.success).toBe(false);
    if (!result?.success) expect(result?.errors.join(' ')).toContain('nodeCount');
  });

  it('rejects an oversized document by byte size', () => {
    const doc = emptyDoc();
    doc.root.children = [{ id: 'n1', kind: 'text', text: 'x'.repeat(3_000_000) }];
    let result: ReturnType<typeof validateDocument> | undefined;
    expect(() => {
      result = validateDocument(doc);
    }).not.toThrow();
    expect(result?.success).toBe(false);
    if (!result?.success) expect(result?.errors.join(' ')).toContain('byteSize');
  });

  it('a 5000-node-deep pathological document that previously crashed with RangeError now fails with a normal validation error', () => {
    let node: DocumentRoot['root']['children'][number] = { id: 'leaf', kind: 'heading', text: 'x', level: 1 };
    for (let i = 0; i < 5000; i++) {
      node = { id: `n${i}`, kind: 'container', children: [node] };
    }
    const doc: DocumentRoot = { root: { ...node, id: 'root', kind: 'root' }, tokenSetId: DEFAULT_TOKEN_SET.id, breakpoints: DEFAULT_BREAKPOINTS, components: {}, assets: {} };
    let result: ReturnType<typeof validateDocument> | undefined;
    expect(() => {
      result = validateDocument(doc);
    }).not.toThrow(); // this exact input used to throw RangeError: Maximum call stack size exceeded
    expect(result?.success).toBe(false);
  });

  it('a pathologically deep tree hidden inside a COMPONENT TEMPLATE (not root) is caught too, not just root', () => {
    let node: DocumentRoot['root']['children'][number] = { id: 'leaf', kind: 'heading', text: 'x', level: 1 };
    for (let i = 0; i < MAX_DOCUMENT_DEPTH + 10; i++) {
      node = { id: `n${i}`, kind: 'container', children: [node] };
    }
    const doc = emptyDoc();
    doc.components['evil'] = { id: 'evil', name: 'Evil', propSchema: [], slots: [], variants: [], template: node };
    let result: ReturnType<typeof validateDocument> | undefined;
    expect(() => {
      result = validateDocument(doc);
    }).not.toThrow();
    expect(result?.success).toBe(false);
  });

  it('a normally-sized, deeply-but-reasonably nested document still passes', () => {
    let node: DocumentRoot['root']['children'][number] = { id: 'leaf', kind: 'heading', text: 'x', level: 1 };
    for (let i = 0; i < 10; i++) {
      node = { id: `n${i}`, kind: 'container', children: [node] };
    }
    const doc = emptyDoc();
    doc.root.children = [node];
    expect(validateDocument(doc).success).toBe(true);
  });

  it('checkDocumentLimits reports "malformed" instead of throwing when the input cannot be JSON-serialized (e.g. a circular reference)', () => {
    const circular: Record<string, unknown> = { root: { id: 'root', kind: 'root', children: [] } };
    (circular.root as Record<string, unknown>).selfRef = circular; // JSON.stringify throws TypeError on this
    let result: ReturnType<typeof checkDocumentLimits>;
    expect(() => {
      result = checkDocumentLimits(circular);
    }).not.toThrow();
    expect(result!).not.toBeNull();
    expect(result!.kind).toBe('malformed');
  });
});

describe('component-instance graph cycles', () => {
  // SECURITY: componentId is just a string reference between a
  // componentInstance node and document.components -- schema.ts validates
  // each node and each component template's own SHAPE, but does not walk
  // that reference graph for cycles (doing so would mean re-deriving the
  // same expansion logic DocumentRenderer already owns, in a second place).
  // This is a deliberate choice, not an oversight: the renderer is the
  // enforcement boundary for this specific risk (see
  // markCyclicComponentInstances in DocumentRenderer.tsx), consistent with
  // "do not rely exclusively on document validation". This test documents
  // that current, intentional boundary so it can't silently drift.
  it('a structurally valid but cyclic component graph currently PASSES schema validation -- the renderer, not the schema, is what must stay safe against it', () => {
    const doc = emptyDoc();
    doc.root.children = [{ id: 'instance-1', kind: 'componentInstance', componentId: 'compA' }];
    doc.components['compA'] = {
      id: 'compA', name: 'Self-referencing', propSchema: [], slots: [], variants: [],
      template: { id: 'inner', kind: 'componentInstance', componentId: 'compA' },
    };
    expect(validateDocument(doc).success).toBe(true);
    // And, per the dedicated DocumentRenderer cycle-safety tests, rendering
    // this same document does not crash and falls back to an inert placeholder.
    expect(() => render(doc)).not.toThrow();
    expect(render(doc)).toContain('data-ogmj-cyclic-component="compA"');
  });
});

describe('safeObjectLookup', () => {
  it('returns the value for an existing, safe key', () => {
    expect(safeObjectLookup({ a: 1 }, 'a')).toBe(1);
  });

  it('returns undefined for a missing key, never Object.prototype machinery', () => {
    for (const dangerous of ['__proto__', 'constructor', 'prototype']) {
      expect(safeObjectLookup({ a: 1 }, dangerous)).toBeUndefined();
    }
  });

  it('returns undefined for an unsafe-charset key even if somehow present', () => {
    expect(safeObjectLookup({ 'has space': 1 } as Record<string, number>, 'has space')).toBeUndefined();
  });

  it('returns undefined for an undefined record', () => {
    expect(safeObjectLookup(undefined, 'a')).toBeUndefined();
  });
});
