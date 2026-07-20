-- AI Marketing System Phase 8: Video Marketing + Creative Studio.
-- Scope check first: video *scripts* are already covered by Content
-- Studio's tiktok_script/youtube_script content types (Phase 1), and
-- video storage/processing already exists at /dashboard/videos (with its
-- own `videos` table). Actual video generation needs an external
-- video-gen API (deferred, same class as the other external-dependency
-- phases). So the real gap this phase fills is the Creative Studio half:
-- AI-generated creative briefs (concept, visual direction, shot list /
-- storyboard beats, platform specs) for video or image campaigns — a
-- planning artifact a designer or videographer executes from, grounded in
-- the business's brand strategy.

CREATE TABLE IF NOT EXISTS public.creative_briefs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  format text NOT NULL DEFAULT 'video',
  platform text,
  topic text,
  brief jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creative_briefs_format_check CHECK (format IN ('video', 'image', 'carousel')),
  CONSTRAINT creative_briefs_status_check CHECK (status IN ('draft', 'ready', 'in_production', 'complete'))
);

CREATE INDEX IF NOT EXISTS idx_creative_briefs_business ON public.creative_briefs USING btree (business_id, created_at DESC);

ALTER TABLE public.creative_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY creative_briefs_business ON public.creative_briefs AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id))
  WITH CHECK (is_business_member(business_id));

CREATE TRIGGER tr_updated_at_creative_briefs BEFORE UPDATE ON public.creative_briefs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
