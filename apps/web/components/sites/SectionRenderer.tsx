/**
 * Minimal server-rendered renderer for web_pages.content.sections.
 *
 * There is no canonical block schema in the codebase yet, so this is lenient:
 * each block is expected to look like { type, ...fields } and fields may live
 * at the top level or under `props` / `content` / `data`. Supported types:
 * heading, text, image, button. Anything else gets a neutral fallback.
 */

type Block = Record<string, unknown>;

function asRecord(value: unknown): Block | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Block) : null;
}

/** Read the first string field found on the block or its nested props. */
function field(block: Block, ...keys: string[]): string | undefined {
  const sources = [block, asRecord(block.props), asRecord(block.content), asRecord(block.data)];
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value;
      if (typeof value === 'number') return String(value);
    }
  }
  return undefined;
}

/** Allow only http(s), mailto, tel, site-relative and in-page links. */
function safeHref(href: string | undefined): string | undefined {
  if (!href) return undefined;
  const trimmed = href.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed;
  try {
    const url = new URL(trimmed);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Images only from http(s) or site-relative paths. */
function safeSrc(src: string | undefined): string | undefined {
  if (!src) return undefined;
  const trimmed = src.trim();
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

const alignClass: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function HeadingBlock({ block }: { block: Block }) {
  const text = field(block, 'text', 'title', 'heading');
  if (!text) return null;
  const level = Number(field(block, 'level')) || 2;
  const align = alignClass[field(block, 'align') ?? ''] ?? '';
  if (level <= 1) {
    return <h1 className={`font-display text-4xl md:text-5xl font-bold text-white ${align}`}>{text}</h1>;
  }
  if (level === 2) {
    return <h2 className={`font-display text-3xl md:text-4xl font-semibold text-white ${align}`}>{text}</h2>;
  }
  return <h3 className={`font-display text-2xl font-semibold text-white ${align}`}>{text}</h3>;
}

function TextBlock({ block }: { block: Block }) {
  const text = field(block, 'text', 'body', 'html', 'value');
  if (!text) return null;
  const align = alignClass[field(block, 'align') ?? ''] ?? '';
  // Rendered as plain text (never as HTML) — paragraphs split on blank lines.
  return (
    <div className={`space-y-4 text-lg leading-relaxed text-white/80 ${align}`}>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="whitespace-pre-line">
          {para}
        </p>
      ))}
    </div>
  );
}

function ImageBlock({ block }: { block: Block }) {
  const src = safeSrc(field(block, 'src', 'url', 'image', 'imageUrl'));
  if (!src) return null;
  const alt = field(block, 'alt', 'caption') ?? '';
  const caption = field(block, 'caption');
  return (
    <figure className="space-y-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied hosts */}
      <img src={src} alt={alt} loading="lazy" className="w-full rounded-2xl border border-white/10 object-cover" />
      {caption ? <figcaption className="text-sm text-white/60 text-center">{caption}</figcaption> : null}
    </figure>
  );
}

function ButtonBlock({ block }: { block: Block }) {
  const label = field(block, 'label', 'text', 'title');
  const href = safeHref(field(block, 'href', 'url', 'link'));
  if (!label || !href) return null;
  const external = /^https?:/.test(href);
  const align = field(block, 'align');
  const wrapper = align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';
  return (
    <div className={`flex ${wrapper}`}>
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="inline-flex items-center rounded-full bg-[#C8FF00] px-6 py-3 font-semibold text-black transition hover:bg-[#D6FF66]"
      >
        {label}
      </a>
    </div>
  );
}

function UnknownBlock({ block }: { block: Block }) {
  // Unknown block types: show any obvious text content, otherwise render nothing visible.
  const text = field(block, 'text', 'title', 'body');
  if (!text) return null;
  return <p className="text-white/80">{text}</p>;
}

function renderBlock(block: Block) {
  const type = typeof block.type === 'string' ? block.type.toLowerCase() : '';
  switch (type) {
    case 'heading':
    case 'title':
      return <HeadingBlock block={block} />;
    case 'text':
    case 'paragraph':
    case 'richtext':
      return <TextBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'button':
    case 'cta':
      return <ButtonBlock block={block} />;
    default:
      return <UnknownBlock block={block} />;
  }
}

export function SectionRenderer({ sections }: { sections: unknown[] }) {
  const blocks = sections.map(asRecord).filter((b): b is Block => b !== null);

  if (blocks.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
        <p className="text-lg text-white/70">This page has no content yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {blocks.map((block, i) => (
        <section key={typeof block.id === 'string' ? block.id : i} data-block-type={String(block.type ?? 'unknown')}>
          {renderBlock(block)}
        </section>
      ))}
    </div>
  );
}
