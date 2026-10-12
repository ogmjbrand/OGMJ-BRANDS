/**
 * OGMJ BRANDS — Transcription Provider Boundary (server-only)
 *
 * No transcription provider is connected yet (AssemblyAI or Deepgram are
 * recommended — see the Phase 1-3 completion report). This defines the
 * integration boundary Phase 5 implements against.
 */

export function isTranscriptionConfigured(): boolean {
  return Boolean(process.env.ASSEMBLYAI_API_KEY || process.env.DEEPGRAM_API_KEY);
}

export interface TranscriptionResult {
  text: string;
  segments: { start: number; end: number; text: string }[];
}

export async function transcribeVideo(_fileUrl: string): Promise<TranscriptionResult> {
  throw new Error('No transcription provider is configured on this deployment');
}
