-- Voiceover audio (ElevenLabs text-to-speech output for AI Video Studio
-- scene narration) needs somewhere to live. No audio bucket existed —
-- only the private 'videos' bucket, scoped to video MIME types. This
-- mirrors that bucket's exact structure and RLS model (same active-
-- membership check already used everywhere else) rather than inventing
-- a new permission model for audio specifically.
--
-- Applied directly to production via the Supabase MCP connector on
-- 2026-10-12; this file documents that change in version control.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voiceovers',
  'voiceovers',
  false,
  26214400, -- 25MB per file — generous for a single scene's narration audio
  ARRAY['audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- Objects are stored at {business_id}/{project_id}/scene-{n}-{timestamp}.mp3
CREATE POLICY "Business members can read their voiceovers"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voiceovers'
  AND EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
      AND status = 'active'
  )
);

CREATE POLICY "Business members can upload voiceovers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voiceovers'
  AND EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
      AND status = 'active'
  )
);

CREATE POLICY "Business members can delete their voiceovers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voiceovers'
  AND EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
      AND status = 'active'
  )
);
