import { describe, expect, it } from 'vitest';
import { DocumentOperationError, findNode, insertNode, moveNode } from '@/lib/document-model/tree';
import { DEFAULT_BREAKPOINTS, DEFAULT_TOKEN_SET } from '@/lib/document-model/tokens';
import type { DocumentRoot, RootNode } from '@/lib/document-model/types';

function baseRoot(): RootNode {
  return {
    id: 'root',
    kind: 'root',
    children: [
      { id: 'section-1', kind: 'section', children: [{ id: 'heading-1', kind: 'heading', text: 'Hi', level: 2 }] },
      { id: 'instance-1', kind: 'componentInstance', componentId: 'callout' },
      { id: 'leaf-1', kind: 'text', text: 'leaf' },
    ],
  };
}

describe('insertNode: never silently discards a node', () => {
  it('throws, and leaves the original tree untouched, when the target parent does not exist', () => {
    const root = baseRoot();
    expect(() => insertNode(root, 'does-not-exist', 0, { id: 'new', kind: 'text', text: 'x' })).toThrow(DocumentOperationError);
    expect(findNode(root, 'new')).toBeNull(); // original untouched
  });

  it('throws, and leaves the original tree untouched, when the target cannot hold children (componentInstance)', () => {
    const root = baseRoot();
    expect(() => insertNode(root, 'instance-1', 0, { id: 'new', kind: 'text', text: 'x' })).toThrow(DocumentOperationError);
    expect(findNode(root, 'new')).toBeNull();
    // The node that failed to receive a child is itself unmodified.
    expect(findNode(root, 'instance-1')).toEqual({ id: 'instance-1', kind: 'componentInstance', componentId: 'callout' });
  });

  it('throws, and leaves the original tree untouched, when the target cannot hold children (a leaf text node)', () => {
    const root = baseRoot();
    expect(() => insertNode(root, 'leaf-1', 0, { id: 'new', kind: 'text', text: 'x' })).toThrow(DocumentOperationError);
    expect(findNode(root, 'new')).toBeNull();
  });

  it('throws, and leaves the original tree untouched, when inserting a node whose id already exists elsewhere', () => {
    const root = baseRoot();
    expect(() => insertNode(root, 'root', 0, { id: 'heading-1', kind: 'text', text: 'duplicate' })).toThrow(DocumentOperationError);
    // The original heading-1 (a heading, not the attempted duplicate text node) is untouched.
    expect(findNode(root, 'heading-1')).toMatchObject({ kind: 'heading', text: 'Hi' });
  });

  it('throws when inserting a subtree that contains a duplicate id nested inside it, not just at its own root', () => {
    const root = baseRoot();
    const incoming = { id: 'new-container', kind: 'container' as const, children: [{ id: 'heading-1', kind: 'heading' as const, text: 'dup', level: 1 as const }] };
    expect(() => insertNode(root, 'root', 0, incoming)).toThrow(DocumentOperationError);
    expect(findNode(root, 'new-container')).toBeNull();
  });

  it('succeeds into every valid container kind: root, section, container, custom', () => {
    const root = baseRoot();
    const afterRoot = insertNode(root, 'root', 0, { id: 'a', kind: 'text', text: 'a' });
    expect(findNode(afterRoot, 'a')).not.toBeNull();

    const afterSection = insertNode(root, 'section-1', 0, { id: 'b', kind: 'text', text: 'b' });
    expect(findNode(afterSection, 'b')).not.toBeNull();

    const rootWithCustom = insertNode(root, 'root', 0, { id: 'custom-1', kind: 'custom', customType: 'x', props: {}, children: [] });
    const afterCustom = insertNode(rootWithCustom, 'custom-1', 0, { id: 'c', kind: 'text', text: 'c' });
    expect(findNode(afterCustom, 'c')).not.toBeNull();
  });
});

