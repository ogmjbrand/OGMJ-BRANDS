-- Phase 3 (OGMJ BRANDS Advanced Website Builder): direct image upload for
-- the visual editor's Assets panel/Inspector image field. Until now there
-- was no storage bucket for website media at all (only `videos` and
-- `voiceovers` exist, each restricted to those mime types) -- the editor's
-- AssetPicker could only "add an image by URL" pointing at an
-- already-hosted file, never a real upload. See apps/web/lib/document-model
-- (AssetRef) and apps/web/components/editor/AssetPicker.tsx.
--
-- PUBLIC, unlike `videos`/`voiceovers` -- deliberately, not an oversight.
-- Website media is embedded directly into rendered HTML (<img src>) and
-- served to anonymous visitors of a PUBLISHED site, so a private bucket
-- gated by business-membership RLS would make every image on a live site
-- unreadable by the public it's published for. A public Supabase Storage
-- bucket serves objects at a permanent, unauthenticated URL
-- (/storage/v1/object/public/<bucket>/<path>) without consulting
-- storage.objects RLS for that path at all -- RLS below instead gates the
-- WRITE side only (insert/update/delete), using the exact same
-- business-membership check (business_users.status = 'active') the
-- videos/voiceovers buckets and every builder API route already use. A
-- read policy is included anyway for the authenticated object endpoint,
-- for parity with the other buckets, even though the public endpoint
-- doesn't need it.
--
-- file_size_limit is a real per-image ceiling (10MB), not the
-- whole-project-quota-sized limit the 1GB video bucket uses -- a single
-- image this large would already be unreasonable for a web page.
--
-- NOT APPLIED to production by this change. Prepared per the explicit
-- Phase 3 authorization boundary ("prepare, do not apply, a new storage
-- migration"); an authorized operator must run this (e.g. via the
-- Supabase MCP connector or `supabase db push`) before real image upload
-- in the editor will work end-to-end.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-assets',
  'website-assets',
  true,
  10485760, -- 10MB per image
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Objects are stored at {business_id}/{filename}, same layout as the
-- videos/voiceovers buckets, so the same (storage.foldername(name))[1]
-- business-id check applies.
CREATE POLICY "Business members can read their website assets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'website-assets'
  AND EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
      AND status = 'active'
  )
);

CREATE POLICY "Business members can upload website assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'website-assets'
  AND EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
      AND status = 'active'
  )
);

CREATE POLICY "Business members can update their website assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'website-assets'
  AND EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
      AND status = 'active'
  )
);

CREATE POLICY "Business members can delete their website assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'website-assets'
  AND EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
      AND status = 'active'
  )
);
