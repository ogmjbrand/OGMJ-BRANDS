/**
 * OGMJ BRANDS — Preset reusable component library (Phase 3, Milestone A).
 *
 * Every definition below is a REAL `ComponentDefinition`: it has an actual
 * `template` built from existing document-model node kinds, and genuinely
 * renders through the same `DocumentRenderer`/`componentInstance` machinery
 * as everything else -- no screenshots, no decorative-only markup. These
 * ship into a new document's `components` map (see `withPresetComponents`
 * below) via the same `upsertComponent` operation the Components panel uses
 * to create a component by hand; there is nothing a preset can do that a
 * user-authored component can't.
 *
 * EDITABLE SURFACE: each `propSchema` entry's `name` is
 * `"<templateNodeId>__<field>"` (double underscore -- `propSchema[*].name`
 * must itself pass `isSafeIdentifier`, i.e. `schema.ts`'s `safeId`, whose
 * charset has no dot; see `parsePropSchemaName` in componentProps.ts),
 * e.g. `"hero-heading__text"`. The Components-aware Inspector UI parses
 * this back into `{ nodeId, field }` and writes via
 * `editor.apply({ op: 'updateNodeProps', nodeId: instanceId, path:
 * ['propOverrides', nodeId, field], value })` -- the SAME `propOverrides`
 * shape `DocumentRenderer.tsx`'s `resolveComponentInstance` already
 * resolves (variant overrides first, instance overrides on top; see its
 * doc comment). A `name` is never free-form here: every one of these
 * strings is a developer-authored literal pointing at a real node in that
 * same definition's `template`, never user input, so there is no
 * path-traversal surface even though `updateNodeProps`' path segments are
 * validated anyway (see `setNodeProp` in tree.ts).
 *
 * LAYOUT HONESTY: `DocumentRenderer.tsx`'s CSS property surface today is
 * width/height/padding/margin/background/color/display/flexDirection/gap/
 * align/justify/textAlign/borderRadius -- there is no grid-column-count
 * property. Multi-column layouts here (feature grid, pricing, FAQ) use
 * flexbox rows with each column's own `Responsive<string>` width (stacked
 * full-width on mobile, a fraction on larger breakpoints), which the
 * existing breakpoint system already supports -- not a new capability.
 *
 * FORMS: the document model has no `form`/`input` node kind (schema change
 * + a submission backend + real validation, all out of scope for this
 * pass -- see the Phase 3 final report). The "Contact" preset below is
 * therefore built from heading/text/button only, with a `mailto:` CTA
 * (an allowed scheme per `safeHref`) rather than a non-functional fake
 * form.
 */
import type { ComponentDefinition, ComponentPropDef, DocumentNode, DocumentRoot } from '@/lib/document-model/types';

/**
 * `propSchema[*].name` must pass `isSafeIdentifier` (schema.ts's `safeId`),
 * whose allowlist charset is `[A-Za-z0-9_-]` -- no dot. So the
 * node-id/field pairing this file documents is encoded as
 * `"<nodeId>__<field>"` (double underscore), split back apart by
 * `parsePropSchemaName` in componentProps.ts. Every node id in this file
 * uses hyphens only, never a double underscore, so the split is
 * unambiguous.
 */
const prop = (nodeId: string, field: string, type: ComponentPropDef['type'], def?: unknown): ComponentPropDef => ({
  name: `${nodeId}__${field}`,
  type,
  default: def,
});

function heading(id: string, text: string, level: 1 | 2 | 3 | 4 | 5 | 6, style?: Record<string, unknown>): DocumentNode {
  return { id, kind: 'heading', text, level, ...(style ? { style } : {}) } as DocumentNode;
}
function textNode(id: string, text: string, style?: Record<string, unknown>): DocumentNode {
  return { id, kind: 'text', text, ...(style ? { style } : {}) } as DocumentNode;
}
function button(id: string, label: string, href: string, variant: 'primary' | 'secondary' | 'ghost', style?: Record<string, unknown>): DocumentNode {
  return { id, kind: 'button', label, href, variant, ...(style ? { style } : {}) } as DocumentNode;
}
function box(id: string, kind: 'container' | 'section', children: DocumentNode[], style?: Record<string, unknown>): DocumentNode {
  return { id, kind, children, ...(style ? { style } : {}) } as DocumentNode;
}

const colorToken = (key: string) => ({ token: `colors.${key}` });

