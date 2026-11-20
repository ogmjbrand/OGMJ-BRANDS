import { describe, it, expect } from 'vitest';
import { slugify, truncateSlug, isValidSlugFormat, slugForAttempt, MAX_SLUG_LENGTH } from '@/lib/utils/slug';

const DB_SLUG_FORMAT = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('My Travel Site')).toBe('my-travel-site');
  });

  it('replaces runs of unsupported characters with a single hyphen', () => {
    expect(slugify("AJW Travels & Co. — Int'l!!")).toBe('ajw-travels-co-int-l');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugify('--- Hello World ---')).toBe('hello-world');
  });

  it('strips accents/diacritics to their base letters', () => {
    expect(slugify('Café Déjà Vu')).toBe('cafe-deja-vu');
  });

  it('returns an empty string for input with no alphanumeric characters', () => {
    expect(slugify('!!! --- ???')).toBe('');
    expect(slugify('   ')).toBe('');
  });

  it('collapses multiple consecutive separators into one hyphen', () => {
    expect(slugify('a   b___c---d')).toBe('a-b-c-d');
  });
});

describe('truncateSlug', () => {
  it('leaves a short slug untouched', () => {
    expect(truncateSlug('short-slug')).toBe('short-slug');
  });

  it('truncates to the max length and strips any newly-exposed trailing hyphen', () => {
    const longSlug = 'a'.repeat(60) + '-' + 'b'.repeat(10); // hyphen lands exactly at index 60
    const truncated = truncateSlug(longSlug, 61);
    expect(truncated.length).toBeLessThanOrEqual(61);
    expect(truncated.endsWith('-')).toBe(false);
  });
});

describe('isValidSlugFormat', () => {
  it('accepts a normal slug', () => {
    expect(isValidSlugFormat('my-travel-site')).toBe(true);
  });

  it('accepts a single alphanumeric character', () => {
    expect(isValidSlugFormat('a')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidSlugFormat('')).toBe(false);
  });

  it('rejects a slug starting or ending with a hyphen', () => {
    expect(isValidSlugFormat('-leading')).toBe(false);
    expect(isValidSlugFormat('trailing-')).toBe(false);
  });

  it('rejects a slug over the max length', () => {
    expect(isValidSlugFormat('a'.repeat(MAX_SLUG_LENGTH + 1))).toBe(false);
  });

  it('accepts a slug at exactly the max length', () => {
    const maxLengthSlug = 'a' + '-'.repeat(MAX_SLUG_LENGTH - 2) + 'a';
    expect(maxLengthSlug.length).toBe(MAX_SLUG_LENGTH);
    expect(isValidSlugFormat(maxLengthSlug)).toBe(true);
  });
});

describe('slugForAttempt', () => {
  it('returns the bare base slug for attempt 0', () => {
    expect(slugForAttempt('my-site', 0)).toBe('my-site');
  });

  it('appends a numbered suffix for later attempts', () => {
    expect(slugForAttempt('my-site', 1)).toBe('my-site-2');
    expect(slugForAttempt('my-site', 2)).toBe('my-site-3');
  });

  it('never exceeds the max length even when the base is already at the limit', () => {
    const maxLengthBase = 'a'.repeat(MAX_SLUG_LENGTH);
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = slugForAttempt(maxLengthBase, attempt);
      expect(slug.length).toBeLessThanOrEqual(MAX_SLUG_LENGTH);
      expect(slug).toMatch(DB_SLUG_FORMAT);
    }
  });

  it('produces a slug matching the live database CHECK constraint for a realistic set of names', () => {
    const names = ['My Travel Site', "AJW Travels & Co. — Int'l!!", 'A'.repeat(200), 'Café Déjà Vu', '123 Start With Digits'];
    for (const name of names) {
      const base = slugify(name);
      if (!base) continue;
      for (let attempt = 0; attempt < 3; attempt++) {
        expect(slugForAttempt(base, attempt)).toMatch(DB_SLUG_FORMAT);
      }
    }
  });
});
