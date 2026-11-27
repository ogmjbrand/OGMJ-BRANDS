'use client';

/**
 * Every field here edits through `editor.apply({ op: 'updateNodeProps', ... })`
 * -- there is no other way this component touches the document, so every
 * inspector edit is undoable exactly like a canvas edit.
 *
 * Style fields that are `Responsive<T>` (width/height/padding/margin/
 * display/flexDirection/gap/align/justify/textAlign) read and write the
 * CURRENTLY SELECTED VIEWPORT's override specifically, via
 * `readResponsive`/`writeResponsive` -- so the viewport switcher isn't just
 * a preview, it changes which breakpoint you're editing. Fields that are a
 * plain `StyleValue<T>` (background/color/borderRadius) aren't responsive
 * in the schema, so they're edited as one value regardless of viewport.
 */
import { useEffect, useRef, useState } from 'react';
import {
  findNode,
  safeObjectLookup,
  getChildren,
  canHaveChildren,
  updateNode,
  removeNode,
  insertNode,
  moveNode,
  type DocumentNode,
  type RootNode,
} from '@/lib/document-model';
import { readResponsive, writeResponsive } from '@/lib/editor/responsiveValue';
import type { DocumentEditor } from '@/lib/editor/useDocumentEditor';
import { VIEWPORTS } from '@/lib/editor/useDocumentEditor';
import { AssetPicker } from './AssetPicker';
import { freshNodeId } from '@/lib/editor/createDefaultNode';
import { cloneNodeWithFreshIds } from '@/lib/editor/duplicateNode';
import { findNodeIncludingSlotDefaults, findSlotNodes, friendlyPropLabel, parsePropSchemaName } from '@/lib/editor/componentProps';
import type { ComponentInstanceNode } from '@/lib/document-model/types';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] uppercase tracking-wide text-[#9a9a9a]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-md border border-[#D4AF37]/20 bg-[#121212] px-2.5 py-1.5 text-sm text-[#F0F0F0] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40';

/**
 * Commits on blur (and Enter, for single-line fields) rather than on every
 * keystroke -- dispatching an `updateNodeProps` operation per character
 * would flood undo history with one entry per keystroke instead of one
 * coherent edit. The local draft resyncs from the external `value` when it
 * changes while the field is NOT focused (e.g. after an undo), so this
 * never shows stale text, but never clobbers what's mid-typing either.
 */
export function TextField({ value, onChange, textarea }: { value: string; onChange: (v: string) => void; textarea?: boolean }) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  function commit() {
    if (draft !== value) onChange(draft);
  }

  const shared = {
    className: inputClass,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onFocus: () => {
      focused.current = true;
    },
    onBlur: () => {
      focused.current = false;
      commit();
    },
  };

  if (textarea) {
    return <textarea rows={3} {...shared} />;
  }
  return (
    <input
      type="text"
      {...shared}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

function SelectField({ value, options, onChange }: { value: string; options: Array<{ value: string; label: string }>; onChange: (v: string) => void }) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function asPlainString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'token' in (value as Record<string, unknown>)) {
    return `token: ${(value as { token: string }).token}`;
  }
  return '';
}

