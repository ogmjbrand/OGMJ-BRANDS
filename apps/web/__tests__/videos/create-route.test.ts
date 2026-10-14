import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Regression test: a newly created video must not start life already
 * showing "Processing..." before the user has done anything -- that
 * was the other half of the stuck-processing defect (status was set
 * to 'processing' unconditionally on insert).
 */

let insertedValues: any = null;

vi.mock('@/lib/auth.server', () => ({
  getCurrentUserServer: () => Promise.resolve({ id: 'user-1', email: 'user@example.com' }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () =>
    Promise.resolve({
      from(table: string) {
        if (table === 'business_users') {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            async single() {
              return { data: { role: 'owner' }, error: null };
            },
          };
        }
        if (table === 'videos') {
          return {
            insert(values: any) {
              insertedValues = values;
              return {
                select() {
                  return this;
                },
                async single() {
                  return { data: { id: 'video-1', ...values }, error: null };
                },
              };
            },
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    }),
}));

describe('POST /api/videos -- initial status', () => {
  beforeEach(() => {
    insertedValues = null;
  });

  it('REGRESSION FIX: creates a video as "uploaded", not already "processing"', async () => {
    const { POST } = await import('@/app/api/videos/route');
    const req = new NextRequest('https://ogmjbrands.com/api/videos', {
      method: 'POST',
      body: JSON.stringify({ businessId: 'biz-1', title: 'Test video', fileUrl: 'https://storage.example.com/v.mp4' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(insertedValues.status).toBe('uploaded');
    expect(insertedValues.status).not.toBe('processing');
  });
});
