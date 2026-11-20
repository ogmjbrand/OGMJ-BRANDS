import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PRESET_COMPONENTS, withPresetComponents } from '@/lib/editor/presetComponents';
import { parsePropSchemaName } from '@/lib/editor/componentProps';
import { validateDocument } from '@/lib/document-model/schema';
import { getChildren, getNodeProp } from '@/lib/document-model';
import { setNodeProp } from '@/lib/document-model/tree';
import { DocumentRenderer } from '@/components/document/DocumentRenderer';
import { DEFAULT_BREAKPOINTS, DEFAULT_TOKEN_SET } from '@/lib/document-model/tokens';
import type { ComponentInstanceNode, DocumentNode, DocumentRoot } from '@/lib/document-model/types';

/** Like `walk`, but also descends into a slot's own `defaultContent` -- `getChildren` deliberately doesn't (see DocumentRenderer.tsx's `childrenForTraversal`), since that's a container-mutation concern, not a "does this id exist anywhere in the template" one. */
function walkIncludingSlotDefaults(node: DocumentNode): DocumentNode[] {
  const out: DocumentNode[] = [node];
  const children = node.kind === 'slot' ? node.defaultContent ?? [] : getChildren(node) ?? [];
  for (const child of children) out.push(...walkIncludingSlotDefaults(child));
  return out;
}

function emptyDocument(): DocumentRoot {
  return {
    root: { id: 'root', kind: 'root', children: [] },
    tokenSetId: DEFAULT_TOKEN_SET.id,
    breakpoints: DEFAULT_BREAKPOINTS,
    components: {},
    assets: {},
  };
}

describe('preset component library', () => {
  it('ships at least 9 distinct, real preset components', () => {
    expect(PRESET_COMPONENTS.length).toBeGreaterThanOrEqual(9);
    expect(new Set(PRESET_COMPONENTS.map((c) => c.id)).size).toBe(PRESET_COMPONENTS.length);
  });

  it('withPresetComponents registers every preset without touching the rest of the document', () => {
    const doc = emptyDocument();
    const next = withPresetComponents(doc);
    expect(Object.keys(next.components).sort()).toEqual(PRESET_COMPONENTS.map((c) => c.id).sort());
    expect(next.root).toBe(doc.root); // unrelated parts of the document are untouched (same reference)
  });

  it('every preset passes full document-model schema validation (propSchema names, node ids, CSS values, hrefs -- everything)', () => {
    const doc = withPresetComponents(emptyDocument());
    const result = validateDocument(doc);
    if (!result.success) {
      throw new Error(`Preset components failed schema validation:\n${result.errors.join('\n')}`);
    }
  });

  it('every propSchema name parses back to a nodeId/field pair that actually resolves inside that component\'s own template', () => {
    for (const def of PRESET_COMPONENTS) {
      for (const propDef of def.propSchema) {
        const parsed = parsePropSchemaName(propDef.name);
        expect(parsed, `"${def.id}" propSchema entry "${propDef.name}" must parse`).not.toBeNull();
        const nodeIds = new Set(walkIncludingSlotDefaults(def.template).map((n) => n.id));
        expect(nodeIds.has(parsed!.nodeId), `"${def.id}": propSchema targets node "${parsed!.nodeId}", which is not in its own template`).toBe(true);
      }
    }
  });

  it('every preset genuinely renders real content (not a placeholder/blank), and every variant renders without throwing', () => {
    for (const def of PRESET_COMPONENTS) {
      const doc = withPresetComponents(emptyDocument());
      const instanceId = `instance-${def.id}`;
      const instance: ComponentInstanceNode = { id: instanceId, kind: 'componentInstance', componentId: def.id };
      doc.root.children.push(instance);
      const html = renderToStaticMarkup(createElement(DocumentRenderer, { document: doc, tokenSet: DEFAULT_TOKEN_SET }));
      expect(html).toContain(`data-component="${def.id}"`);
      expect(html).not.toContain('data-ogmj-missing-component');
      expect(html.length).toBeGreaterThan(200); // real markup, not an empty shell

      for (const variant of def.variants) {
        const variantDoc = withPresetComponents(emptyDocument());
        variantDoc.root.children.push({ ...instance, variantId: variant.id });
        expect(() => renderToStaticMarkup(createElement(DocumentRenderer, { document: variantDoc, tokenSet: DEFAULT_TOKEN_SET }))).not.toThrow();
      }
    }
  });

  it('editing a propSchema-described field via updateNodeProps on a real instance changes the rendered output', () => {
    const doc = withPresetComponents(emptyDocument());
    const propDef = PRESET_COMPONENTS.find((c) => c.id === 'hero')!.propSchema.find((p) => p.name === 'hero-heading__text')!;
    const parsed = parsePropSchemaName(propDef.name)!;
    const instance: ComponentInstanceNode = { id: 'hero-instance', kind: 'componentInstance', componentId: 'hero' };
    doc.root.children.push(instance);

    const before = renderToStaticMarkup(createElement(DocumentRenderer, { document: doc, tokenSet: DEFAULT_TOKEN_SET }));
    expect(before).toContain('A headline that sells the vision');

    const patched = setNodeProp(instance, ['propOverrides', parsed.nodeId, parsed.field], 'Totally custom headline');
    doc.root.children[0] = patched;
    const after = renderToStaticMarkup(createElement(DocumentRenderer, { document: doc, tokenSet: DEFAULT_TOKEN_SET }));
    expect(after).toContain('Totally custom headline');
    expect(after).not.toContain('A headline that sells the vision');
    expect(getNodeProp(patched, ['propOverrides', parsed.nodeId, parsed.field])).toBe('Totally custom headline');
  });

  it('the contact preset uses a real mailto: CTA rather than a non-functional fake form', () => {
    const contact = PRESET_COMPONENTS.find((c) => c.id === 'contact')!;
    const button = walkIncludingSlotDefaults(contact.template).find((n) => n.kind === 'button') as { href: string } | undefined;
    expect(button?.href.startsWith('mailto:')).toBe(true);
  });
});
