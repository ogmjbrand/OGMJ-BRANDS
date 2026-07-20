-- AI Marketing System Phase 7: Review Management / Reputation.
-- Scope: a central log of reviews from Google Business Profile,
-- Trustpilot, Yelp, Facebook, etc. with AI-drafted responses. Pulling
-- reviews automatically needs a developer app/API key per platform
-- (external, deferred) — reviews are logged here (manually, or later via
-- an import) and the value today is having one place to track sentiment
-- and draft on-brand responses fast.

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  platform text NOT NULL,
  reviewer_name text,
  rating integer NOT NULL,
  review_text text NOT NULL,
  review_date date,
  external_url text,
  status text NOT NULL DEFAULT 'new',
  response_text text,
  responded_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_platform_check CHECK (platform IN ('google', 'trustpilot', 'yelp', 'facebook', 'other')),
  CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT reviews_status_check CHECK (status IN ('new', 'responded', 'flagged'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_business ON public.reviews USING btree (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews USING btree (status);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY reviews_business ON public.reviews AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id))
  WITH CHECK (is_business_member(business_id));

CREATE TRIGGER tr_updated_at_reviews BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
