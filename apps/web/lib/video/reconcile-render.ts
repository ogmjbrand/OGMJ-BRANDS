/**
 * OGMJ BRANDS — AI video render reconciliation (shared logic)
 *
 * Extracted from apps/web/app/api/videos/ai/projects/[id]/render/status/route.ts
 * so the exact same reconciliation logic can be reused by a scheduled
 * server-side fallback (apps/web/app/api/cron/reconcile-video-renders),
 * not just the user-triggered, browser-polled version of this route.
 *
 * Why a server-side path is needed at all: the webhook
 * (render/webhook/route.ts) is the primary way a finished render gets
 * recorded, but a dropped delivery leaves a project stuck at
 * status='rendering' forever unless something else checks fal.ai
 * directly. Before this file existed, the only fallback was a
 * client-side poll in ScriptWorkspace.tsx that only runs while that
 * specific project is open in a mounted tab, capped at ~5 minutes --
 * closing the tab, switching projects, or simply waiting past that cap
 * permanently stops it, with no other mechanism to pick it back up.
 */

import { getSceneRenderStatus } from './render-provider';

export type SceneRenderStatus = 'pending' | 'completed' | 'failed';
export type ProjectRenderStatus = 'rendering' | 'completed' | 'failed';

export interface ReconcileOutcome {
  /** True if anything about the scenes or aggregate status actually changed. */
  changed: boolean;
  updatedScenes: Array<Record<string, any>>;
  newStatus: ProjectRenderStatus;
  outputVideoUrl: string | null;
}

export function computeAggregateStatus(scenes: Array<Record<string, any>>): ProjectRenderStatus {
  const allDone = scenes.every((s) => s.renderStatus === 'completed' || s.renderStatus === 'failed');
  if (!allDone) return 'rendering';
  const anyCompleted = scenes.some((s) => s.renderStatus === 'completed');
  return anyCompleted ? 'completed' : 'failed';
}

/**
 * Re-queries fal.ai directly for every scene still 'pending' and folds
 * the results back into the scene list, then recomputes the project's
 * aggregate status. Scenes that are already completed/failed, or that
 * have no renderRequestId yet, are left untouched.
 */
export async function reconcileProjectScenes(
  scenes: Array<Record<string, any>>,
  existingOutputVideoUrl: string | null
): Promise<ReconcileOutcome> {
  const pendingIndices = scenes
    .map((scene, index) => ({ scene, index }))
    .filter(({ scene }) => scene.renderStatus === 'pending' && scene.renderRequestId);

  if (pendingIndices.length === 0) {
    return {
      changed: false,
      updatedScenes: scenes,
      newStatus: computeAggregateStatus(scenes),
      outputVideoUrl: existingOutputVideoUrl,
    };
  }

  const results = await Promise.allSettled(
    pendingIndices.map(({ scene }) => getSceneRenderStatus(scene.renderRequestId))
  );

  let changed = false;
  const updatedScenes = [...scenes];
  pendingIndices.forEach(({ index }, i) => {
    const result = results[i];
    if (result.status !== 'fulfilled') return;
    const { status, videoUrl, error } = result.value;
    if (status === 'COMPLETED' && videoUrl) {
      updatedScenes[index] = { ...updatedScenes[index], renderStatus: 'completed', videoUrl, renderError: undefined };
      changed = true;
    } else if (status === 'FAILED') {
      updatedScenes[index] = { ...updatedScenes[index], renderStatus: 'failed', renderError: error || 'Render failed' };
      changed = true;
    }
    // IN_QUEUE / IN_PROGRESS / UNKNOWN -- leave as pending, nothing to update yet.
  });

  const newStatus = computeAggregateStatus(updatedScenes);
  const outputVideoUrl =
    newStatus === 'completed'
      ? updatedScenes.find((s) => s.videoUrl)?.videoUrl ?? existingOutputVideoUrl
      : existingOutputVideoUrl;

  return { changed, updatedScenes, newStatus, outputVideoUrl };
}

/**
 * Force-closes any scene still 'pending' after this function is called.
 * Only meant to be used once a caller has already confirmed, via
 * reconcileProjectScenes, that fal.ai itself still hasn't resolved the
 * job AND the project has been rendering past a timeout threshold --
 * never applied to a project that's merely slow but still within its
 * normal window.
 */
export function timeoutStalePendingScenes(
  scenes: Array<Record<string, any>>
): { scenes: Array<Record<string, any>>; timedOut: boolean } {
  let timedOut = false;
  const result = scenes.map((scene) => {
    if (scene.renderStatus === 'pending') {
      timedOut = true;
      return { ...scene, renderStatus: 'failed', renderError: 'Render timed out' };
    }
    return scene;
  });
  return { scenes: result, timedOut };
}