// ================================
// 1. NAVBAR
// ================================
const navbar: ComponentDefinition = {
  id: 'navbar',
  name: 'Navbar',
  propSchema: [prop('navbar-logo', 'text', 'string', 'Brand'), prop('navbar-link-1', 'label', 'string', 'Home'), prop('navbar-link-1', 'href', 'string', '/')],
  slots: ['links'],
  variants: [
    { id: 'solid', name: 'Solid background', propOverrides: { 'navbar-bar': { style: { background: colorToken('background') } } } },
  ],
  template: box('navbar-bar', 'section', [
    heading('navbar-logo', 'Brand', 3, { color: colorToken('foreground') }),
    { id: 'navbar-links-slot', kind: 'slot', slotName: 'links', defaultContent: [
      box('navbar-links', 'container', [
        button('navbar-link-1', 'Home', '/', 'ghost'),
        button('navbar-link-2', 'About', '/about', 'ghost'),
        button('navbar-link-3', 'Contact', '/contact', 'ghost'),
      ], { display: 'flex', flexDirection: 'row', gap: '1.5rem' }),
    ] },
  ], {
    display: 'flex',
    flexDirection: 'row',
    justify: 'between',
    align: 'center',
    padding: { base: '1rem', lg: '1.5rem' },
    background: 'rgba(0,0,0,0)',
  }),
};

// ================================
// 2. FOOTER
// ================================
const footer: ComponentDefinition = {
  id: 'footer',
  name: 'Footer',
  propSchema: [prop('footer-brand', 'text', 'string', 'Brand'), prop('footer-copyright', 'text', 'string', '© 2026 Brand. All rights reserved.')],
  slots: ['links'],
  variants: [
    { id: 'dark', name: 'Dark', propOverrides: { 'footer-bar': { style: { background: colorToken('background') } } } },
  ],
  template: box('footer-bar', 'section', [
    box('footer-top', 'container', [
      heading('footer-brand', 'Brand', 4, { color: colorToken('foreground') }),
      textNode('footer-copyright', '© 2026 Brand. All rights reserved.', { color: colorToken('foreground.muted') }),
    ], { display: 'flex', flexDirection: 'column', gap: '0.5rem' }),
    { id: 'footer-links-slot', kind: 'slot', slotName: 'links', defaultContent: [
      box('footer-links', 'container', [
        button('footer-link-1', 'Privacy', '/privacy', 'ghost'),
        button('footer-link-2', 'Terms', '/terms', 'ghost'),
        button('footer-link-3', 'Contact', '/contact', 'ghost'),
      ], { display: 'flex', flexDirection: 'row', gap: '1rem' }),
    ] },
  ], {
    display: 'flex',
    flexDirection: { base: 'column', md: 'row' },
    justify: 'between',
    align: { base: 'start', md: 'center' },
    gap: '1.5rem',
    padding: { base: '2rem', lg: '2.5rem' },
  }),
};

// ================================
// 3. HERO
// ================================
const hero: ComponentDefinition = {
  id: 'hero',
  name: 'Hero',
  propSchema: [
    prop('hero-eyebrow', 'text', 'string', 'Introducing'),
    prop('hero-heading', 'text', 'string', 'A headline that sells the vision'),
    prop('hero-subheading', 'text', 'string', 'One clear sentence about the value you deliver.'),
    prop('hero-cta', 'label', 'string', 'Get started'),
    prop('hero-cta', 'href', 'string', '/contact'),
  ],
  slots: [],
  variants: [
    {
      id: 'left-aligned',
      name: 'Left aligned',
      propOverrides: { 'hero-section': { style: { textAlign: 'left', align: 'start' } } },
    },
  ],
  template: box('hero-section', 'section', [
    textNode('hero-eyebrow', 'Introducing', { color: colorToken('brand.primary'), textAlign: 'center' }),
    heading('hero-heading', 'A headline that sells the vision', 1, { textAlign: 'center', color: colorToken('foreground') }),
    textNode('hero-subheading', 'One clear sentence about the value you deliver.', { textAlign: 'center', color: colorToken('foreground.muted') }),
    button('hero-cta', 'Get started', '/contact', 'primary'),
  ], {
    display: 'flex',
    flexDirection: 'column',
    align: 'center',
    textAlign: 'center',
    gap: '1.25rem',
    padding: { base: '3rem', lg: '6rem' },
  }),
};

