"use client"

import * as React from "react"
import { Portal as PortalPrimitive } from "radix-ui"

/**
 * Renders its children into `document.body` (Radix's own `Portal`
 * primitive, already a dependency via `radix-ui` -- the same one
 * `DialogPortal` in dialog.tsx is built on) rather than wherever this
 * component sits in the React tree.
 *
 * Needed for any `fixed`-positioned overlay (a panel, drawer, dropdown,
 * modal) authored directly in app code rather than through Radix's own
 * Dialog/Popover/etc primitives: app/layout.tsx wraps every page in
 * PageTransition's framer-motion `motion.div`, which animates y/scale via
 * a persistent CSS `transform`. A transformed ancestor becomes the
 * containing block for every `position: fixed` descendant (CSS spec
 * behavior), so on any route whose content is wider or taller than the
 * viewport, a `fixed`-positioned overlay that is still a DOM descendant of
 * that `motion.div` gets sized and positioned against the overflowed
 * content box instead of the real, visible viewport -- its buttons can
 * end up partly or fully off-screen. Rendering the overlay through this
 * Portal instead moves it out of that subtree entirely (React context
 * still propagates through portals normally, and the overlay keeps using
 * its own `onClick`-based open/close handling, so none of that logic
 * needs to change), restoring the true viewport as its containing block.
 */
function Portal({
  ...props
}: React.ComponentProps<typeof PortalPrimitive.Root>) {
  return <PortalPrimitive.Root data-slot="portal" {...props} />
}

export { Portal }
