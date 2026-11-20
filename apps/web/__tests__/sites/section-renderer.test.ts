import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SectionRenderer, safeHref, safeSrc, supportedBlockType } from '@/components/sites/SectionRenderer';

/**
 * Regression tests for the public block renderer: only an allow-list of
 * block types renders, all content is escaped, URLs are scheme-restricted,
 * and pages with no renderable blocks show the empty state.
 */

function render(sections: unknown[]) {
  return renderToStaticMarkup(createElement(SectionRenderer, { sections }));
}

const EMPTY_STATE = 'This page has no content yet.';

describe('SectionRenderer: supported block types', () => {
  it('renders heading, text, image and button blocks', () => {
    const html = render([
      { type: 'heading', text: 'Welcome', level: 1 },
      { type: 'text', text: 'Hello world' },
      { type: 'image', src: 'https://cdn.example.com/a.png', alt: 'A' },
      { type: 'button', label: 'Go', href: '/contact' },
    ]);
    expect(html).toContain('<h1');
    expect(html).toContain('Welcome');
    expect(html).toContain('Hello world');
    expect(html).toContain('src="https://cdn.example.com/a.png"');
    expect(html).toContain('href="/contact"');
    expect(html).not.toContain(EMPTY_STATE);
  });

  it('accepts aliases and fields nested under props/content/data', () => {
    const html = render([
      { type: 'Title', props: { text: 'Nested heading' } },
      { type: 'paragraph', content: { body: 'Nested body' } },
      { type: 'cta', data: { label: 'Nested CTA', url: 'https://example.com' } },
    ]);
    expect(html).toContain('Nested heading');
    expect(html).toContain('Nested body');
    expect(html).toContain('Nested CTA');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('exposes the allow-list deterministically', () => {
    expect(supportedBlockType({ type: 'heading' })).toBe('heading');
    expect(supportedBlockType({ type: ' RichText ' })).toBe('text');
    expect(supportedBlockType({ type: 'html' })).toBeNull();
    expect(supportedBlockType({ type: 'constructor' })).toBeNull();
    expect(supportedBlockType({ type: '__proto__' })).toBeNull();
    expect(supportedBlockType({})).toBeNull();
  });
});

describe('SectionRenderer: unsupported / unsafe content never renders', () => {
  it.each(['html', 'embed', 'script', 'iframe', 'custom', 'video', 'form', 'unknown'])(
    'drops unsupported block type "%s" entirely',
    (type) => {
      const html = render([
        { type, text: 'LEAK-TEXT', html: '<script>alert(1)</script>', title: 'LEAK-TITLE', body: 'LEAK-BODY' },
      ]);
      expect(html).not.toContain('LEAK');
      expect(html).not.toContain('<script');
      expect(html).toContain(EMPTY_STATE);
    },
  );

  it('drops unsupported blocks but keeps supported siblings', () => {
    const html = render([
      { type: 'html', html: '<img src=x onerror=alert(1)>' },
      { type: 'text', text: 'kept' },
    ]);
    expect(html).toContain('kept');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('data-block-type="html"');
  });

  it('escapes markup inside supported blocks (never raw HTML)', () => {
    const html = render([
      { type: 'heading', text: '<img src=x onerror=alert(1)>' },
      { type: 'text', html: '<script>alert(1)</script>' },
    ]);
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;');
  });

  it.each([
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '//evil.example.com',
    '/\\evil.example.com',
  ])('button with unsafe href %j is not rendered', (href) => {
    const html = render([{ type: 'button', label: 'Click', href }]);
    expect(html).not.toContain('Click');
    expect(html).not.toContain('<a');
  });

  it.each(['javascript:alert(1)', 'data:image/svg+xml,<svg onload=alert(1)>', '//evil.example.com/x.png'])(
    'image with unsafe src %j is not rendered',
    (src) => {
      const html = render([{ type: 'image', src }]);
      expect(html).not.toContain('<img');
    },
  );

  it('safeHref / safeSrc allow-list', () => {
    expect(safeHref('/about')).toBe('/about');
    expect(safeHref('#top')).toBe('#top');
    expect(safeHref('mailto:a@b.co')).toBe('mailto:a@b.co');
    expect(safeHref('tel:+2348000000000')).toBe('tel:+2348000000000');
    expect(safeHref('https://example.com/x')).toBe('https://example.com/x');
    expect(safeHref('//evil.com')).toBeUndefined();
    expect(safeHref('javascript:alert(1)')).toBeUndefined();
    expect(safeSrc('/img/a.png')).toBe('/img/a.png');
    expect(safeSrc('mailto:a@b.co')).toBeUndefined();
    expect(safeSrc('//evil.com/a.png')).toBeUndefined();
  });
});

describe('SectionRenderer: empty states', () => {
  it.each([
    ['no sections', []],
    ['only non-object entries', [null, 1, 'x', []]],
    ['only unsupported blocks', [{ type: 'html', html: '<b>x</b>' }]],
  ])('%s => empty state', (_label, sections) => {
    expect(render(sections as unknown[])).toContain(EMPTY_STATE);
  });

  it('tolerates a non-array sections value', () => {
    expect(render('nope' as unknown as unknown[])).toContain(EMPTY_STATE);
  });
});
