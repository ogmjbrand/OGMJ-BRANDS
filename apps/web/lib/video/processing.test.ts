import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertCanStartProcessing, VideoProcessingStateError, withTimeout } from './processing.ts';

test('assertCanStartProcessing allows starting from "uploaded"', () => {
  assert.doesNotThrow(() => assertCanStartProcessing('uploaded'));
});

test('assertCanStartProcessing allows retrying from "failed"', () => {
  assert.doesNotThrow(() => assertCanStartProcessing('failed'));
});

test('assertCanStartProcessing rejects starting a second time while "processing"', () => {
  assert.throws(() => assertCanStartProcessing('processing'), VideoProcessingStateError);
});

test('assertCanStartProcessing rejects re-processing once "processed"', () => {
  assert.throws(() => assertCanStartProcessing('processed'), VideoProcessingStateError);
});

test('assertCanStartProcessing rejects an unknown status rather than silently proceeding', () => {
  assert.throws(() => assertCanStartProcessing('some-unexpected-value'), VideoProcessingStateError);
});

test('withTimeout resolves with the underlying value when it settles in time', async () => {
  const result = await withTimeout(Promise.resolve('done'), 1000, 'should not time out');
  assert.equal(result, 'done');
});

test('withTimeout rejects with the timeout message when the job hangs — this is the bug: the old /process route never had any such bound, so a hung check (or a request that never got dispatched at all) left the video stuck on "processing" forever', async () => {
  const neverSettles = new Promise(() => {});
  await assert.rejects(
    withTimeout(neverSettles, 50, 'Timed out verifying the video asset'),
    /Timed out verifying the video asset/
  );
});

test('withTimeout propagates the underlying rejection when the job fails fast', async () => {
  await assert.rejects(
    withTimeout(Promise.reject(new Error('storage object not found')), 1000, 'should not time out'),
    /storage object not found/
  );
});
