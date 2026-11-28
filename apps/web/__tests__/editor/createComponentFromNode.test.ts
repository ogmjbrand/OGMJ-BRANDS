import { describe, expect, it } from 'vitest';
import { createComponentFromNode } from '@/lib/editor/createComponentFromNode';
import type { DocumentNode } from '@/lib/document-model/types';

describe('createComponentFromNode', () => {
  it('builds a definition with the given name, a fresh component id, and no slots/variants/propSchema', () => {
    const node: DocumentNode = { id: 'section-1', kind: 'section', children: [{ id: 'heading-1', kind: 'heading', text: 'Hi', level: 1 }] };
    const def = createComponentFromNode(node, 'My new section');
    expect(def.name).toBe('My new section');
    expect(def.id).not.toBe('section-1');
    expect(def.slots).toEqual([]);
    expect(def.variants).toEqual([]);
    expect(def.propSchema).toEqual([]);
  });

  it('clones the node into the template with fresh ids, leaving the original untouched', () => {
    const node: DocumentNode = {
      id: 'section-1',
      kind: 'section',
      children: [{ id: 'heading-1', kind: 'heading', text: 'Hi', level: 1 }],
    };
    const def = createComponentFromNode(node, 'My new section');
    const template = def.template as typeof node;
    expect(template.id).not.toBe('section-1');
    expect(template.children[0].id).not.toBe('heading-1');
    expect((template.children[0] as { text: string }).text).toBe('Hi');
    // original untouched
    expect(node.id).toBe('section-1');
    expect(node.children[0].id).toBe('heading-1');
  });

  it('preserves a nested componentInstance in the selection, including its slotContent', () => {
    const node: DocumentNode = {
      id: 'container-1',
      kind: 'container',
      children: [{ id: 'instance-1', kind: 'componentInstance', componentId: 'hero', slotContent: { body: [{ id: 'slot-text-1', kind: 'text', text: 'Slotted' }] } }],
    };
    const def = createComponentFromNode(node, 'Wrapper');
    const nestedInstance = (def.template as typeof node).children[0] as DocumentNode & { componentId: string; slotContent?: Record<string, DocumentNode[]> };
    expect(nestedInstance.componentId).toBe('hero');
    expect(nestedInstance.id).not.toBe('instance-1');
    expect(nestedInstance.slotContent?.body[0].id).not.toBe('slot-text-1');
  });
});
