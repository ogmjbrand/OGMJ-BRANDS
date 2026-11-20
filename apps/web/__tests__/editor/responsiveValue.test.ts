import { describe, expect, it } from 'vitest';
import { clearResponsiveOverride, hasOwnOverride, readResponsive, writeResponsive } from '@/lib/editor/responsiveValue';

describe('readResponsive', () => {
  it('returns a plain (non-responsive) value as-is for any breakpoint', () => {
    expect(readResponsive('16px', 'base')).toBe('16px');
    expect(readResponsive('16px', 'lg')).toBe('16px');
  });

  it('returns the base value when no override exists at the requested breakpoint', () => {
    expect(readResponsive({ base: 'center' }, 'lg')).toBe('center');
  });

  it("returns a breakpoint's own override when present", () => {
    expect(readResponsive({ base: 'center', lg: 'left' }, 'lg')).toBe('left');
    expect(readResponsive({ base: 'center', lg: 'left' }, 'base')).toBe('center');
  });

  it('returns undefined for an undefined value', () => {
    expect(readResponsive(undefined, 'base')).toBeUndefined();
  });
});

describe('writeResponsive', () => {
  it('writing to base on a plain value just replaces it', () => {
    expect(writeResponsive('16px', 'base', '24px')).toBe('24px');
  });

  it('writing to a non-base breakpoint on a plain value promotes it to a responsive map, preserving the old value as base', () => {
    expect(writeResponsive('16px', 'lg', '32px')).toEqual({ base: '16px', lg: '32px' });
  });

  it("writing to one breakpoint doesn't disturb another breakpoint's existing override", () => {
    const value = { base: 'center', md: 'right' };
    expect(writeResponsive(value, 'lg', 'left')).toEqual({ base: 'center', md: 'right', lg: 'left' });
  });

  it('writing to base on an existing responsive map updates only base', () => {
    const value = { base: 'center', lg: 'left' };
    expect(writeResponsive(value, 'base', 'right')).toEqual({ base: 'right', lg: 'left' });
  });
});

describe('hasOwnOverride', () => {
  it('base always counts as its "own" value once set', () => {
    expect(hasOwnOverride('16px', 'base')).toBe(true);
    expect(hasOwnOverride(undefined, 'base')).toBe(false);
  });

  it('a non-base breakpoint only counts when it has an explicit override', () => {
    expect(hasOwnOverride({ base: 'center' }, 'lg')).toBe(false);
    expect(hasOwnOverride({ base: 'center', lg: 'left' }, 'lg')).toBe(true);
  });
});

describe('clearResponsiveOverride', () => {
  it('removes a non-base override, reverting that breakpoint to inherit base', () => {
    const value = { base: 'center', lg: 'left' };
    expect(clearResponsiveOverride(value, 'lg')).toEqual({ base: 'center' });
  });

  it('is a no-op for base, or for a value with no override at that breakpoint', () => {
    expect(clearResponsiveOverride('16px', 'base')).toBe('16px');
    expect(clearResponsiveOverride({ base: 'center' }, 'lg')).toEqual({ base: 'center' });
  });
});
