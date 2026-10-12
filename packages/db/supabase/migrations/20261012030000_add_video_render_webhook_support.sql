-- fal.ai's render webhook has no Supabase user session (it's an external
-- system calling back), so it can't satisfy ai_video_projects' RLS via
-- auth.uid(). Rather than adding a service-role key to the app (a new
-- privileged secret to manage), this SECURITY DEFINER function validates
-- its own webhook token internally and performs the write itself — the
-- token check IS the security boundary here, not RLS.
--
-- Applied directly to production via the Supabase MCP connector on
-- 2026-10-12 and verified: wrong token rejected, partial completion
-- keeps status 'rendering', final scene completion flips status to
-- 'completed' and sets output_video_url. This file documents that
-- change in version control.

ALTER TABLE public.ai_video_projects
  ADD COLUMN render_webhook_token text;

CREATE OR REPLACE FUNCTION public.complete_video_scene_render(
  p_project_id uuid,
  p_token text,
  p_scene_index int,
  p_video_url text,
  p_failed boolean,
  p_error_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project public.ai_video_projects%ROWTYPE;
  v_scenes jsonb;
  v_scene jsonb;
  v_all_done boolean;
  v_any_failed boolean;
BEGIN
  SELECT * INTO v_project FROM public.ai_video_projects WHERE id = p_project_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF v_project.render_webhook_token IS NULL OR v_project.render_webhook_token != p_token THEN
    RAISE EXCEPTION 'Invalid webhook token';
  END IF;

  v_scenes := v_project.script -> 'scenes';
  IF v_scenes IS NULL OR v_scenes -> p_scene_index IS NULL THEN
    RAISE EXCEPTION 'Scene not found';
  END IF;

  v_scene := (v_scenes -> p_scene_index) || jsonb_build_object(
    'renderStatus', CASE WHEN p_failed THEN 'failed' ELSE 'completed' END,
    'videoUrl', CASE WHEN p_failed THEN NULL ELSE p_video_url END,
    'renderError', CASE WHEN p_failed THEN p_error_message ELSE NULL END
  );

  v_scenes := jsonb_set(v_scenes, ARRAY[p_scene_index::text], v_scene);

  SELECT
    bool_and((s ->> 'renderStatus') IN ('completed', 'failed')),
    bool_or((s ->> 'renderStatus') = 'failed')
  INTO v_all_done, v_any_failed
  FROM jsonb_array_elements(v_scenes) AS s;

  UPDATE public.ai_video_projects
  SET
    script = jsonb_set(script, '{scenes}', v_scenes),
    status = CASE
      WHEN v_all_done AND v_any_failed THEN 'failed'
      WHEN v_all_done THEN 'completed'
      ELSE 'rendering'
    END,
    output_video_url = CASE
      WHEN v_all_done AND NOT v_any_failed THEN (v_scenes -> 0 ->> 'videoUrl')
      ELSE output_video_url
    END,
    render_error = CASE WHEN p_failed THEN p_error_message ELSE render_error END,
    updated_at = now()
  WHERE id = p_project_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Called by the unauthenticated webhook route via the anon key — the
-- function's own token check is what gates the write, not this grant.
GRANT EXECUTE ON FUNCTION public.complete_video_scene_render(uuid, text, int, text, boolean, text) TO anon, authenticated;
