/**
 * OGMJ BRANDS — Voiceover Provider: ElevenLabs text-to-speech (server-only)
 *
 * Unlike fal.ai video rendering, ElevenLabs' TTS endpoint is synchronous —
 * it returns the finished audio bytes directly in the HTTP response, so
 * this needs no webhook/queue architecture. A single scene's narration
 * (a few seconds of audio) generates well within a serverless function's
 * timeout.
 */

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

// "Rachel" — a stable, always-available premade voice on every ElevenLabs
// account. No voice-selection UI exists yet, so every project uses this
// until one is built.
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export function isVoiceoverConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

export interface SynthesizeResult {
  audio: Buffer;
  contentType: string;
}

export async function synthesizeVoiceover(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<SynthesizeResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('No voiceover provider is configured on this deployment');
  }

  const response = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!response.ok) {
    let detail = `ElevenLabs request failed (${response.status})`;
    try {
      const body = await response.json();
      detail = body?.detail?.message || body?.detail || detail;
    } catch {
      // Non-JSON error body — keep the generic status-based message.
    }
    throw new Error(detail);
  }

  const arrayBuffer = await response.arrayBuffer();
  return { audio: Buffer.from(arrayBuffer), contentType: 'audio/mpeg' };
}
