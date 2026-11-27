import { describe, it, expect } from 'vitest';
import { findSlotNodes, cloneWithFreshIds, findNodeIncludingSlotDefaults } from '@/lib/editor/componentProps';
import type { DocumentNode } from '@/lib/document-model';

function container(id: string, children: DocumentNode[]): DocumentNode {
  return { id, kind: 'container', children };
}
function button(id: string, label: string, href: string): DocumentNode {
  return { id, kind: 'button', label, href };
}

describe('findSlotNodes', () => {
  it('finds every slot anywhere in a template, with its slotName', () => {
    const template = container('root', [
      { id: 'links-slot', kind: 'slot', slotName: 'links', defaultContent: [container('links-wrap', [button('l1', 'Home', '/')])] },
      container('nested', [{ id: 'plans-slot', kind: 'slot', slotName: 'plans', defaultContent: [] }]),
    ]);
    const slots = findSlotNodes(template);
    expect(slots.map((s) => s.slotName)).toEqual(['links', 'plans']);
    expect(slots[0].node.id).toBe('links-slot');
  });

  it('returns an empty list for a template with no slots', () => {
    expect(findSlotNodes(container('root', [button('b1', 'Go', '/')]))).toEqual([]);
  });

  it('does not descend into a slot node looking for nested slots', () => {
    // A slot's defaultContent is never itself slot-filled content -- a slot
    // node id appearing inside another slot's defaultContent shouldn't be
    // double-counted or crash the walk.
    const template = container('root', [
      { id: 'outer-slot', kind: 'slot', slotName: 'outer', defaultContent: [container('wrap', [button('b1', 'Go', '/')])] },
    ]);
    expect(findSlotNodes(template)).toHaveLength(1);
  });
});

describe('cloneWithFreshIds', () => {
  it('replaces the id of every node in the subtree with a fresh one', () => {
    const original = container('plan-1', [button('plan-1-cta', 'Choose', '/contact')]);
    const clone = cloneWithFreshIds(original);
    expect(clone.id).not.toBe('plan-1');
    expect(clone.kind).toBe('container');
    const children = (clone as { children: DocumentNode[] }).children;
    expect(children).toHaveLength(1);
    expect(children[0].id).not.toBe('plan-1-cta');
    expect((children[0] as { label: string }).label).toBe('Choose');
  });

  it("leaves a leaf node's own fields untouched other than its id", () => {
    const clone = cloneWithFreshIds(button('b1', 'Home', '/'));
    expect(clone).toMatchObject({ kind: 'button', label: 'Home', href: '/' });
    expect(clone.id).not.toBe('b1');
  });

  it('produces no id collisions across repeated clones (what insertNode checks for)', () => {
    const original = button('b1', 'Home', '/');
    const ids = new Set([cloneWithFreshIds(original).id, cloneWithFreshIds(original).id, cloneWithFreshIds(original).id]);
    expect(ids.size).toBe(3);
  });
});

describe('findNodeIncludingSlotDefaults (regression guard)', () => {
  it('still finds a node inside a slot default, unaffected by the new helpers', () => {
    const template = container('root', [
      { id: 'links-slot', kind: 'slot', slotName: 'links', defaultContent: [container('links-wrap', [button('l1', 'Home', '/')])] },
    ]);
    expect(findNodeIncludingSlotDefaults(template, 'l1')).toMatchObject({ id: 'l1', label: 'Home' });
  });
});