// ================================
// 4. FEATURE GRID
// ================================
function featureColumn(n: 1 | 2 | 3, heading_: string, body: string): DocumentNode {
  return box(`feature-${n}`, 'container', [
    heading(`feature-${n}-heading`, heading_, 3, { color: colorToken('foreground') }),
    textNode(`feature-${n}-text`, body, { color: colorToken('foreground.muted') }),
  ], { display: 'flex', flexDirection: 'column', gap: '0.5rem', width: { base: '100%', md: '31%' } });
}
const featureGrid: ComponentDefinition = {
  id: 'feature-grid',
  name: 'Feature grid',
  propSchema: [
    prop('feature-grid-heading', 'text', 'string', 'Why choose us'),
    prop('feature-1-heading', 'text', 'string', 'Fast'),
    prop('feature-2-heading', 'text', 'string', 'Reliable'),
    prop('feature-3-heading', 'text', 'string', 'Secure'),
  ],
  slots: ['features'],
  variants: [],
  template: box('feature-grid-section', 'section', [
    heading('feature-grid-heading', 'Why choose us', 2, { textAlign: 'center', color: colorToken('foreground') }),
    { id: 'feature-grid-slot', kind: 'slot', slotName: 'features', defaultContent: [
      box('feature-grid-row', 'container', [
        featureColumn(1, 'Fast', 'Built for speed from day one.'),
        featureColumn(2, 'Reliable', 'Uptime you can build a business on.'),
        featureColumn(3, 'Secure', 'Your data, protected by default.'),
      ], { display: 'flex', flexDirection: { base: 'column', md: 'row' }, gap: '2rem', justify: 'between' }),
    ] },
  ], { display: 'flex', flexDirection: 'column', gap: '2rem', padding: { base: '3rem', lg: '4rem' } }),
};

// ================================
// 5. PRICING
// ================================
function pricingPlan(n: 1 | 2 | 3, name: string, price: string, highlight = false): DocumentNode {
  return box(`plan-${n}`, 'container', [
    heading(`plan-${n}-name`, name, 3, { color: colorToken('foreground') }),
    textNode(`plan-${n}-price`, price, { color: colorToken('brand.primary') }),
    textNode(`plan-${n}-desc`, 'Everything you need to get started.', { color: colorToken('foreground.muted') }),
    button(`plan-${n}-cta`, 'Choose plan', '/contact', highlight ? 'primary' : 'secondary'),
  ], {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: { base: '100%', md: '31%' },
    padding: '1.5rem',
    borderRadius: '1rem',
    background: highlight ? colorToken('background') : 'rgba(255,255,255,0.03)',
  });
}
const pricing: ComponentDefinition = {
  id: 'pricing',
  name: 'Pricing',
  propSchema: [
    prop('plan-1-name', 'text', 'string', 'Starter'),
    prop('plan-1-price', 'text', 'string', '$19/mo'),
    prop('plan-2-name', 'text', 'string', 'Growth'),
    prop('plan-2-price', 'text', 'string', '$49/mo'),
    prop('plan-3-name', 'text', 'string', 'Scale'),
    prop('plan-3-price', 'text', 'string', '$99/mo'),
  ],
  slots: ['plans'],
  variants: [
    { id: 'highlight-middle', name: 'Highlight middle plan', propOverrides: { 'plan-2': { style: { background: colorToken('background') } }, 'plan-2-cta': { variant: 'primary' } } },
  ],
  template: box('pricing-section', 'section', [
    heading('pricing-heading', 'Simple pricing', 2, { textAlign: 'center', color: colorToken('foreground') }),
    { id: 'pricing-slot', kind: 'slot', slotName: 'plans', defaultContent: [
      box('pricing-row', 'container', [pricingPlan(1, 'Starter', '$19/mo'), pricingPlan(2, 'Growth', '$49/mo'), pricingPlan(3, 'Scale', '$99/mo')], {
        display: 'flex', flexDirection: { base: 'column', md: 'row' }, gap: '1.5rem', justify: 'between',
      }),
    ] },
  ], { display: 'flex', flexDirection: 'column', gap: '2rem', padding: { base: '3rem', lg: '4rem' } }),
};

// ================================
// 6. TESTIMONIAL
// ================================
const testimonial: ComponentDefinition = {
  id: 'testimonial',
  name: 'Testimonial',
  propSchema: [
    prop('testimonial-quote', 'text', 'string', '"This completely changed how we work."'),
    prop('testimonial-author', 'text', 'string', 'Jordan Rivera'),
    prop('testimonial-role', 'text', 'string', 'CEO, Example Co.'),
  ],
  slots: [],
  variants: [
    { id: 'card', name: 'Card', propOverrides: { 'testimonial-box': { style: { background: 'rgba(255,255,255,0.04)', borderRadius: '1rem', padding: '2rem' } } } },
  ],
  template: box('testimonial-box', 'container', [
    textNode('testimonial-quote', '"This completely changed how we work."', { textAlign: 'center', color: colorToken('foreground') }),
    heading('testimonial-author', 'Jordan Rivera', 4, { textAlign: 'center', color: colorToken('foreground') }),
    textNode('testimonial-role', 'CEO, Example Co.', { textAlign: 'center', color: colorToken('foreground.muted') }),
  ], { display: 'flex', flexDirection: 'column', gap: '0.75rem', align: 'center', padding: { base: '2rem', lg: '3rem' } }),
};

