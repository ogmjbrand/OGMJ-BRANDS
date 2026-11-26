/**
 * Slug generation shared by server-side routes that insert into a table with
 * a `CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$')` + `UNIQUE (slug)`
 * constraint (currently: `public.websites`). Never trust a client-supplied
 * slug for a resource whose uniqueness/format is enforced this way --
 * generate it here, server-side, from a human-entered name instead.
 */

export const MAX_SLUG_LENGTH = 63;

const SLUG_FORMAT = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/** Lowercases, strips accents, replaces runs of non [a-z0-9] with a single hyphen, and trims leading/trailing hyphens. May return an empty string if the input has no alphanumeric characters at all. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics (e.g. "é" -> "e")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Truncates to maxLength, re-stripping a trailing hyphen truncation can expose. */
export function truncateSlug(slug: string, maxLength: number = MAX_SLUG_LENGTH): string {
  if (slug.length <= maxLength) return slug;
  return slug.slice(0, maxLength).replace(/-+$/, '');
}

export function isValidSlugFormat(slug: string): boolean {
  return slug.length > 0 && slug.length <= MAX_SLUG_LENGTH && SLUG_FORMAT.test(slug);
}

/**
 * The slug to try for a given collision-retry attempt (0-indexed): attempt 0
 * is the bare base slug, every attempt after appends `-2`, `-3`, ... -- the
 * base is re-truncated each time so the numbered slug never exceeds
 * maxLength, even for a base that was already at the length limit.
 */
export function slugForAttempt(base: string, attempt: number, maxLength: number = MAX_SLUG_LENGTH): string {
  if (attempt <= 0) return truncateSlug(base, maxLength);
  const suffix = `-${attempt + 1}`;
  return `${truncateSlug(base, maxLength - suffix.length)}${suffix}`;
}
