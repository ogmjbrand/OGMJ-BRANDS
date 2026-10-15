/**
 * OGMJ BRANDS — Video processing state machine
 *
 * There is no external transcoding/render provider wired up for Video
 * Library uploads (that only exists for the separate AI Video Generator
 * pipeline). "Processing" a library video means confirming the asset it
 * points to is actually reachable — the upload finished and the storage
 * object or external URL still exists — bounded by a timeout, before the
 * video is marked ready. This module is the pure, framework-free part of
 * that state machine so it can be unit tested without a database or
 * network.
 */

export type VideoStatus = 'uploaded' | 'processing' | 'processed' | 'failed';

export class VideoProcessingStateError extends Error {}

/**
 * Throws with a user-facing message when `status` cannot transition to
 * `processing` right now. A video can be (re)started from `uploaded` or
 * from a previous `failed` attempt — never while already `processing` or
 * once it has reached `processed`.
 */
export function assertCanStartProcessing(status: string): void {
  if (status === 'processed') {
    throw new VideoProcessingStateError('Video is already processed');
  }
  if (status === 'processing') {
    throw new VideoProcessingStateError('Video is already being processed');
  }
  if (status !== 'uploaded' && status !== 'failed') {
    throw new VideoProcessingStateError(`Cannot start processing from status "${status}"`);
  }
}

/** Default bound on the asset-reachability check below — never run unbounded inside a serverless request. */
export const VIDEO_PROCESSING_TIMEOUT_MS = 15_000;

/** Rejects with `timeoutMessage` if `promise` hasn't settled within `ms`. */
export function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  }) as Promise<T>;
}
