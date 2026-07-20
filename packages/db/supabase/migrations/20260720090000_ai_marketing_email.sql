-- AI Marketing System Phase 2: Email Marketing (Resend).
-- Native module: reuses businesses/business_users + the existing contacts
-- table for recipients. updated_at included in the CREATE TABLE itself
-- this time (two earlier tables this session had a tr_updated_at_*
-- trigger attached without the column, causing every UPDATE to fail).

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  recipient_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  recipient_count integer NOT NULL DEFAULT 0,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_campaigns_status_check CHECK (status IN ('draft', 'sending', 'sent', 'failed'))
);

CREATE TABLE IF NOT EXISTS public.email_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  resend_message_id text,
  error_message text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_sends_status_check CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_business ON public.email_campaigns USING btree (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON public.email_sends USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_business ON public.email_sends USING btree (business_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_resend_message_id ON public.email_sends USING btree (resend_message_id);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_campaigns_business ON public.email_campaigns AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id))
  WITH CHECK (is_business_member(business_id));

CREATE POLICY email_sends_business ON public.email_sends AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id))
  WITH CHECK (is_business_member(business_id));

CREATE TRIGGER tr_updated_at_email_campaigns BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER tr_updated_at_email_sends BEFORE UPDATE ON public.email_sends FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
