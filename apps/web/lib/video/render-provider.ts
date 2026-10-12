/**
 * OGMJ BRANDS — Video Render Provider Boundary (server-only)
 *
 * No video-generation provider is connected yet. This defines the
 * integration boundary Phase 4 will implement against (Replicate is the
 * recommended provider — see the Phase 1-3 completion report) so the
 * rest of the app (routes, UI) can be written now against a stable
 * contract, without ever faking a successful render in the meantime.
 */

export function isVideoRenderConfigured(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN);
}

export interface RenderSceneInput {
  visualPrompt: string;
  durationSeconds: number;
}

export interface RenderVideoResult {
  videoUrl: string;
}

/**
 * Not implemented until a provider is connected. Phase 4 replaces this
 * body with a real call to the chosen provider — the call sites in the
 * render route are already written against this exact signature.
 */
export async function renderVideoFromScenes(_scenes: RenderSceneInput[]): Promise<RenderVideoResult> {
  throw new Error('No video-generation provider is configured on this deployment');
}
