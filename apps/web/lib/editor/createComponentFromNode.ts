/**
 * Turns an arbitrary selected subtree into a brand-new, reusable
 * `ComponentDefinition` -- the one way a component can come into existence
 * today is `ComponentsPanel.tsx` seeding `PRESET_COMPONENTS` or duplicating
 * an already-existing definition (see its own module doc comment); neither
 * covers "I built this section on the canvas, now make it reusable."
 *
 * The definition starts with no slots/variants/propSchema -- those are
 * authored afterward (slots via the Inspector's per-slot editing, variants
 * and propSchema via the component editing flow), same as a freshly loaded
 * preset before anyone has touched it.
 */
import { freshNodeId } from './createDefaultNode';
import { cloneNodeWithFreshIds } from './duplicateNode';
import type { ComponentDefinition, DocumentNode } from '@/lib/document-model/types';

export function createComponentFromNode(node: DocumentNode, name: string): ComponentDefinition {
  return {
    id: freshNodeId('component'),
    name,
    propSchema: [],
    slots: [],
    variants: [],
    template: cloneNodeWithFreshIds(node),
  };
}
