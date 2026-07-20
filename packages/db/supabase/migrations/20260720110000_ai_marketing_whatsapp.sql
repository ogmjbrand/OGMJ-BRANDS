-- AI Marketing System Phase 5: WhatsApp Marketing.
-- Native module: reuses businesses/business_users + the existing contacts
-- table for recipients (contacts.phone), same shape as Phase 2's email
-- module. Sending goes through the Twilio WhatsApp Business API — an
-- external dependency (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN /
-- TWILIO_WHATSAPP_FROM), gated behind a 503 the same way Resend is for
-- email, so campaign drafting/AI generation work today regardless.

CREATE TABLE IF NOT EXISTS public.whatsapp_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  recipient_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  recipient_count integer NOT NULL DEFAULT 0,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_campaigns_status_check CHECK (status IN ('draft', 'sending', 'sent', 'failed'))
);

CREATE TABLE IF NOT EXISTS public.whatsapp_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.whatsapp_campaigns(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  twilio_message_sid text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_sends_status_check CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_business ON public.whatsapp_campaigns USING btree (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sends_campaign ON public.whatsapp_sends USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sends_business ON public.whatsapp_sends USING btree (business_id);

ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY whatsapp_campaigns_business ON public.whatsapp_campaigns AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id))
  WITH CHECK (is_business_member(business_id));

CREATE POLICY whatsapp_sends_business ON public.whatsapp_sends AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id))
  WITH CHECK (is_business_member(business_id));

CREATE TRIGGER tr_updated_at_whatsapp_campaigns BEFORE UPDATE ON public.whatsapp_campaigns FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER tr_updated_at_whatsapp_sends BEFORE UPDATE ON public.whatsapp_sends FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
