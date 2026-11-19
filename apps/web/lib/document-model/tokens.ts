import type { BreakpointDefinition, DesignTokenSet, StyleValue } from './types';
import { DEFAULT_BREAKPOINTS } from './types';

export { DEFAULT_BREAKPOINTS };

/**
 * A neutral starter token set. Real businesses get their own (future work:
 * generating one from a brand profile), but every document needs *some*
 * tokenSetId to resolve against, including the ones produced by
 * `migrateLegacyContent`.
 */
export const DEFAULT_TOKEN_SET: DesignTokenSet = {
  id: 'default',
  name: 'OGMJ Default',
  colors: {
    'brand.primary': '#C8FF00',
    'brand.onPrimary': '#07070A',
    background: '#07070A',
    foreground: '#FFFFFF',
    'foreground.muted': 'rgba(255,255,255,0.7)',
    border: 'rgba(200,255,0,0.1)',
  },
  typography: {
    fontFamilies: { display: 'var(--font-display, sans-serif)', body: 'var(--font-body, sans-serif)' },
    fontSizes: { sm: '0.875rem', md: '1rem', lg: '1.25rem', xl: '2rem', '2xl': '3rem' },
    fontWeights: { normal: 400, semibold: 600, bold: 700 },
    lineHeights: { tight: 1.1, normal: 1.5, relaxed: 1.75 },
  },
  spacing: { xs: '0.5rem', sm: '1rem', md: '1.5rem', lg: '2.5rem', xl: '4rem' },
  radii: { sm: '0.5rem', md: '1rem', lg: '1.5rem', full: '9999px' },
  shadows: { soft: '0 10px 30px rgba(0,0,0,0.25)' },
};

export function getBreakpoint(breakpoints: BreakpointDefinition[], key: string): BreakpointDefinition | undefined {
  return breakpoints.find((b) => b.key === key);
}

/**
 * Resolves a TokenRef against a token set; returns the raw value for non-refs.
 *
 * Token groups (colors/spacing/radii/shadows/gradients) are FLAT records
 * whose own keys may themselves contain dots (e.g. `colors['brand.primary']`),
 * so a path like "colors.brand.primary" is NOT four levels of nested
 * objects — it's group="colors", key="brand.primary". `typography` is the
 * one group with a real second level (fontFamilies/fontSizes/...), so it
 * gets one extra split.
 */
export function resolveStyleValue<T>(value: StyleValue<T> | undefined, tokenSet: DesignTokenSet): T | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'object' || value === null || !('token' in (value as Record<string, unknown>))) {
    return value as T;
  }

  const [group, ...rest] = (value as { token: string }).token.split('.');
  const groupValue = (tokenSet as unknown as Record<string, unknown>)[group];
  if (groupValue == null || typeof groupValue !== 'object') return undefined;

  if (group === 'typography') {
    const [subGroup, ...subRest] = rest;
    const subGroupValue = (groupValue as Record<string, unknown>)[subGroup];
    if (subGroupValue == null || typeof subGroupValue !== 'object') return undefined;
    return (subGroupValue as Record<string, unknown>)[subRest.join('.')] as T | undefined;
  }

  return (groupValue as Record<string, unknown>)[rest.join('.')] as T | undefined;
}
