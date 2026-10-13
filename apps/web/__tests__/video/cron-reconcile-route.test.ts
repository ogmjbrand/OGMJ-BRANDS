import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Regression tests for the scheduled server-side fallback that
 * reconciles AI video projects stuck at status='rendering' -- the
 * mechanism that's supposed to catch a dropped webhook even when no
 * browser tab is open to run the client-side poll, and that force-closes
 * a render that's been stuck so long fal.ai itself never resolved it.
 */

let projectsTable: Array<Record<string, any>> = [];
const updateCalls: Array<{ id: string; values: any }> = [];
const getSceneRenderStatusMock = vi.fn();

vi.mock('@/lib/video/render-provider', () => ({
  isVideoRenderConfigured: () => true,
  getSceneRenderStatus: (...args: any[]) => getSceneRenderStatusMock(...args),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from(table: string) {
      if (table !== 'ai_video_projects') throw new Error(`unexpected table ${table}`);
      return {
        select() {
          return {
            async eq(column: string, value: string) {
              if (column !== 'status' || value !== 'rendering') return { data: [], error: null };
              return { data: projectsTable, error: null };
            },
          };
        },
        update(values: any) {
          return {
            async eq(column: string, id: string) {
              updateCalls.push({ id, values });
              const row = projectsTable.find((p) => p.id === id);
              if (row) Object.assign(row, values);
              return { error: null };
            },
          };
        },
      };
    },
  }),
}));

function makeRequest(secret?: string) {
  const headers: Record<string, string> = {};
  if (secret !== undefined) headers['authorization'] = `Bearer ${secret}`;
  return new NextRequest('https://ogmjbrands.com/api/cron/reconcile-video-renders', { headers });
}

describe('GET /api/cron/reconcile-video-renders', () => {
  const REAL_SECRET = 'test-cron-secret';

  beforeEach(() => {
    process.env.CRON_SECRET = REAL_SECRET;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    projectsTable = [];
    updateCalls.length = 0;
    getSceneRenderStatusMock.mockReset();
  });

  it('rejects a request with no secret, before touching the database', async () => {
    delete process.env.CRON_SECRET; // fail closed if unconfigured too
    const { GET } = await import('@/app/api/cron/reconcile-video-renders/route');
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('rejects a request with the wrong secret', async () => {
    const { GET } = await import('@/app/api/cron/reconcile-video-renders/route');
    const res = await GET(makeRequest('wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('REGRESSION FIX: reconciles a project whose scene fal.ai now reports completed, with no browser involved', async () => {
    projectsTable = [
      {
        id: 'proj-1',
        script: { scenes: [{ renderStatus: 'pending', renderRequestId: 'req-1' }] },
        output_video_url: null,
        updated_at: new Date().toISOString(),
      },
    ];
    getSceneRenderStatusMock.mockResolvedValue({ status: 'COMPLETED', videoUrl: 'https://x/done.mp4', error: null });

    const { GET } = await import('@/app/api/cron/reconcile-video-renders/route');
    const res = await GET(makeRequest(REAL_SECRET));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.reconciled).toBe(1);
    expect(body.timedOut).toBe(0);
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].values.status).toBe('completed');
  });

  it('leaves a recent, still-pending project alone -- no update, not counted', async () => {
    projectsTable = [
      {
        id: 'proj-2',
        script: { scenes: [{ renderStatus: 'pending', renderRequestId: 'req-2' }] },
        output_video_url: null,
        updated_at: new Date().toISOString(), // just started
      },
    ];
    getSceneRenderStatusMock.mockResolvedValue({ status: 'IN_PROGRESS', videoUrl: null, error: null });

    const { GET } = await import('@/app/api/cron/reconcile-video-renders/route');
    const res = await GET(makeRequest(REAL_SECRET));
    const body = await res.json();

    expect(body.reconciled).toBe(0);
    expect(updateCalls).toHaveLength(0);
  });

  it('REGRESSION FIX: force-fails a project stuck "rendering" well past the timeout, even though fal.ai still has nothing to report', async () => {
    const fortyFiveMinutesAgo = new Date(Date.now() - 46 * 60 * 1000).toISOString();
    projectsTable = [
      {
        id: 'proj-3',
        script: { scenes: [{ renderStatus: 'pending', renderRequestId: 'req-3' }] },
        output_video_url: null,
        updated_at: fortyFiveMinutesAgo,
      },
    ];
    // fal.ai itself still has nothing new to say -- this is exactly the
    // "fal.ai never resolves the job" case the timeout exists for.
    getSceneRenderStatusMock.mockResolvedValue({ status: 'IN_PROGRESS', videoUrl: null, error: null });

    const { GET } = await import('@/app/api/cron/reconcile-video-renders/route');
    const res = await GET(makeRequest(REAL_SECRET));
    const body = await res.json();

    expect(body.reconciled).toBe(1);
    expect(body.timedOut).toBe(1);
    expect(updateCalls[0].values.status).toBe('failed');
    const updatedScene = updateCalls[0].values.script.scenes[0];
    expect(updatedScene.renderStatus).toBe('failed');
    expect(updatedScene.renderError).toBe('Render timed out');
  });

  it('does not force a timeout on a project fal.ai actually resolves during the same check', async () => {
    const fortyFiveMinutesAgo = new Date(Date.now() - 46 * 60 * 1000).toISOString();
    projectsTable = [
      {
        id: 'proj-4',
        script: { scenes: [{ renderStatus: 'pending', renderRequestId: 'req-4' }] },
        output_video_url: null,
        updated_at: fortyFiveMinutesAgo,
      },
    ];
    // Old enough to time out, but fal.ai actually completes it on this
    // very check -- must not be force-failed.
    getSceneRenderStatusMock.mockResolvedValue({ status: 'COMPLETED', videoUrl: 'https://x/late.mp4', error: null });

    const { GET } = await import('@/app/api/cron/reconcile-video-renders/route');
    const res = await GET(makeRequest(REAL_SECRET));
    const body = await res.json();

    expect(body.reconciled).toBe(1);
    expect(body.timedOut).toBe(0);
    expect(updateCalls[0].values.status).toBe('completed');
  });
});
