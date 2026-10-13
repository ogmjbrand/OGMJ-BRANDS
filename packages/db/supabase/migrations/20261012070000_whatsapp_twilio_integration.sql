-- Twilio WhatsApp integration support.
--
-- 1. api_rate_limits had RLS enabled with zero policies (fails closed —
--    nothing could read or write it, confirmed via live Supabase advisors
--    during an earlier audit this session). Adding the same
--    is_business_member() scoping used everywhere else makes it usable,
--    needed for the new WhatsApp send endpoint's rate limiting.
-- 2. increment_rate_limit() does an atomic upsert-and-check in one round
--    trip against the (business_id, window_start, endpoint) unique
--    constraint that already existed on api_rate_limits, avoiding a
--    read-then-write race between concurrent requests. Runs as the
--    caller (no SECURITY DEFINER needed) — RLS above already permits a
--    business member to read/write their own business's rows.
-- 3. whatsapp_sends.campaign_id is now nullable, and content_sid/
--    content_variables/sent_by are added, so a standalone single
--    WhatsApp send (not part of a bulk campaign) can be recorded in the
--    same existing table instead of a new one, and so a Content
--    Template send can be distinguished from a free-form body send.
--
-- Applied directly to production via the Supabase MCP connector on
-- 2026-10-12; this file documents that change in version control.

CREATE POLICY api_rate_limits_business ON public.api_rate_limits
  FOR ALL TO public
  USING (is_business_member(business_id))
  WITH CHECK (is_business_member(business_id));

CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_business_id uuid,
  p_endpoint text,
  p_window_start timestamptz,
  p_limit int
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO public.api_rate_limits (business_id, endpoint, window_start, request_count)
  VALUES (p_business_id, p_endpoint, p_window_start, 1)
  ON CONFLICT (business_id, window_start, endpoint)
  DO UPDATE SET request_count = public.api_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

ALTER TABLE public.whatsapp_sends ALTER COLUMN campaign_id DROP NOT NULL;
ALTER TABLE public.whatsapp_sends ADD COLUMN IF NOT EXISTS content_sid text;
ALTER TABLE public.whatsapp_sends ADD COLUMN IF NOT EXISTS content_variables jsonb;
ALTER TABLE public.whatsapp_sends ADD COLUMN IF NOT EXISTS sent_by uuid;
