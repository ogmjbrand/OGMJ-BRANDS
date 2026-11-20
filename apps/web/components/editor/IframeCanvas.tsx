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
        style={{ width: widthPx, height: '100%', border: 'none', display: 'block', background: '#fff' }}
      />
      {mountNode ? createPortal(children, mountNode) : null}
    </>
  );
}