export function Inspector({ editor, businessId }: { editor: DocumentEditor; businessId: string }) {
  const node = editor.selectedNodeId ? findNode(editor.document.root, editor.selectedNodeId) : null;

  if (!node) {
    return <div className="p-4 text-sm text-[#7a7a7a]">Select an element on the canvas or in the layer tree to edit it.</div>;
  }

  function setProp(path: string[], value: unknown) {
    editor.apply({ op: 'updateNodeProps', nodeId: node!.id, path, value });
  }

  const style = (node as { style?: Record<string, unknown> }).style ?? {};
  const viewport = editor.viewport;

  function responsiveField(key: string, label: string) {
    const current = readResponsive(style[key] as never, viewport) ?? '';
    return (
      <Field key={key} label={`${label} (${VIEWPORTS.find((v) => v.key === viewport)?.label})`}>
        <TextField value={String(current ?? '')} onChange={(v) => setProp(['style', key], writeResponsive(style[key] as never, viewport, v))} />
      </Field>
    );
  }

  function plainStyleField(key: string, label: string) {
    return (
      <Field key={key} label={label}>
        <TextField value={asPlainString(style[key])} onChange={(v) => setProp(['style', key], v)} />
      </Field>
    );
  }

  return (
    <div className="space-y-5 overflow-y-auto p-4 text-sm">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded bg-[#D4AF37]/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-[#D4AF37]">{node.kind}</span>
          <span className="truncate text-xs text-[#6b6b6b]">{node.id}</span>
        </div>
      </div>

      <KindFields node={node} setProp={setProp} editor={editor} businessId={businessId} />

      <div className="space-y-3 border-t border-white/5 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]/80">Layout &amp; Style</h3>
        {responsiveField('width', 'Width')}
        {responsiveField('height', 'Height')}
        {responsiveField('padding', 'Padding')}
        {responsiveField('margin', 'Margin')}
        {responsiveField('gap', 'Gap')}
        <Field label="Display">
          <SelectField
            value={String(readResponsive(style.display as never, viewport) ?? 'block')}
            options={[
              { value: 'block', label: 'Block' },
              { value: 'flex', label: 'Flex' },
              { value: 'grid', label: 'Grid' },
              { value: 'none', label: 'None (hidden)' },
            ]}
            onChange={(v) => setProp(['style', 'display'], writeResponsive(style.display as never, viewport, v))}
          />
        </Field>
        <Field label="Text align">
          <SelectField
            value={String(readResponsive(style.textAlign as never, viewport) ?? 'left')}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
            onChange={(v) => setProp(['style', 'textAlign'], writeResponsive(style.textAlign as never, viewport, v))}
          />
        </Field>
        {plainStyleField('background', 'Background color')}
        {plainStyleField('color', 'Text color')}
        {plainStyleField('borderRadius', 'Corner radius')}
      </div>

      <div className="space-y-3 border-t border-white/5 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]/80">Accessibility</h3>
        <Field label="A11y label">
          <TextField value={(node as { a11yLabel?: string }).a11yLabel ?? ''} onChange={(v) => setProp(['a11yLabel'], v || undefined)} />
        </Field>
      </div>
    </div>
  );
}

function KindFields({
  node,
  setProp,
  editor,
  businessId,
}: {
  node: DocumentNode;
  setProp: (path: string[], value: unknown) => void;
  editor: DocumentEditor;
  businessId: string;
}) {
  switch (node.kind) {
    case 'heading':
      return (
        <div className="space-y-3">
          <Field label="Text">
            <TextField value={node.text} onChange={(v) => setProp(['text'], v)} />
          </Field>
          <Field label="Level">
            <SelectField
              value={String(node.level)}
              options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `H${n}` }))}
              onChange={(v) => setProp(['level'], Number(v))}
            />
          </Field>
        </div>
      );
    case 'text':
      return (
        <Field label="Text">
          <TextField value={node.text} onChange={(v) => setProp(['text'], v)} textarea />
        </Field>
      );
    case 'button':
      return (
        <div className="space-y-3">
          <Field label="Label">
            <TextField value={node.label} onChange={(v) => setProp(['label'], v)} />
          </Field>
          <Field label="Link (URL or /path)">
            <TextField value={node.href} onChange={(v) => setProp(['href'], v)} />
          </Field>
          <Field label="Variant">
            <SelectField
              value={node.variant ?? 'primary'}
              options={[
                { value: 'primary', label: 'Primary' },
                { value: 'secondary', label: 'Secondary' },
                { value: 'ghost', label: 'Ghost' },
              ]}
              onChange={(v) => setProp(['variant'], v)}
            />
          </Field>
        </div>
      );
    case 'image': {
      // SECURITY: safeObjectLookup, not a raw bracket access -- assetRef is
      // document-supplied data and must never resolve __proto__/constructor/
      // prototype to real JS machinery (see security.ts's own doc comment).
      const currentAsset = node.assetRef ? safeObjectLookup(editor.document.assets, node.assetRef) : undefined;
      return (
        <div className="space-y-3">
          <Field label="Image">
            <AssetPicker
              assets={editor.document.assets}
              kindFilter="image"
              businessId={businessId}
              selectedAssetId={node.assetRef}
              onSelect={(assetId) => setProp(['assetRef'], assetId)}
              onAddByUrl={(url, altText) => {
                // Replacing: reuse the SAME assetRef id the node already has
                // (this is what makes "add by URL" double as "replace image"
                // when a node already points at an asset); otherwise mint a
                // fresh one and point the node at it.
                const assetId = node.assetRef || freshNodeId('asset');
                editor.apply({ op: 'upsertAsset', assetId, asset: { id: assetId, kind: 'image', url, altText: altText || undefined } });
                if (assetId !== node.assetRef) setProp(['assetRef'], assetId);
              }}
            />
          </Field>
          {currentAsset && (
            <Field label="Alt text">
              <TextField
                value={currentAsset.altText ?? ''}
                onChange={(v) => editor.apply({ op: 'upsertAsset', assetId: currentAsset.id, asset: { ...currentAsset, altText: v || undefined } })}
              />
            </Field>
          )}
          <Field label="Caption">
            <TextField value={node.caption ?? ''} onChange={(v) => setProp(['caption'], v || undefined)} />
          </Field>
          <Field label="Fit">
            <SelectField
              value={node.objectFit ?? 'cover'}
              options={[
                { value: 'cover', label: 'Cover' },
                { value: 'contain', label: 'Contain' },
              ]}
              onChange={(v) => setProp(['objectFit'], v)}
            />
          </Field>
        </div>
      );
    }
    case 'video':
      return (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-[#E5E5E5]">
            <input type="checkbox" checked={!!node.autoplay} onChange={(e) => setProp(['autoplay'], e.target.checked)} />
            Autoplay
          </label>
          <label className="flex items-center gap-2 text-sm text-[#E5E5E5]">
            <input type="checkbox" checked={!!node.loop} onChange={(e) => setProp(['loop'], e.target.checked)} />
            Loop
          </label>
          <label className="flex items-center gap-2 text-sm text-[#E5E5E5]">
            <input type="checkbox" checked={!!node.muted} onChange={(e) => setProp(['muted'], e.target.checked)} />
            Muted
          </label>
        </div>
      );
    case 'componentInstance':
      return <ComponentInstanceFields node={node} editor={editor} />;
    case 'scene3d':
      return (
        <p className="rounded-md border border-[#D4AF37]/15 bg-[#161616] p-2.5 text-xs text-[#9a9a9a]">
          3D scenes render their poster image today (see ARCHITECTURE.md) -- there&apos;s no scene editor yet.
        </p>
      );
    default:
      return null;
  }
}

