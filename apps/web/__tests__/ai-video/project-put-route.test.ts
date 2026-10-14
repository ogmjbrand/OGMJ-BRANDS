import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Regression tests for a lost-update race on ai_video_projects.script:
 *
 * PUT /api/videos/ai/projects/[id] previously overwrote the whole `script`
 * column unconditionally with whatever the client sent. If a voiceover or
 * render job finished and wrote new scene data (voiceoverUrl, videoUrl,
 * renderStatus) between when the client fetched its local copy and when
 * it saved an edit, that save would silently clobber the newer data with
 * no error raised -- a real, reproducible lost update, not speculative
 * (confirmed via code read: ScriptWorkspace.tsx's "Save edits" and
 * "Generate voiceovers" buttons are gated by independent loading flags,
 * so both requests can genuinely be in flight at once).
 *
 * The fix adds an optional optimistic-concurrency check: when the client
 * sends `expectedUpdatedAt`, the write only applies if the row's
 * `updated_at` still matches, otherwise it fails loudly (409) instead of
 * guessing.
 */

const projectRow: Record<string, any> = {};

function makeSupabaseMock() {
  return {
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
                    return {
                      data: projectRow.__notFound ? null : { ...projectRow },
                      error: projectRow.__notFound ? { message: 'not found' } : null,
                    };
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
                    if (filters.id !== projectRow.id) {
                      return { data: null, error: { code: 'PGRST116', message: 'no rows found' } };
                    }
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

function makeRequest(body: Record<string, any>) {
  return new NextRequest('https://ogmjbrands.com/api/videos/ai/projects/proj-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function resetProjectRow(overrides: Record<string, any> = {}) {
  for (const key of Object.keys(projectRow)) delete projectRow[key];
  Object.assign(projectRow, {
    id: 'proj-1',
    business_id: 'biz-1',
    script: { scenes: [{ sceneNumber: 1, narration: 'original' }] },
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });
}

describe('PUT /api/videos/ai/projects/[id]', () => {
  beforeEach(() => {
    resetProjectRow();
  });

  it('saves when no expectedUpdatedAt is sent (backward compatible)', async () => {
    const { PUT } = await import('@/app/api/videos/ai/projects/[id]/route');
    const res = await PUT(makeRequest({ script: { scenes: [{ sceneNumber: 1, narration: 'edited' }] } }), {
      params: Promise.resolve({ id: 'proj-1' }),
    });
    expect(res.status).toBe(200);
    expect(projectRow.script.scenes[0].narration).toBe('edited');
  });

  it('saves when expectedUpdatedAt matches the row currently in the database', async () => {
    const { PUT } = await import('@/app/api/videos/ai/projects/[id]/route');
    const res = await PUT(
      makeRequest({
        script: { scenes: [{ sceneNumber: 1, narration: 'edited' }] },
        expectedUpdatedAt: '2026-01-01T00:00:00.000Z',
      }),
      { params: Promise.resolve({ id: 'proj-1' }) }
    );
    expect(res.status).toBe(200);
    expect(projectRow.script.scenes[0].narration).toBe('edited');
  });

  it('REGRESSION FIX: rejects with 409 instead of silently overwriting when the row changed since the client fetched it', async () => {
    // Simulate a voiceover job finishing and bumping updated_at + scene
    // data in between the client's fetch and this save -- exactly the
    // race from the bug report.
    projectRow.updated_at = '2026-01-01T00:05:00.000Z';
    projectRow.script = { scenes: [{ sceneNumber: 1, narration: 'original', voiceoverStatus: 'completed', voiceoverUrl: 'https://x/1.mp3' }] };

    const { PUT } = await import('@/app/api/videos/ai/projects/[id]/route');
    const res = await PUT(
      makeRequest({
        // Client's stale local copy, built before the voiceover update,
        // with no voiceoverUrl on it.
        script: { scenes: [{ sceneNumber: 1, narration: 'edited locally' }] },
        expectedUpdatedAt: '2026-01-01T00:00:00.000Z', // the client's stale timestamp
      }),
      { params: Promise.resolve({ id: 'proj-1' }) }
    );

    expect(res.status).toBe(409);
    // The voiceover data must survive -- the stale write must NOT have
    // been applied.
    expect(projectRow.script.scenes[0].voiceoverUrl).toBe('https://x/1.mp3');
    expect(projectRow.script.scenes[0].narration).toBe('original');
  });
});
