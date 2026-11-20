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
import { findNode, type DocumentNode, type NodeId } from '@/lib/document-model';
import { readResponsive, writeResponsive } from '@/lib/editor/responsiveValue';
import type { DocumentEditor } from '@/lib/editor/useDocumentEditor';
import { VIEWPORTS } from '@/lib/editor/useDocumentEditor';

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

function TextField({ value, onChange, textarea }: { value: string; onChange: (v: string) => void; textarea?: boolean }) {
  if (textarea) {
    return <textarea className={inputClass} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />;
  }
  return <input className={inputClass} type="text" value={value} onChange={(e) => onChange(e.target.value)} />;
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

export function Inspector({ editor }: { editor: DocumentEditor }) {
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

      <KindFields node={node} setProp={setProp} />

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

function KindFields({ node, setProp }: { node: DocumentNode; setProp: (path: string[], value: unknown) => void }) {
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
    case 'image':
      return (
        <div className="space-y-3">
          <p className="rounded-md border border-[#D4AF37]/15 bg-[#161616] p-2.5 text-xs text-[#9a9a9a]">
            Changing the image source isn&apos;t available in this stage of the editor yet -- you can still move, resize and
            restyle this image, and edit its caption below.
          </p>
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
      return (
        <p className="rounded-md border border-[#D4AF37]/15 bg-[#161616] p-2.5 text-xs text-[#9a9a9a]">
          Component instance of <span className="text-[#D4AF37]">{node.componentId}</span>. Prop/slot editing for component
          instances is planned for a follow-up stage.
        </p>
      );
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
