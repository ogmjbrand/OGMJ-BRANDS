import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { isVoiceoverConfigured, synthesizeVoiceover } from '@/lib/audio/voiceover-provider';

// Signed URLs don't expire for 10 years — there's no voice-selection or
// regeneration-aware refresh endpoint yet, so the URL saved on the scene
// needs to keep working on its own for the life of the project.
const SIGNED_URL_TTL_SECONDS = 10 * 365 * 24 * 60 * 60;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServerClient();

  const { data: project, error: fetchError } = await supabase
    .from('ai_video_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from('business_users')
    .select('role')
    .eq('business_id', (project as any).business_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Never pretend narration audio exists when no provider is configured.
  if (!isVoiceoverConfigured()) {
    return NextResponse.json(
      {
        error: 'No voiceover provider is configured on this deployment',
        hint: 'ELEVENLABS_API_KEY is not set. Your script is saved and ready — voiceovers will work once a provider is connected.',
      },
      { status: 503 }
    );
  }

  const scenes = ((project as any).script?.scenes || []) as { narration: string }[];
  if (scenes.length === 0) {
    return NextResponse.json({ error: 'This project has no scenes to voice' }, { status: 400 });
  }

  const businessId = (project as any).business_id;

  // Each scene's synthesis is independent — one scene's ElevenLabs call
  // failing must not lose the audio already generated for other scenes.
  const results = await Promise.allSettled(
    scenes.map(async (scene, index) => {
      const { audio, contentType } = await synthesizeVoiceover(scene.narration);
      const path = `${businessId}/${id}/scene-${index}-${Date.now()}.mp3`;

      const { error: uploadError } = await supabase.storage
        .from('voiceovers')
        .upload(path, audio, { contentType, upsert: false });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: signed, error: signError } = await supabase.storage
        .from('voiceovers')
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

      if (signError || !signed?.signedUrl) {
        throw new Error(signError?.message || 'Failed to create a signed URL for the generated audio');
      }

      return signed.signedUrl;
    })
  );

  // Index -> result, keyed by the scene's own sceneNumber rather than raw
  // array position. ElevenLabs synthesis takes long enough that a
  // concurrent "Save edits" call can land in between -- re-reading the
  // scenes fresh below (instead of reusing this stale `scenes` array) and
  // merging by sceneNumber means a scene the user edited in the meantime
  // keeps that edit, while still picking up the voiceover result for it.
  const voiceoverBySceneNumber = new Map<number, { status: 'completed' | 'failed'; voiceoverUrl?: string; voiceoverError?: string }>();
  scenes.forEach((scene, index) => {
    const result = results[index];
    const sceneNumber = (scene as any).sceneNumber ?? index + 1;
    if (result.status === 'fulfilled') {
      voiceoverBySceneNumber.set(sceneNumber, { status: 'completed', voiceoverUrl: result.value });
    } else {
      const message = result.reason instanceof Error ? result.reason.message : 'Failed to generate voiceover for this scene';
      voiceoverBySceneNumber.set(sceneNumber, { status: 'failed', voiceoverError: message });
    }
  });

  const allFailed = results.every((r) => r.status === 'rejected');

  // Re-fetch immediately before writing -- not the `project` read at the
  // top of this request, which can now be stale -- so a concurrent edit
  // to narration/onScreenText/etc. during the ElevenLabs calls survives
  // instead of being silently overwritten by the pre-generation snapshot.
  const { data: currentProject, error: refetchError } = await supabase
    .from('ai_video_projects')
    .select('script, updated_at')
    .eq('id', id)
    .single();

  if (refetchError || !currentProject) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const currentScenes = (((currentProject as any).script?.scenes || []) as Array<Record<string, any>>);
  const mergedScenes = currentScenes.map((scene, index) => {
    const sceneNumber = scene.sceneNumber ?? index + 1;
    const voiceover = voiceoverBySceneNumber.get(sceneNumber);
    if (!voiceover) return scene;
    return {
      ...scene,
      voiceoverStatus: voiceover.status,
      voiceoverUrl: voiceover.voiceoverUrl,
      voiceoverError: voiceover.voiceoverError,
    };
  });

  const { data: updated, error: updateError } = await (supabase as any)
    .from('ai_video_projects')
    .update({
      script: { ...(currentProject as any).script, scenes: mergedScenes },
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('updated_at', (currentProject as any).updated_at)
    .select()
    .single();

  if (updateError) {
    if (updateError.code === 'PGRST116') {
      return NextResponse.json(
        {
          error: 'This project changed again right as voiceovers finished. Reload and retry -- the generated audio was not saved.',
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: updated }, { status: allFailed ? 502 : 200 });
}