// ================================
// 7. FAQ
// ================================
function faqItem(n: 1 | 2 | 3, q: string, a: string): DocumentNode {
  return box(`faq-${n}`, 'container', [
    heading(`faq-${n}-q`, q, 4, { color: colorToken('foreground') }),
    textNode(`faq-${n}-a`, a, { color: colorToken('foreground.muted') }),
  ], { display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' });
}
const faq: ComponentDefinition = {
  id: 'faq',
  name: 'FAQ',
  propSchema: [
    prop('faq-1-q', 'text', 'string', 'How does billing work?'),
    prop('faq-1-a', 'text', 'string', 'You are billed monthly, cancel anytime.'),
  ],
  slots: ['items'],
  variants: [],
  template: box('faq-section', 'section', [
    heading('faq-heading', 'Frequently asked questions', 2, { textAlign: 'center', color: colorToken('foreground') }),
    { id: 'faq-slot', kind: 'slot', slotName: 'items', defaultContent: [
      box('faq-list', 'container', [
        faqItem(1, 'How does billing work?', 'You are billed monthly, cancel anytime.'),
        faqItem(2, 'Do you offer support?', 'Yes, every plan includes email support.'),
        faqItem(3, 'Can I change plans later?', 'Yes, upgrade or downgrade at any time.'),
      ], { display: 'flex', flexDirection: 'column', gap: '0.5rem' }),
    ] },
  ], { display: 'flex', flexDirection: 'column', gap: '2rem', padding: { base: '3rem', lg: '4rem' } }),
};

// ================================
// 8. CTA
// ================================
const cta: ComponentDefinition = {
  id: 'cta',
  name: 'Call to action',
  propSchema: [
    prop('cta-heading', 'text', 'string', 'Ready to get started?'),
    prop('cta-text', 'text', 'string', 'Join hundreds of businesses already growing with us.'),
    prop('cta-button', 'label', 'string', 'Get started'),
    prop('cta-button', 'href', 'string', '/contact'),
  ],
  slots: [],
  variants: [
    { id: 'accent', name: 'Accent background', propOverrides: { 'cta-section': { style: { background: colorToken('brand.primary') } }, 'cta-heading': { style: { color: colorToken('brand.onPrimary') } }, 'cta-text': { style: { color: colorToken('brand.onPrimary') } } } },
  ],
  template: box('cta-section', 'section', [
    heading('cta-heading', 'Ready to get started?', 2, { textAlign: 'center', color: colorToken('foreground') }),
    textNode('cta-text', 'Join hundreds of businesses already growing with us.', { textAlign: 'center', color: colorToken('foreground.muted') }),
    button('cta-button', 'Get started', '/contact', 'primary'),
  ], { display: 'flex', flexDirection: 'column', align: 'center', gap: '1.25rem', padding: { base: '3rem', lg: '4rem' }, borderRadius: '1rem' }),
};

// ================================
// 9. CONTACT
// ================================
const contact: ComponentDefinition = {
  id: 'contact',
  name: 'Contact',
  propSchema: [
    prop('contact-heading', 'text', 'string', 'Get in touch'),
    prop('contact-text', 'text', 'string', 'Questions? We would love to hear from you.'),
    prop('contact-email-button', 'label', 'string', 'Email us'),
    prop('contact-email-button', 'href', 'string', 'mailto:hello@example.com'),
  ],
  slots: [],
  variants: [],
  template: box('contact-section', 'section', [
    heading('contact-heading', 'Get in touch', 2, { textAlign: 'center', color: colorToken('foreground') }),
    textNode('contact-text', 'Questions? We would love to hear from you.', { textAlign: 'center', color: colorToken('foreground.muted') }),
    button('contact-email-button', 'Email us', 'mailto:hello@example.com', 'primary'),
  ], { display: 'flex', flexDirection: 'column', align: 'center', gap: '1rem', padding: { base: '3rem', lg: '4rem' } }),
};

export const PRESET_COMPONENTS: ComponentDefinition[] = [navbar, footer, hero, featureGrid, pricing, testimonial, faq, cta, contact];

/** Returns `document` with every preset registered under `document.components`, without touching anything else -- used when seeding a brand-new page/site. */
export function withPresetComponents(document: DocumentRoot): DocumentRoot {
  const components = { ...document.components };
  for (const def of PRESET_COMPONENTS) components[def.id] = def;
  return { ...document, components };
}
