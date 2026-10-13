import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Regression tests for the voiceover route's write race with concurrent
 * script edits.
 *
 * Previously, this route read the project once at the top of the
 * request, ran a (slow) ElevenLabs call per scene, then wrote
 * `{ ...staleProject.script, scenes: updatedScenes }` back -- based on
 * the pre-generation snapshot. A "Save edits" PUT landing in between
 * would get silently discarded by this write, since it always reused
 * the scenes array captured before synthesis started.
 *
 * The fix re-fetches the row immediately before the final write and
 * merges only the voiceover-specific fields onto the CURRENT scenes
 * (matched by sceneNumber), so a concurrent edit to other scene fields
 * survives instead of being clobbered.
 */

const projectRow: Record<string, any> = {};
const uploadCalls: string[] = [];

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
          select(cols?: string) {
            return {
              eq() {
                return {
                  async single() {
                    if (cols === 'script, updated_at') {
                      return { data: { script: projectRow.script, updated_at: projectRow.updated_at }, error: null };
                    }
                    return { data: { ...projectRow }, error: null };
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
    storage: {
      from() {
        return {
          async upload(path: string) {
            uploadCalls.push(path);
            return { error: null };
          },
          async createSignedUrl(path: string) {
            return { data: { signedUrl: `https://storage.example.com/${path}` }, error: null };
          },
        };
      },
    },
  };
}

vi.mock('@/lib/auth.server', () => ({
  getCurrentUserServer: () => Promise.resolve({ id: 'user-1', email: 'user@example.com' }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => Promise.resolve(makeSupabaseMock()),
}));

vi.mock('@/lib/audio/voiceover-provider', () => ({
  isVoiceoverConfigured: () => true,
  synthesizeVoiceover: vi.fn(async () => ({ audio: Buffer.from('fake-audio'), contentType: 'audio/mpeg' })),
}));

function makeRequest() {
  return new NextRequest('https://ogmjbrands.com/api/videos/ai/projects/proj-1/voiceover', { method: 'POST' });
}

function resetProjectRow(overrides: Record<string, any> = {}) {
  for (const key of Object.keys(projectRow)) delete projectRow[key];
  Object.assign(
    projectRow,
    {
      id: 'proj-1',
      business_id: 'biz-1',
      script: { scenes: [{ sceneNumber: 1, narration: 'original narration' }] },
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    overrides
  );
  uploadCalls.length = 0;
}

describe('POST /api/videos/ai/projects/[id]/voiceover', () => {
  beforeEach(() => {
    resetProjectRow();
  });

  it('writes the voiceover result onto the scene when nothing else changed', async () => {
    const { POST } = await import('@/app/api/videos/ai/projects/[id]/voiceover/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'proj-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.script.scenes[0].voiceoverStatus).toBe('completed');
    expect(body.data.script.scenes[0].voiceoverUrl).toContain('scene-0');
  });

  it('REGRESSION FIX: a concurrent script edit during synthesis is preserved, not clobbered by the stale pre-generation snapshot', async () => {
    const { POST } = await import('@/app/api/videos/ai/projects/[id]/voiceover/route');

    // Simulate a "Save edits" PUT landing while ElevenLabs synthesis is
    // still in flight: mutate the row's narration + updated_at directly,
    // the same way a concurrent request would, before this route reaches
    // its final re-fetch-and-write.
    const originalSynthesize = (await import('@/lib/audio/voiceover-provider')).synthesizeVoiceover as any;
    originalSynthesize.mockImplementationOnce(async () => {
      projectRow.script = { scenes: [{ sceneNumber: 1, narration: 'edited during synthesis' }] };
      projectRow.updated_at = '2026-01-01T00:05:00.000Z';
      return { audio: Buffer.from('fake-audio'), contentType: 'audio/mpeg' };
    });

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'proj-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    // The concurrent edit must survive...
    expect(body.data.script.scenes[0].narration).toBe('edited during synthesis');
    // ...AND the voiceover result must still have been applied, not lost.
    expect(body.data.script.scenes[0].voiceoverStatus).toBe('completed');
    expect(body.data.script.scenes[0].voiceoverUrl).toBeTruthy();
  });

  it('a scene synthesis failure is recorded as failed without losing other scenes', async () => {
    resetProjectRow({
      script: {
        scenes: [
          { sceneNumber: 1, narration: 'ok scene' },
          { sceneNumber: 2, narration: 'bad scene' },
        ],
      },
    });
    const { synthesizeVoiceover } = (await import('@/lib/audio/voiceover-provider')) as any;
    synthesizeVoiceover
      .mockImplementationOnce(async () => ({ audio: Buffer.from('fake-audio'), contentType: 'audio/mpeg' }))
      .mockImplementationOnce(async () => { throw new Error('ElevenLabs rate limited'); });

    const { POST } = await import('@/app/api/videos/ai/projects/[id]/voiceover/route');
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'proj-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.script.scenes[0].voiceoverStatus).toBe('completed');
    expect(body.data.script.scenes[1].voiceoverStatus).toBe('failed');
    expect(body.data.script.scenes[1].voiceoverError).toBe('ElevenLabs rate limited');
  });
});
