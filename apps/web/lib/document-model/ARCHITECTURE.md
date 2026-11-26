# Shared Visual Document Model — Architecture Decisions (Phase 1)

This is the foundation for the OGMJ BRANDS AI Creative Studio: one document
representation read and written by the (future) visual editor, the (future)
AI Creative Director, and the public renderer. It replaces nothing that
exists today — it defines the *next* shape of the data already stored in
`web_pages.content` (jsonb), with a lossless migration path from the ad hoc
block shape PR #72 introduced.

## Where this lives, and why not a new package or table

- **No new database table, no second page/site schema.** The model is a
  TypeScript/Zod contract for what goes inside the existing
  `web_pages.content` column. `websites` + `web_pages` remain the only
  page-storage tables. This was an explicit requirement ("do not build a
  second incompatible website/page schema") and also the only way to avoid
  repeating the mistake already found in this codebase once: a `sites` /
  `pages` / `sections` table set sitting unused next to the real
  `websites` / `web_pages` tables.
- **No new buildable monorepo package.** `packages/db` is the only existing
  `packages/*` entry, and it's just SQL files with no build step — there's
  no precedent here for a compiled shared package, and introducing one
  (bundler config, publishing, version pinning) would be exactly the kind
  of infrastructure swap this phase was told to avoid. The model lives at
  `apps/web/lib/document-model/`, the same convention as the app's other
  `lib/` modules (`lib/validators`, `lib/services`), and both the future
  editor and the renderer import from there directly.
- **No database migration in this phase.** Every requirement (versioned
  schema, validation, migration, operations, rendering) is satisfiable as
  pure TypeScript operating on a jsonb value. That means Phase 1 ships with
  zero production database changes — deliberately, since PR #72's
  migration is explicitly on hold pending your review of how the renderer
  should evolve.

## The document tree (`types.ts`)

A `DocumentRoot` is one `RootNode` whose `children` nest arbitrarily through
`section` / `container` nodes, down to leaf nodes (`heading`, `text`,
`image`, `video`, `button`). This directly satisfies "deeply nested visual
compositions" — there's no depth limit and no special-casing of "page" vs.
"section"; a page's root is just a root node like any other.

**Data, never code.** Every node is plain JSON: positions, strings, numbers,
asset references, token references. There is no field anywhere in this
model that holds a function body, a code string, or anything that could be
`eval`'d. That boundary is what makes it safe for an AI to write directly —
and safe for the renderer to trust without a sandboxed execution runtime,
which Phase 1 was explicitly told not to introduce. "AI-assisted code
generation" (Phase 5 of the roadmap) is a different, additive capability
layered on top of this model later, gated on its own sandboxing decision —
it does not require relaxing this boundary.

**The one escape hatch — `custom` nodes.** A node can declare
`kind: 'custom'` with a free-form `customType` string and a `props` object.
The renderer's node registry looks up a renderer for that type; if none is
registered, the node still renders its children rather than vanishing (see
`CustomBlock` / `UnknownBlock`-equivalent in the renderer). This is how new
visual capabilities roll out incrementally — a new block kind becomes a
registry entry, not a schema version bump — while `migrateLegacyContent`
guarantees that *today's* unrecognized block types (anything PR #72's
lenient reader didn't already know about) survive the upgrade losslessly as
`custom` nodes carrying their original fields verbatim.

## Components, variants, slots (`types.ts` — `ComponentDefinition`)

A `ComponentDefinition` has a `template` (an ordinary node tree) containing
one or more `slot` nodes, plus a `variants` list and a `propSchema`. A
`componentInstance` node references a `componentId`, optionally a
`variantId`, and supplies `slotContent` per named slot. The renderer's
`substituteSlots` walks the template and replaces each `slot` node with the
instance's content for that slot name (or the slot's own `defaultContent`
when the instance doesn't supply one) — proven in
`renderer.test.ts` ("renders a component instance by substituting slot
content", "falls back to a default-content slot").

This is deliberately the *simplest* workable component model — propSchema
default/override resolution against variants is defined in the types but
not yet wired into rendering (see Remaining Risks). It's enough to prove
reuse, nesting, and slot substitution end-to-end now, without guessing at
a prop-binding API the editor hasn't been designed yet.

## Design tokens & responsive breakpoints (`tokens.ts`, `types.ts`)

Tokens are a flat-per-group record (`colors`, `spacing`, `radii`, `shadows`,
and the one two-level group, `typography`), referenced from any style field
via `{ token: 'colors.brand.primary' }` rather than embedding raw values.
A brand-wide palette change is one token-set edit; nothing elsewhere in a
document needs to change. `resolveStyleValue` resolves a reference against
a token set at render time; nothing is resolved at authoring time, so the
same document renders correctly against a different token set later (e.g.
a seasonal theme) without being rewritten.

Every style field can be `Responsive<T>` — either a bare value or
`{ base: T, sm?: T, md?: T, ... }` — against a document-level
`breakpoints: BreakpointDefinition[]` list that defaults to five
(base/sm/md/lg/xl) but is NOT hardcoded to exactly those keys; a document
can declare custom breakpoints. The renderer turns each responsive value
into a CSS custom property with one base rule and one `@media (min-width)`
override per breakpoint that defines it (see `resolveResponsiveCssVar`) —
proven in `renderer.test.ts` ("resolves a responsive style value into a
base rule plus a min-width media query"). This is real, server-rendered,
zero-client-JS responsive CSS — no CSS-in-JS dependency was added.

## Motion, effects, and 3D — schema now, runtime later

These three areas are where "no premature infrastructure" mattered most,
so each is handled the same way: **the shape is fully defined, data
round-trips through validation and the renderer without error, but no
heavy runtime (GSAP, a shader pipeline, Three.js/WebGL) ships in Phase 1.**

- **Motion** (`MotionDefinition`, `AnimationSpec`, `MotionTrigger`): a node
  declares triggers (`load` / `scroll` / `hover` / `click` / `inView`) each
  with a keyframe-based `AnimationSpec` (engine-agnostic — it's not a GSAP
  config, GSAP or any other engine would *read* this later). Today's
  renderer applies one tasteful, zero-dependency CSS fade for `on: 'load'`
  triggers (a real, visible baseline, not a no-op), and for every trigger
  it stamps `data-motion="<the full spec, as JSON>"` on the node so a
  future motion engine has everything it needs without a schema change.
  `reducedMotionFallback` is already in the type so accessibility isn't
  retrofitted later.
- **Visual effects** (`EffectDefinition`): `filters` (blur/brightness/
  contrast/saturate/grayscale/hue-rotate) and `shadows` are CSS-expressible
  today and the renderer applies them for real. `mask` and `shaderRef` are
  defined and validated but the renderer doesn't yet act on them —
  `shaderRef` is explicitly a *reference* (`{ shaderId, params }`), never a
  program, so wiring in an actual shader pipeline later is additive.
- **3D** (`Scene3DSpec`, `scene3d` node): camera, lights, objects (each an
  asset reference, not inline geometry), and interactions are fully typed.
  The renderer renders the scene's `posterAssetRef` image (or a labeled
  empty placeholder) — explicitly never a `<canvas>` — proven in
  `renderer.test.ts` ("renders a 3D scene as a static poster placeholder,
  never a WebGL canvas"). A document authored with a real 3D hero section
  today will, unmodified, start rendering an actual WebGL scene the day a
  3D runtime is added — because the data was never thrown away or
  approximated, just not yet executed.

This is the direct answer to "how does this support future cinematic and
advanced visual experiences": every capability in the brief (scroll
storytelling, cinematic transitions, interactive 3D, shader effects) has a
place to live in the schema *today*, so building the motion/3D runtime
later is additive work on stable data, not a breaking schema change and
re-migration of every existing document.

## AI-native editing: operations, not direct mutation (`operations.ts`)

Neither the AI Creative Director nor the editor ever mutates a
`DocumentRoot` by hand. Every change is one of six `DocumentOperation`
variants (`insertNode`, `removeNode`, `moveNode`, `updateNodeProps`,
`setSlotContent`, `applyVariant`). `applyOperation` computes the operation's
own inverse *before* applying it and returns both — so every AI edit is
mechanically undoable, and a human editor's undo/redo stack and an AI's
"try something, inspect it, revert if it's worse" loop are the same
mechanism, not two different ones. `recordOperation` / `undo` / `redo`
implement that stack directly (`past` / `future`, à la a text editor),
tagging each entry with `actor: 'user' | 'ai'` so a document's history can
show provenance later.

Scoping edits to named operations is also what makes "select an element,
change its color, preserve everything else" literally true rather than
aspirational: `updateNodeProps` with a `path` touches exactly one field on
exactly one node (`operations.test.ts` proves the untouched sibling node is
*referentially* the same object afterward, not just equal) — there is no
code path in this model where an edit to one node can have side effects on
another.

## Validation (`schema.ts`)

Zod schemas mirror the TypeScript types and are the actual enforcement
point: `validateDocument` / `validateVersionedDocument` are what a future
API route, an AI tool call, or a page loader calls before trusting JSON
from the database or a request body. This exists because of a concrete,
discovered precedent in this same codebase: `lib/validators/builder.ts` for
the current builder has validators that are fully written but never called
by any route, so today nothing server-side actually enforces slug format,
length limits, or section shape. Phase 2 (the editor) and any revival of
PR #72's public path must call these functions at the API boundary, not
just construct documents in-process and assume they're valid.

## Versioning & migration (`types.ts` — `CURRENT_SCHEMA_VERSION`; `migrate.ts`)

A stored document is `{ schemaVersion, document }`. `migrateVersionedDocument`
walks a registry of one-step upgrade functions (`MIGRATIONS[v]`) from a
document's stored version up to `CURRENT_SCHEMA_VERSION`, so callers never
need to know how many versions behind a document is — and old migration
steps are never deleted while any stored document might still need them.

`migrateLegacyContent` is the specific, tested bridge from *today's*
production data shape (PR #72's `{ sections: [...] }`) to schemaVersion 1,
deliberately mirroring PR #72's `SectionRenderer`'s exact `field()` lookup
order (top-level, then `props`/`content`/`data`) so a block that renders
one way today renders identically after migration. It never throws — a
malformed or `null` `content` value becomes an empty root rather than a
failed page load — and unrecognized block types become `custom` nodes that
preserve every original field, so nothing authored today is silently lost
when this model lands.

## Remaining risks / explicitly deferred (not done in Phase 1)

- **Component prop-binding isn't wired into rendering yet.** `propSchema`
  defaults and an instance's `propOverrides` are typed and validated but
  the renderer doesn't resolve them against the template today — only slot
  substitution is proven end-to-end. This is the right amount for Phase 1
  (reuse + nesting + slots work; parametrized variants are Phase 2 work,
  once the editor defines how a user actually sets a prop override).
- **`next build` was not run.** `tsc --noEmit` (whole app) and the full
  `vitest run` suite both pass, and this module is not yet imported by any
  route, so it carries zero build-time risk today — but a full
  production build wasn't exercised against this code.
- **Asset management integration is reference-only.** `AssetRef` defines
  the shape (id, kind, url, dimensions, provenance) but there's no upload
  pipeline wired to populate `document.assets` yet; that's existing
  infrastructure (Supabase Storage, already used elsewhere in this app)
  to connect in a later phase, not build from scratch.
- **The 3 pre-existing failing tests** (`__tests__/videos/process-route.test.ts`,
  `lib/video/processing.test.ts`) are unrelated to this work — confirmed by
  checking no file they depend on was touched in this branch, and PR #71's
  own description independently reports the same 3 failures on `main`.
