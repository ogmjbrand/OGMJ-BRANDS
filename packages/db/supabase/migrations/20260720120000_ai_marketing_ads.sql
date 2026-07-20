-- AI Marketing System Phase 6: Advertising.
-- Scope: AI ad-copy generation + a campaign planner/tracker. Launching to
-- Meta/Google/LinkedIn/TikTok Ads needs a developer app + OAuth per
-- platform (external, deferred) — campaigns here are planned and their
-- status/metrics are updated manually against what's actually running on
-- each platform, same pattern as the content-calendar tools in earlier
-- phases without a live publishing integration yet.
--
-- Deliberately a new table rather than reusing the pre-existing (but
-- currently unused anywhere in the app) `campaigns` table — that table's
-- shape (subject, email-specific stats: opened/bounced/unsubscribed) reads
-- as an abandoned email-campaign iteration, not a generic one, and nothing
-- in the app references it today, so there's no live feature to reconcile
-- with (unlike social_posts in Phase 4).

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  platform text NOT NULL,
  objective text NOT NULL DEFAULT 'traffic',
  status text NOT NULL DEFAULT 'draft',
  budget_amount numeric(12, 2),
  budget_type text NOT NULL DEFAULT 'daily',
  currency text NOT NULL DEFAULT 'NGN',
  start_date date,
  end_date date,
  targeting jsonb NOT NULL DEFAULT '{}'::jsonb,
  ad_copy jsonb NOT NULL DEFAULT '{}'::jsonb,
  metrics jsonb NOT NULL DEFAULT '{"impressions": 0, "clicks": 0, "spend": 0, "conversions": 0}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ad_campaigns_platform_check CHECK (platform IN ('meta', 'google', 'linkedin', 'tiktok')),
  CONSTRAINT ad_campaigns_status_check CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  CONSTRAINT ad_campaigns_budget_type_check CHECK (budget_type IN ('daily', 'lifetime'))
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_business ON public.ad_campaigns USING btree (business_id, created_at DESC);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_campaigns_business ON public.ad_campaigns AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id))
  WITH CHECK (is_business_member(business_id));

CREATE TRIGGER tr_updated_at_ad_campaigns BEFORE UPDATE ON public.ad_campaigns FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
