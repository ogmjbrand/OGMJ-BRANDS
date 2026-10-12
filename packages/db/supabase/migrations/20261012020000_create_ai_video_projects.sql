-- AI Video Studio (Phase 2/3): script/storyboard generation workspaces
-- (Generator / Marketing / Script-to-Video) start from a blank prompt,
-- not an uploaded file, so they need their own lifecycle separate from
-- `videos` (raw uploads) and `video_clips` (manual clip metadata).
--
-- Applied directly to production via the Supabase MCP connector on
-- 2026-10-12; this file documents that change in version control.

CREATE TABLE IF NOT EXISTS public.ai_video_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace text NOT NULL CHECK (workspace IN ('generator', 'marketing', 'script_to_video')),
  title text NOT NULL,
  -- Raw user inputs that produced the script (prompt, product info,
  -- source script/brief, etc.) — shape varies by workspace.
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  video_type text,
  style text,
  aspect_ratio text NOT NULL DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16', '1:1')),
  target_duration_seconds integer,
  -- AI-generated structured output: scenes[], captions, thumbnail
  -- concepts, social metadata — shape documented in the generate-script
  -- API route, not enforced at the DB layer since it evolves with the
  -- feature.
  script jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'script_ready', 'rendering', 'completed', 'failed')),
  render_provider text,
  render_error text,
  output_video_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_video_projects_business_id ON public.ai_video_projects(business_id);
CREATE INDEX idx_ai_video_projects_workspace ON public.ai_video_projects(business_id, workspace);

ALTER TABLE public.ai_video_projects ENABLE ROW LEVEL SECURITY;

-- Mirrors the same active-membership check every videos-adjacent API
-- route already uses.
CREATE POLICY "Business members can view ai video projects"
ON public.ai_video_projects FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id = ai_video_projects.business_id
      AND user_id = auth.uid()
      AND status = 'active'
  )
);

CREATE POLICY "Business members can create ai video projects"
ON public.ai_video_projects FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id = ai_video_projects.business_id
      AND user_id = auth.uid()
      AND status = 'active'
  )
);

CREATE POLICY "Business members can update ai video projects"
ON public.ai_video_projects FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id = ai_video_projects.business_id
      AND user_id = auth.uid()
      AND status = 'active'
  )
);

CREATE POLICY "Business members can delete ai video projects"
ON public.ai_video_projects FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_users
    WHERE business_id = ai_video_projects.business_id
      AND user_id = auth.uid()
      AND status = 'active'
  )
);
