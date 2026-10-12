-- Video upload was entirely unbuilt: zero storage buckets existed in this
-- project, and the "Upload New Video" dropzone on the Videos page had no
-- event handlers at all. This creates the bucket real uploads will land
-- in, private (not public — access is gated by RLS below, same active-
-- membership model already used for the videos table's own RLS and for
-- every API route that touches it).
--
-- file_size_limit is set near the Free-tier project's total storage
-- quota ceiling rather than an arbitrary per-file number, since Supabase
-- Storage itself already enforces the real limiting factor (total quota)
-- on every insert.
--
-- Applied directly to production via the Supabase MCP connector on
-- 2026-10-12; this file documents that change in version control.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  false,
  1073741824, -- 1GB per file
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/x-msvideo', 'video/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Objects are stored at {business_id}/{filename}. Policies mirror the
-- exact same active-membership check every videos API route already
-- uses (business_users.status = 'active'), rather than inventing a
-- separate, stricter permission model for storage specifically.
CREATE POLICY "Business members can read their videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos'
  AND EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
      AND status = 'active'
  )
);

CREATE POLICY "Business members can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos'
  AND EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
      AND status = 'active'
  )
);

CREATE POLICY "Business members can delete their videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos'
  AND EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
      AND status = 'active'
  )
);
