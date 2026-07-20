-- HubSpot Integration Module: generic sync infrastructure.
-- Reuses the existing `integrations` table (business_id, type, provider,
-- config, credentials) for the connection itself; these two tables add
-- what it doesn't cover — a per-sync activity/retry log and an id map so
-- two-way sync can tell "already linked" apart from "new record" for any
-- external provider, not just HubSpot.

CREATE TABLE IF NOT EXISTS public.integration_sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  object_type text NOT NULL,
  direction text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  records_synced integer NOT NULL DEFAULT 0,
  records_failed integer NOT NULL DEFAULT 0,
  attempt integer NOT NULL DEFAULT 1,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_object_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  object_type text NOT NULL,
  ogmj_id uuid NOT NULL,
  external_id text NOT NULL,
  last_synced_at timestamptz,
  last_synced_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (integration_id, object_type, ogmj_id),
  UNIQUE (integration_id, object_type, external_id)
);

CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_business ON public.integration_sync_logs USING btree (business_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_integration ON public.integration_sync_logs USING btree (integration_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_object_links_business ON public.integration_object_links USING btree (business_id);
CREATE INDEX IF NOT EXISTS idx_integration_object_links_lookup ON public.integration_object_links USING btree (integration_id, object_type, ogmj_id);

ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_object_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY integration_sync_logs_business ON public.integration_sync_logs AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY integration_object_links_business ON public.integration_object_links AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE TRIGGER tr_updated_at_integration_object_links BEFORE UPDATE ON public.integration_object_links FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
