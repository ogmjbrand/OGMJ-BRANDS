import { describe, it, expect, vi, beforeEach } from 'vitest';

const getSceneRenderStatusMock = vi.fn();

vi.mock('@/lib/video/render-provider', () => ({
  getSceneRenderStatus: (...args: any[]) => getSceneRenderStatusMock(...args),
}));

import { reconcileProjectScenes, timeoutStalePendingScenes, computeAggregateStatus } from '@/lib/video/reconcile-render';

describe('computeAggregateStatus', () => {
  it('is "rendering" while any scene is still pending', () => {
    expect(computeAggregateStatus([{ renderStatus: 'completed' }, { renderStatus: 'pending' }])).toBe('rendering');
  });

  it('is "completed" once all scenes are done and at least one succeeded', () => {
    expect(computeAggregateStatus([{ renderStatus: 'completed' }, { renderStatus: 'failed' }])).toBe('completed');
  });

  it('is "failed" once all scenes are done and none succeeded', () => {
    expect(computeAggregateStatus([{ renderStatus: 'failed' }, { renderStatus: 'failed' }])).toBe('failed');
  });
});

describe('reconcileProjectScenes', () => {
  beforeEach(() => {
    getSceneRenderStatusMock.mockReset();
  });

  it('does not call fal.ai at all when there are no pending scenes', async () => {
    const scenes = [{ renderStatus: 'completed', videoUrl: 'https://x/1.mp4' }];
    const outcome = await reconcileProjectScenes(scenes, null);
    expect(getSceneRenderStatusMock).not.toHaveBeenCalled();
    expect(outcome.changed).toBe(false);
    expect(outcome.newStatus).toBe('completed');
  });

  it('REGRESSION: a scene fal.ai now reports completed is written back, project reaches "completed"', async () => {
    getSceneRenderStatusMock.mockResolvedValue({ status: 'COMPLETED', videoUrl: 'https://x/done.mp4', error: null });
    const scenes = [{ renderStatus: 'pending', renderRequestId: 'req-1' }];
    const outcome = await reconcileProjectScenes(scenes, null);

    expect(outcome.changed).toBe(true);
    expect(outcome.updatedScenes[0].renderStatus).toBe('completed');
    expect(outcome.newStatus).toBe('completed');
    expect(outcome.outputVideoUrl).toBe('https://x/done.mp4');
  });

  it('a scene fal.ai reports failed is recorded as failed, with the aggregate status reflecting it', async () => {
    getSceneRenderStatusMock.mockResolvedValue({ status: 'FAILED', videoUrl: null, error: 'provider error' });
    const scenes = [{ renderStatus: 'pending', renderRequestId: 'req-1' }];
    const outcome = await reconcileProjectScenes(scenes, null);

    expect(outcome.updatedScenes[0].renderStatus).toBe('failed');
    expect(outcome.updatedScenes[0].renderError).toBe('provider error');
    expect(outcome.newStatus).toBe('failed');
  });

  it('a scene still IN_PROGRESS at fal.ai is left pending, project stays "rendering"', async () => {
    getSceneRenderStatusMock.mockResolvedValue({ status: 'IN_PROGRESS', videoUrl: null, error: null });
    const scenes = [{ renderStatus: 'pending', renderRequestId: 'req-1' }];
    const outcome = await reconcileProjectScenes(scenes, null);

    expect(outcome.changed).toBe(false);
    expect(outcome.updatedScenes[0].renderStatus).toBe('pending');
    expect(outcome.newStatus).toBe('rendering');
  });

  it('a multi-scene project with one scene still pending does not prematurely report "completed"', async () => {
    getSceneRenderStatusMock.mockResolvedValueOnce({ status: 'COMPLETED', videoUrl: 'https://x/1.mp4', error: null });
    const scenes = [
      { renderStatus: 'pending', renderRequestId: 'req-1' },
      { renderStatus: 'pending', renderRequestId: 'req-2' },
    ];
    // Only req-1 resolves this call; simulate req-2 still in flight by
    // having the mock resolve IN_PROGRESS for the second call.
    getSceneRenderStatusMock.mockResolvedValueOnce({ status: 'IN_PROGRESS', videoUrl: null, error: null });
    const outcome = await reconcileProjectScenes(scenes, null);

    expect(outcome.newStatus).toBe('rendering');
    expect(outcome.updatedScenes[0].renderStatus).toBe('completed');
    expect(outcome.updatedScenes[1].renderStatus).toBe('pending');
  });
});

describe('timeoutStalePendingScenes', () => {
  it('REGRESSION: force-fails scenes still pending past a timeout, so a project can never render forever', () => {
    const scenes = [{ renderStatus: 'pending', renderRequestId: 'req-1' }, { renderStatus: 'completed' }];
    const result = timeoutStalePendingScenes(scenes);

    expect(result.timedOut).toBe(true);
    expect(result.scenes[0].renderStatus).toBe('failed');
    expect(result.scenes[0].renderError).toBe('Render timed out');
    expect(result.scenes[1].renderStatus).toBe('completed'); // untouched
  });

  it('reports no timeout when nothing is pending', () => {
    const scenes = [{ renderStatus: 'completed' }, { renderStatus: 'failed' }];
    const result = timeoutStalePendingScenes(scenes);
    expect(result.timedOut).toBe(false);
  });
});