/**
 * Real component-instance editing: a variant selector (when the component
 * defines any) and one field per `propSchema` entry, writing through
 * `propOverrides` -- see `presetComponents.ts`'s module doc comment for the
 * `"<templateNodeId>__<field>"` convention `parsePropSchemaName` reads back.
 * Every write is a normal `updateNodeProps` operation (nodeId: the
 * INSTANCE, path: ['propOverrides', templateNodeId, field]) -- same undo
 * history, same `setNodeProp` path-segment hardening as every other field
 * in this file, nothing instance-editing-specific about the plumbing.
 */
function ComponentInstanceFields({ node, editor }: { node: ComponentInstanceNode; editor: DocumentEditor }) {
  const definition = safeObjectLookup(editor.document.components, node.componentId);
  if (!definition) {
    return (
      <p className="rounded-md border border-[#D4AF37]/15 bg-[#161616] p-2.5 text-xs text-[#9a9a9a]">
        This instance references component <span className="text-[#D4AF37]">&quot;{node.componentId}&quot;</span>, which no
        longer exists. It renders as an invisible placeholder until the component is restored or this instance is removed.
      </p>
    );
  }

  const variant = node.variantId ? definition.variants.find((v) => v.id === node.variantId) : undefined;

  function setOverride(nodeId: string, field: string, value: unknown) {
    editor.apply({ op: 'updateNodeProps', nodeId: node.id, path: ['propOverrides', nodeId, field], value });
  }

  return (
    <div className="space-y-3">
      <p className="rounded-md border border-[#D4AF37]/15 bg-[#161616] p-2 text-xs text-[#9a9a9a]">
        Instance of <span className="text-[#D4AF37]">{definition.name}</span>
      </p>

      {definition.variants.length > 0 && (
        <Field label="Variant">
          <SelectField
            value={node.variantId ?? ''}
            options={[{ value: '', label: 'Default' }, ...definition.variants.map((v) => ({ value: v.id, label: v.name }))]}
            onChange={(v) => editor.apply({ op: 'updateNodeProps', nodeId: node.id, path: ['variantId'], value: v || undefined })}
          />
        </Field>
      )}

      {definition.propSchema.map((propDef) => {
        const parsed = parsePropSchemaName(propDef.name);
        if (!parsed) return null; // malformed propSchema entry -- never crash the inspector over it
        const templateNode = findNodeIncludingSlotDefaults(definition.template, parsed.nodeId);
        const instanceValue = (node.propOverrides as Record<string, Record<string, unknown>> | undefined)?.[parsed.nodeId]?.[parsed.field];
        const variantValue = (variant?.propOverrides as Record<string, Record<string, unknown>> | undefined)?.[parsed.nodeId]?.[parsed.field];
        const templateValue = templateNode ? (templateNode as unknown as Record<string, unknown>)[parsed.field] : undefined;
        const current = instanceValue ?? variantValue ?? templateValue ?? propDef.default;

        return (
          <Field key={propDef.name} label={friendlyPropLabel(parsed)}>
            <TextField value={typeof current === 'string' ? current : String(current ?? '')} onChange={(v) => setOverride(parsed.nodeId, parsed.field, v)} />
          </Field>
        );
      })}

      {findSlotNodes(definition.template).map(({ slotName, node: slotNode }) => (
        <SlotEditor key={slotName} instance={node} slotName={slotName} slotNode={slotNode} editor={editor} />
      ))}
    </div>
  );
}

