-- AI Marketing System Phase 9 (final phase): Influencer, Affiliate,
-- Community, Marketing Automation, AI CMO.
--
-- Scope check first, same discipline as every phase since Phase 4's
-- lesson:
-- - Marketing Automation is already fully built (workflows,
--   workflow_executions, workflow_step_logs, its own /dashboard/workflows
--   page and nav entry) — no new work, just linked from the Marketing hub.
-- - Community Management (responding to comments/DMs) overlaps almost
--   entirely with Reviews' AI response-drafting (Phase 7) and the Social
--   studio's AI composer — no live community-platform API (Discord/Slack/
--   Meta inbox) is connected, so there's nothing new and non-duplicative
--   to build here beyond what those two already do.
-- - Influencer Marketing and Affiliate Marketing are genuinely new: the
--   platform's existing `referral_programs`/`referrals` tables (Partner
--   Hub) are OGMJ's OWN referral program for referring new businesses to
--   OGMJ BRANDS — they have no business_id column, i.e. they are
--   platform-level, not a tool a tenant business uses to run ITS OWN
--   affiliate program. So this is additive, not a duplicate.
-- - AI CMO is a stateless synthesis endpoint (no table) reading across
--   brand_strategies/content_items/campaigns/reviews, same
--   no-new-tables pattern as SEO's content-gap analysis (Phase 3).

CREATE TABLE IF NOT EXISTS public.influencers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  handle text,
  platform text NOT NULL DEFAULT 'instagram',
  followers_count integer,
  contact_email text,
  status text NOT NULL DEFAULT 'prospecting',
  collab_type text NOT NULL DEFAULT 'gifted',
  agreed_amount numeric(12, 2),
  currency text NOT NULL DEFAULT 'NGN',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT influencers_platform_check CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'x', 'other')),
  CONSTRAINT influencers_status_check CHECK (status IN ('prospecting', 'contacted', 'negotiating', 'active', 'completed', 'declined')),
  CONSTRAINT influencers_collab_type_check CHECK (collab_type IN ('gifted', 'paid', 'affiliate'))
);

CREATE TABLE IF NOT EXISTS public.affiliate_partners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  referral_code text NOT NULL,
  commission_type text NOT NULL DEFAULT 'percentage',
  commission_value numeric(12, 2) NOT NULL DEFAULT 10,
  currency text NOT NULL DEFAULT 'NGN',
  total_sales numeric(12, 2) NOT NULL DEFAULT 0,
  total_commission numeric(12, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT affiliate_partners_commission_type_check CHECK (commission_type IN ('percentage', 'fixed')),
  CONSTRAINT affiliate_partners_status_check CHECK (status IN ('active', 'paused')),
  CONSTRAINT affiliate_partners_business_code_unique UNIQUE (business_id, referral_code)
);

CREATE INDEX IF NOT EXISTS idx_influencers_business ON public.influencers USING btree (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_partners_business ON public.affiliate_partners USING btree (business_id, created_at DESC);

ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY influencers_business ON public.influencers AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id))
  WITH CHECK (is_business_member(business_id));

CREATE POLICY affiliate_partners_business ON public.affiliate_partners AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id))
  WITH CHECK (is_business_member(business_id));

CREATE TRIGGER tr_updated_at_influencers BEFORE UPDATE ON public.influencers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER tr_updated_at_affiliate_partners BEFORE UPDATE ON public.affiliate_partners FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
