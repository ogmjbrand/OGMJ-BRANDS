-- AI Marketing System Phase 1: AI Content Engine.
-- Brand strategy interview + AI-generated strategy doc, and a generic
-- multi-format Content Studio (blog/social/email/ads/etc share one table
-- and one generation endpoint rather than one table per content type).
-- Native module: reuses businesses/business_users, no new auth or CRM.

CREATE TABLE IF NOT EXISTS public.brand_strategies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  industry text,
  products_services text,
  budget text,
  target_audience text,
  competitors text,
  usp text,
  brand_story text,
  mission text,
  vision text,
  core_values text,
  brand_voice text,
  brand_tone text,
  goals text,
  market text,
  generated jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id)
);

CREATE TABLE IF NOT EXISTS public.content_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type text NOT NULL,
  platform text,
  topic text,
  title text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_items_status_check CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_brand_strategies_business ON public.brand_strategies USING btree (business_id);
CREATE INDEX IF NOT EXISTS idx_content_items_business ON public.content_items USING btree (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON public.content_items USING btree (business_id, type);

ALTER TABLE public.brand_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY brand_strategies_business ON public.brand_strategies AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id))
  WITH CHECK (is_business_member(business_id));

CREATE POLICY content_items_business ON public.content_items AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id))
  WITH CHECK (is_business_member(business_id));

CREATE TRIGGER tr_updated_at_brand_strategies BEFORE UPDATE ON public.brand_strategies FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER tr_updated_at_content_items BEFORE UPDATE ON public.content_items FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
