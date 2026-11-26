import { describe, expect, it } from 'vitest';
import { safeErrorSummary } from '@/lib/ai/errorSummary';

describe('safeErrorSummary', () => {
  it('extracts only name and message from a real Error, dropping every other property', () => {
    const err = Object.assign(new TypeError('bad request'), {
      headers: { authorization: 'Bearer sk-secret' },
      requestBody: { apiKey: 'sk-secret-2' },
    });
    const summary = safeErrorSummary(err);
    expect(summary).toEqual({ name: 'TypeError', message: 'bad request' });
    expect(JSON.stringify(summary)).not.toContain('sk-secret');
  });

  it('returns a plain message for a thrown string', () => {
    expect(safeErrorSummary('plain string failure')).toEqual({ message: 'plain string failure' });
  });

  it('returns a generic message for a non-Error, non-string thrown value, never serializing the raw value', () => {
    expect(safeErrorSummary({ some: 'object', apiKey: 'sk-should-not-appear' })).toEqual({ message: 'Non-Error value thrown' });
  });
});
