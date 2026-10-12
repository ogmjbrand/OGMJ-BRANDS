/**
 * OGMJ BRANDS — Video Render Provider: fal.ai (server-only)
 *
 * fal.ai's queue API is async-by-design (a single video generation can
 * take 30-120+ seconds, well past what a Vercel serverless function can
 * hold open). Jobs are submitted with a webhook URL and this function
 * returns immediately with a request id — the webhook route
 * (app/api/videos/ai/projects/[id]/render/webhook) receives the result
 * later and writes it via the complete_video_scene_render DB function.
 *
 * Model: fal-ai/kling-video/v1.6/standard/text-to-video — chosen because
 * it accepts duration and aspect_ratio directly, matching this app's
 * data model, without needing a per-model parameter mapping layer.
 */

const FAL_MODEL = 'fal-ai/kling-video/v1.6/standard/text-to-video';
const FAL_QUEUE_BASE = 'https://queue.fal.run';

export function isVideoRenderConfigured(): boolean {
  return Boolean(process.env.FAL_KEY);
}

export interface RenderSceneInput {
  visualPrompt: string;
  durationSeconds: number;
}

export interface SubmitRenderResult {
  requestId: string;
}

/**
 * Submits one scene for async rendering and returns immediately with the
 * provider's request id. The actual video is delivered later via
 * webhookUrl, not returned here.
 */
export async function submitSceneRender(
  scene: RenderSceneInput,
  webhookUrl: string,
  aspectRatio: '16:9' | '9:16' | '1:1'
): Promise<SubmitRenderResult> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    throw new Error('No video-generation provider is configured on this deployment');
  }

  // fal.ai's Kling duration parameter is a fixed-choice string, not a
  // free integer — round to the nearest supported value rather than
  // sending a value the model will reject.
  const duration = scene.durationSeconds <= 5 ? '5' : '10';

  const response = await fetch(
    `${FAL_QUEUE_BASE}/${FAL_MODEL}?fal_webhook=${encodeURIComponent(webhookUrl)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: scene.visualPrompt,
        duration,
        aspect_ratio: aspectRatio,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || `fal.ai request failed (${response.status})`);
  }

  const requestId = data?.request_id;
  if (!requestId) {
    throw new Error('fal.ai did not return a request id');
  }

  return { requestId };
}

/**
 * Best-effort extraction of a video URL from fal.ai's webhook payload.
 * The exact nesting can vary slightly by model version, so this checks
 * the common shapes rather than assuming one rigid path.
 */
export function extractVideoUrlFromWebhookPayload(payload: any): string | null {
  const candidates = [
    payload?.payload?.video?.url,
    payload?.video?.url,
    payload?.payload?.video_url,
    payload?.video_url,
  ];
  return candidates.find((c) => typeof c === 'string' && c.length > 0) ?? null;
}