/**
 * Per-item editing for one named slot (e.g. a navbar's "links", a pricing
 * section's "plans"). Every preset slot's content is `[oneWrapperNode]`,
 * whose own children are the actual items -- `presetComponents.ts` always
 * shapes it that way (a flex/column container holding N buttons or N
 * feature/plan/FAQ cards) so the editor doesn't need to special-case each
 * component. A slot that doesn't follow that shape (not a single
 * container-kind node) falls back to the old "edit via Add/Replace" message
 * rather than guessing at a structure to edit.
 *
 * Every edit replaces the WHOLE slot content array via one `setSlotContent`
 * op -- same single-operation-per-edit contract as `propOverrides` fields
 * above, undoable exactly the same way. `updateNode`/`removeNode`/
 * `insertNode`/`moveNode` are tree.ts's own pure helpers, reused here by
 * treating the wrapper as a pseudo-root: they walk by id regardless of
 * whether the root they're given is literally `kind: 'root'`.
 */
function SlotEditor({
  instance,
  slotName,
  slotNode,
  editor,
}: {
  instance: ComponentInstanceNode;
  slotName: string;
  slotNode: { defaultContent?: DocumentNode[] };
  editor: DocumentEditor;
}) {
  const content = instance.slotContent?.[slotName] ?? slotNode.defaultContent ?? [];
  const wrapper = content[0];

  if (content.length !== 1 || !wrapper || !canHaveChildren(wrapper)) {
    return (
      <p className="pt-1 text-[11px] text-[#6b6b6b]">
        This slot&apos;s content doesn&apos;t have a simple item list to edit here -- replace it from the Assets panel instead.
      </p>
    );
  }

  const items = getChildren(wrapper) ?? [];

  function commit(nextWrapper: DocumentNode) {
    editor.apply({ op: 'setSlotContent', nodeId: instance.id, slotName, content: [nextWrapper] });
  }

  function editLeaf(nodeId: string, field: string, value: unknown) {
    commit(updateNode(wrapper as unknown as RootNode, nodeId, (n) => ({ ...n, [field]: value }) as DocumentNode) as unknown as DocumentNode);
  }

  function removeItem(itemId: string) {
    if (items.length <= 1) return; // never leave a slot with zero items this way
    commit(removeNode(wrapper as unknown as RootNode, itemId) as unknown as DocumentNode);
  }

  function addItem() {
    const template = items[items.length - 1];
    if (!template) return;
    const clone = cloneNodeWithFreshIds(template);
    commit(insertNode(wrapper as unknown as RootNode, wrapper.id, items.length, clone) as unknown as DocumentNode);
  }

  function moveItem(itemId: string, direction: -1 | 1) {
    const index = items.findIndex((i) => i.id === itemId);
    const newIndex = index + direction;
    if (index === -1 || newIndex < 0 || newIndex >= items.length) return;
    commit(moveNode(wrapper as unknown as RootNode, itemId, wrapper.id, newIndex) as unknown as DocumentNode);
  }

  return (
    <div className="space-y-2 border-t border-[#D4AF37]/10 pt-3">
      <p className="text-[11px] uppercase tracking-wide text-[#D4AF37]/80">
        {slotName.charAt(0).toUpperCase() + slotName.slice(1)} items
      </p>
      {items.map((item, index) => (
        <SlotItemCard
          key={item.id}
          item={item}
          index={index}
          total={items.length}
          onEditLeaf={editLeaf}
          onRemove={() => removeItem(item.id)}
          onMoveUp={() => moveItem(item.id, -1)}
          onMoveDown={() => moveItem(item.id, 1)}
        />
      ))}
      <button
        onClick={addItem}
        className="w-full rounded-sm bg-[#D4AF37]/15 px-2 py-1 text-xs font-medium text-[#D4AF37] transition hover:bg-[#D4AF37]/25"
      >
        + Add item
      </button>
    </div>
  );
}

