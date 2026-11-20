/**
 * Viewport-aware get/set for a `Responsive<T>` style field, used by the
 * inspector so switching the preview viewport (desktop/tablet/mobile) isn't
 * just a visual preview -- editing a style field while a non-base viewport
 * is selected edits THAT breakpoint's override specifically, leaving every
 * other breakpoint's value untouched.
 */
import type { BreakpointKey, Responsive } from '@/lib/document-model';

function isResponsiveMap(value: unknown): value is { base: unknown } & Record<string, unknown> {
  return typeof value === 'object' && value !== null && 'base' in (value as Record<string, unknown>);
}

export function readResponsive<T>(value: Responsive<T> | undefined, breakpoint: BreakpointKey): T | undefined {
  if (value === undefined) return undefined;
  if (!isResponsiveMap(value)) return value as T;
  if (breakpoint === 'base') return value.base as T;
  return ((value as Record<string, T>)[breakpoint] ?? (value.base as T));
}

/** True if `breakpoint` has its OWN override (as opposed to inheriting `base`) -- lets the inspector show "inherited" vs "overridden". */
export function hasOwnOverride<T>(value: Responsive<T> | undefined, breakpoint: BreakpointKey): boolean {
  if (breakpoint === 'base') return value !== undefined;
  if (value === undefined || !isResponsiveMap(value)) return false;
  return (value as Record<string, unknown>)[breakpoint] !== undefined;
}

export function writeResponsive<T>(value: Responsive<T> | undefined, breakpoint: BreakpointKey, newValue: T): Responsive<T> {
  if (breakpoint === 'base') {
    if (value !== undefined && isResponsiveMap(value)) return { ...value, base: newValue };
    return newValue;
  }
  const base = (value !== undefined && isResponsiveMap(value) ? value.base : value) as T | undefined;
  const existing = value !== undefined && isResponsiveMap(value) ? value : { base: base as T };
  return { ...existing, [breakpoint]: newValue } as Responsive<T>;
}

/** Removes a non-base breakpoint's override entirely, reverting it to inherit `base`. No-op for `base` itself. */
export function clearResponsiveOverride<T>(value: Responsive<T> | undefined, breakpoint: BreakpointKey): Responsive<T> | undefined {
  if (breakpoint === 'base' || value === undefined || !isResponsiveMap(value)) return value;
  const { [breakpoint]: _removed, ...rest } = value as Record<string, unknown>;
  void _removed;
  return rest as Responsive<T>;
}