describe('moveNode: cannot create circular references or duplicate ids, never silently discards', () => {
  it('throws when moving a node to be its own parent (self-reference)', () => {
    const root = baseRoot();
    expect(() => moveNode(root, 'section-1', 'section-1', 0)).toThrow(DocumentOperationError);
    expect(findNode(root, 'section-1')).not.toBeNull(); // still there, unmodified
  });

  it('throws when moving a node into one of its own descendants (would create a cycle)', () => {
    const root = baseRoot();
    // section-1's only child is heading-1 -- moving section-1 INTO heading-1 would make
    // section-1 both an ancestor and (if it succeeded) a descendant of itself.
    expect(() => moveNode(root, 'section-1', 'heading-1', 0)).toThrow(DocumentOperationError);
    expect(findNode(root, 'section-1')).not.toBeNull();
    expect(findNode(root, 'heading-1')).not.toBeNull();
  });

  it('throws, and leaves the original tree completely untouched, when the new parent cannot hold children', () => {
    const root = baseRoot();
    expect(() => moveNode(root, 'leaf-1', 'instance-1', 0)).toThrow(DocumentOperationError);
    // This is the exact scenario that used to silently delete the node (see
    // the Phase 1 review): confirm it's still fully present at its original location.
    expect(findNode(root, 'leaf-1')).toEqual({ id: 'leaf-1', kind: 'text', text: 'leaf' });
    expect(root.children.some((c) => c.id === 'leaf-1')).toBe(true);
  });

  it('throws when the node to move does not exist', () => {
    const root = baseRoot();
    expect(() => moveNode(root, 'does-not-exist', 'root', 0)).toThrow(DocumentOperationError);
  });

  it('throws when the target parent does not exist', () => {
    const root = baseRoot();
    expect(() => moveNode(root, 'leaf-1', 'does-not-exist', 0)).toThrow(DocumentOperationError);
    expect(findNode(root, 'leaf-1')).not.toBeNull();
  });

  it('succeeds for a valid move between two real containers, preserving the moved node exactly', () => {
    const root = baseRoot();
    const moved = moveNode(root, 'leaf-1', 'section-1', 0);
    expect(findNode(moved, 'leaf-1')).toEqual({ id: 'leaf-1', kind: 'text', text: 'leaf' });
    const section = findNode(moved, 'section-1') as { children: Array<{ id: string }> };
    expect(section.children[0].id).toBe('leaf-1');
    expect(moved.children.some((c) => c.id === 'leaf-1')).toBe(false); // removed from its old location
  });
});

describe('component-instance insertion and movement specifically', () => {
  it('a componentInstance CAN be inserted as a child of a container (it just cannot itself receive children via insertNode)', () => {
    const root = baseRoot();
    const next = insertNode(root, 'root', 0, { id: 'instance-2', kind: 'componentInstance', componentId: 'callout' });
    expect(findNode(next, 'instance-2')).not.toBeNull();
  });

  it('a componentInstance can be moved between containers like any other node', () => {
    const root = baseRoot();
    const moved = moveNode(root, 'instance-1', 'section-1', 0);
    const section = findNode(moved, 'section-1') as { children: Array<{ id: string }> };
    expect(section.children.map((c) => c.id)).toContain('instance-1');
  });
});

describe('end-to-end with a full DocumentRoot (not just a bare RootNode)', () => {
  it('a failed insertNode/moveNode never mutates the surrounding DocumentRoot either', () => {
    const document: DocumentRoot = {
      root: baseRoot(),
      tokenSetId: DEFAULT_TOKEN_SET.id,
      breakpoints: DEFAULT_BREAKPOINTS,
      components: { callout: { id: 'callout', name: 'Callout', propSchema: [], slots: [], variants: [], template: { id: 'tpl', kind: 'container', children: [] } } },
      assets: {},
    };
    const before = structuredClone(document);
    expect(() => insertNode(document.root, 'instance-1', 0, { id: 'x', kind: 'text', text: 'x' })).toThrow();
    expect(document).toEqual(before);
  });
});