function SlotItemCard({
  item,
  index,
  total,
  onEditLeaf,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  item: DocumentNode;
  index: number;
  total: number;
  onEditLeaf: (nodeId: string, field: string, value: unknown) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="space-y-2 rounded-md border border-[#D4AF37]/15 bg-[#161616] p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#6b6b6b]">Item {index + 1}</span>
        <div className="flex items-center gap-2 text-[11px] text-[#9a9a9a]">
          <button onClick={onMoveUp} disabled={index === 0} className="disabled:opacity-30" title="Move up">
            ↑
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="disabled:opacity-30" title="Move down">
            ↓
          </button>
          <button onClick={onRemove} disabled={total <= 1} className="text-[#f09a9a] disabled:opacity-30" title="Remove item">
            Remove
          </button>
        </div>
      </div>
      <SlotItemLeafFields item={item} onEditLeaf={onEditLeaf} />
    </div>
  );
}

/**
 * Recursively finds and renders the editable text/link fields inside one
 * slot item (a button, text, heading, or a container nesting any of
 * those -- e.g. a pricing plan's heading+price+description+button). Any
 * other leaf kind (image, video, nested component instance, ...) is left
 * alone here; this only covers what every current preset slot item is
 * actually built from.
 */
function SlotItemLeafFields({ item, onEditLeaf }: { item: DocumentNode; onEditLeaf: (nodeId: string, field: string, value: unknown) => void }) {
  switch (item.kind) {
    case 'button':
      return (
        <>
          <Field label="Label">
            <TextField value={item.label} onChange={(v) => onEditLeaf(item.id, 'label', v)} />
          </Field>
          <Field label="Link">
            <TextField value={item.href} onChange={(v) => onEditLeaf(item.id, 'href', v)} />
          </Field>
        </>
      );
    case 'text':
      return (
        <Field label="Text">
          <TextField value={item.text} onChange={(v) => onEditLeaf(item.id, 'text', v)} textarea />
        </Field>
      );
    case 'heading':
      return (
        <Field label="Heading">
          <TextField value={item.text} onChange={(v) => onEditLeaf(item.id, 'text', v)} />
        </Field>
      );
    default: {
      const children = getChildren(item);
      if (!children || children.length === 0) return null;
      return (
        <>
          {children.map((child) => (
            <SlotItemLeafFields key={child.id} item={child} onEditLeaf={onEditLeaf} />
          ))}
        </>
      );
    }
  }
}
