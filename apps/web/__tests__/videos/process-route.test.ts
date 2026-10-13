import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Regression tests for the "stuck on Processing forever" defect.
 *
 * Root cause: POST /api/videos/[id]/process set status to 'processing'
 * and then did nothing else (a TODO stub) -- no code path anywhere in
 * the app ever transitioned a video to 'processed' or 'failed', so
 * every processed video was stuck showing "Processing..." permanently.
 *
 * These tests prove the fix reaches a terminal status (processed or
 * failed) synchronously and never leaves a video sitting in
 * 'processing' with no further transition.
 */

const videoRow: Record<string, any> = {};
let updateCalls: Array<{ status: string }> = [];

function makeSupabaseMock() {
  return {
    from(table: string) {
      if (table === 'videos') {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async single() {
            return { data: { ...videoRow }, error: videoRow.__notFound ? { message: 'not found' } : null };
          },
          update(values: { status: string; updated_at: string }) {
            updateCalls.push({ status: values.status });
            videoRow.status = values.status;
            return {
              eq() {
                return this;
              },
              select() {
                return this;
              },
              async single() {
                return { data: { ...videoRow }, error: null };
              },
            };
          },
        };
      }
      if (table === 'business_users') {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async single() {
            return { data: videoRow.__noAccess ? null : { role: 'owner' }, error: null };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

vi.mock('@/lib/auth.server', () => ({
  getCurrentUserServer: () => Promise.resolve(videoRow.__unauthenticated ? null : { id: 'user-1', email: 'user@example.com' }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => Promise.resolve(makeSupabaseMock()),
}));

function makeRequest() {
  return new NextRequest('https://ogmjbrands.com/api/videos/video-1/process', { method: 'POST' });
}

function resetVideoRow(overrides: Record<string, any>) {
  for (const key of Object.keys(videoRow)) delete videoRow[key];
  Object.assign(videoRow, { business_id: 'biz-1', status: 'uploaded', file_url: null, source_url: null, ...overrides });
}

describe('POST /api/videos/[id]/process -- reaches a terminal status', () => {
  beforeEach(() => {
    updateCalls = [];
    resetVideoRow({});
  });

  it('rejects unauthenticated requests before touching the database', async () => {
    resetVideoRow({ __unauthenticated: true });
    const { POST } = await import('@/app/api/videos/[id]/process/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'video-1' }) });
    expect(res.status).toBe(401);
    expect(updateCalls).toHaveLength(0);
  });

  it('rejects access for a user with no membership on the business', async () => {
    resetVideoRow({ __noAccess: true });
    const { POST } = await import('@/app/api/videos/[id]/process/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'video-1' }) });
    expect(res.status).toBe(403);
    expect(updateCalls).toHaveLength(0);
  });

  it('refuses to re-process an already-processed video', async () => {
    resetVideoRow({ status: 'processed' });
    const { POST } = await import('@/app/api/videos/[id]/process/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'video-1' }) });
    expect(res.status).toBe(400);
    expect(updateCalls).toHaveLength(0);
  });

  it('refuses a concurrent process call while one is already in flight', async () => {
    resetVideoRow({ status: 'processing' });
    const { POST } = await import('@/app/api/videos/[id]/process/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'video-1' }) });
    expect(res.status).toBe(400);
    expect(updateCalls).toHaveLength(0);
  });

  it('REGRESSION FIX: a video with a file URL reaches status "processed", not stuck on "processing"', async () => {
    resetVideoRow({ status: 'uploaded', file_url: 'https://storage.example.com/video-1.mp4' });
    const { POST } = await import('@/app/api/videos/[id]/process/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'video-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].status).toBe('processed');
    expect(updateCalls[0].status).not.toBe('processing');
  });

  it('REGRESSION FIX: a video with no file or source URL fails loudly instead of hanging on "processing"', async () => {
    resetVideoRow({ status: 'uploaded', file_url: null, source_url: null });
    const { POST } = await import('@/app/api/videos/[id]/process/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'video-1' }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].status).toBe('failed');
    expect(updateCalls[0].status).not.toBe('processing');
  });

  it('accepts a source_url as an alternative to file_url', async () => {
    resetVideoRow({ status: 'uploaded', file_url: null, source_url: 'https://youtube.com/watch?v=abc' });
    const { POST } = await import('@/app/api/videos/[id]/process/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'video-1' }) });
    expect(res.status).toBe(200);
    expect(updateCalls[0].status).toBe('processed');
  });
});
