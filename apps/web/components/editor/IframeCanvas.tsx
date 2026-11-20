'use client';

/**
 * Renders `children` inside a real, same-origin iframe via a portal rather
 * than a width-constrained <div>. This is what makes the viewport switcher
 * a genuine responsive preview: DocumentRenderer emits real
 * `@media (min-width:Npx)` rules, which are evaluated against the actual
 * rendering viewport -- shrinking a plain <div> would never trigger them
 * (CSS media queries are viewport-relative, not container-relative), so
 * only a true iframe gives correct breakpoint behavior here.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const BASE_IFRAME_STYLES = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; min-height: 100%; font-family: system-ui, -apple-system, sans-serif; background: #ffffff; }
`;

interface IframeCanvasProps {
  widthPx: number;
  children: ReactNode;
}

export function IframeCanvas({ widthPx, children }: IframeCanvasProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;
    // A freshly created, src-less iframe's initial document is available
    // synchronously -- no need to wait for a 'load' event (and waiting for
    // one here is actually unsafe: it can refire after this same
    // document.write and wipe out the node React already portaled into).
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>${BASE_IFRAME_STYLES}</style></head><body><div id="ogmj-canvas-root"></div></body></html>`);
    doc.close();
    setMountNode(doc.getElementById('ogmj-canvas-root'));
  }, []);

  return (
    <>
      <iframe
        ref={iframeRef}
        title="Page preview"
        // SECURITY: `allow-same-origin` only, never `allow-scripts`.
        // `allow-same-origin` is required -- without it a sandboxed,
        // src-less iframe gets an opaque origin and `contentDocument`
        // access above throws a SecurityError, breaking this component
        // entirely. `allow-scripts` is NOT needed: the portaled React
        // content is built and reconciled by the PARENT frame's JS engine
        // (synthetic events, DOM mutations) and never writes a <script>
        // tag into the iframe's OWN document -- DocumentRenderer has no
        // node kind that emits one. Empirically verified (Playwright,
        // isolated from the app): with exactly this sandbox value, (1)
        // contentDocument access and document.write still work, (2) a
        // DOM listener the parent attaches to a node inside the iframe
        // still fires on a click, and (3) a literal <script> tag written
        // into the sandboxed document does NOT execute -- so if a future
        // bug ever let one reach rendered output, it would be inert here
        // instead of a live XSS. Do not add allow-scripts "to be safe";
        // it would remove exactly the protection this exists to add.
        sandbox="allow-same-origin"
        style={{ width: widthPx, height: '100%', border: 'none', display: 'block', background: '#fff' }}
      />
      {mountNode ? createPortal(children, mountNode) : null}
    </>
  );
}
