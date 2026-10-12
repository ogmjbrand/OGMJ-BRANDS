-- Every other table the dashboard home page queries in parallel
-- (contacts, deals, websites, pipeline_stages) has an index on
-- business_id; videos was missing one. Found while investigating a
-- reported 1-minute dashboard load — not the cause with the table
-- currently empty in production, but a latent gap worth closing before
-- it has real data.
--
-- Applied directly to production via the Supabase MCP connector on
-- 2026-10-12; this file documents that change in version control.

CREATE INDEX IF NOT EXISTS idx_videos_business_id ON public.videos USING btree (business_id);
