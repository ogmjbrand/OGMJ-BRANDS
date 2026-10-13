import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Regression tests for POST /api/videos/ai/projects/[id]/render having no
 * server-side guard against duplicate submission.
 *
 * Root cause: the UI only disables "Generate video" while
 * status === 'rendering' (client-side only). Nothing server-side stopped
 * a second call -- a second tab, a fast double-click before React
 * re-renders, or a direct API call -- from resubmitting every scene while
 * a first submission was still in flight. Each submission generates a
 * brand-new render_webhook_token and unconditionally overwrites the one
 * already in use, so the first submission's real webhook (arriving later
 * with the now-stale token) gets permanently rejected by
 * complete_video_scene_render's token check -- silently losing that
 * render, on top of paying the provider twice for the same scenes.
 *
 * Fix: reject outright with 409 if status is already 'rendering', and
 * atomically claim the 'rendering' status (via an updated_at precondition)
 * BEFORE calling the provider at all, so a losing race never pays for a
 * submission it can't record.
 */

const projectRow: Record<string, any> = {};
const submitSceneRenderMock = vi.fn();
let simulateConcurrentWriteOnNextRead = false;

function makeSupabaseMock() {
  return {
    from(table: string) {
      if (table === 'business_users') {
        return {
          select() { return this; },
          eq() { return this; },
          async single() {
            return { data: projectRow.__noAccess ? null : { role: 'owner' }, error: null };
          },
        };
      }
      if (table === 'ai_video_projects') {
        return {
          select() {
            return {
              eq() {
                return {
                  async single() {
                    const snapshot = { ...projectRow };
                    if (simulateConcurrentWriteOnNextRead) {
                      // Simulate another request's claim landing right
                      // after this request reads its snapshot, before
                      // this request reaches its own claim update.
                      projectRow.updated_at = 'concurrent-write-timestamp';
                      simulateConcurrentWriteOnNextRead = false;
                    }
                    return { data: snapshot, error: null };
                  },
                };
              },
            };
          },
          update(values: Record<string, any>) {
            const filters: Record<string, any> = {};
            const builder: any = {
              eq(col: string, val: any) {
                filters[col] = val;
                return builder;
              },
              select() {
                return {
                  async single() {
                    if ('updated_at' in filters && filters.updated_at !== projectRow.updated_at) {
                      return { data: null, error: { code: 'PGRST116', message: 'no rows found' } };
                    }
                    Object.assign(projectRow, values);
                    return { data: { ...projectRow }, error: null };
                  },
                };
              },
            };
            return builder;
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

vi.mock('@/lib/auth.server', () => ({
  getCurrentUserServer: () => Promise.resolve({ id: 'user-1', email: 'user@example.com' }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => Promise.resolve(makeSupabaseMock()),
}));

vi.mock('@/lib/video/render-provider', () => ({
  isVideoRenderConfigured: () => true,
  submitSceneRender: (...args: any[]) => submitSceneRenderMock(...args),
}));

function makeRequest() {
  return new NextRequest('https://ogmjbrands.com/api/videos/ai/projects/proj-1/render', { method: 'POST' });
}

function resetProjectRow(overrides: Record<string, any> = {}) {
  for (const key of Object.keys(projectRow)) delete projectRow[key];
  Object.assign(
    projectRow,
    {
      id: 'proj-1',
      business_id: 'biz-1',
      status: 'script_ready',
      aspect_ratio: '16:9',
      script: { scenes: [{ visualPrompt: 'a cat', durationSeconds: 5 }] },
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    overrides
  );
  simulateConcurrentWriteOnNextRead = false;
  submitSceneRenderMock.mockReset();
  submitSceneRenderMock.mockResolvedValue({ requestId: 'fal-req-1' });
}

describe('POST /api/videos/ai/projects/[id]/render', () => {
  beforeEach(() => {
    resetProjectRow();
  });

  it('submits scenes and sets status to rendering on the happy path', async () => {
    const { POST } = await import('@/app/api/videos/ai/projects/[id]/render/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'proj-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.status).toBe('rendering');
    expect(submitSceneRenderMock).toHaveBeenCalledTimes(1);
  });

  it('REGRESSION FIX: rejects with 409 without calling the provider when already rendering', async () => {
    resetProjectRow({ status: 'rendering' });
    const { POST } = await import('@/app/api/videos/ai/projects/[id]/render/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'proj-1' }) });

    expect(res.status).toBe(409);
    expect(submitSceneRenderMock).not.toHaveBeenCalled();
  });

  it('REGRESSION FIX: a losing race on the atomic claim never calls the provider (no wasted paid submission)', async () => {
    // Both "requests" read the same not-yet-rendering snapshot; this one
    // simulates losing the claim because another request's write landed
    // first, changing updated_at out from under it.
    simulateConcurrentWriteOnNextRead = true;

    const { POST } = await import('@/app/api/videos/ai/projects/[id]/render/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'proj-1' }) });

    expect(res.status).toBe(409);
    // The whole point of claiming before submitting: the loser must never
    // reach fal.ai at all, so nothing is paid for that can't be recorded.
    expect(submitSceneRenderMock).not.toHaveBeenCalled();
  });

  it('sets status to failed and returns 502 when every scene fails to submit', async () => {
    submitSceneRenderMock.mockRejectedValue(new Error('fal.ai request failed (500)'));
    const { POST } = await import('@/app/api/videos/ai/projects/[id]/render/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'proj-1' }) });
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.data.status).toBe('failed');
    expect(body.data.render_webhook_token).toBeNull();
  });

  it('rejects access for a user with no membership on the business', async () => {
    resetProjectRow({ __noAccess: true });
    const { POST } = await import('@/app/api/videos/ai/projects/[id]/render/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'proj-1' }) });
    expect(res.status).toBe(403);
    expect(submitSceneRenderMock).not.toHaveBeenCalled();
  });
});
