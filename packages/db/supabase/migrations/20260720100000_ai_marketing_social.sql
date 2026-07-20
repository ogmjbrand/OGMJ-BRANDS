-- AI Marketing System Phase 4: Social Media Engine.
-- Scope: AI caption generation + a content calendar against the existing
-- social_posts / social_accounts infrastructure. Live posting needs a
-- developer app per platform (external, deferred) — posts here are marked
-- 'published' manually once posted elsewhere, same as any content-calendar
-- tool without a live publishing integration yet.
--
-- social_posts and social_accounts already exist in this database from
-- prior infrastructure work (richer schema than this module originally
-- assumed: platforms[] not platform, content not caption, account_id,
-- media_urls, engagement jsonb, external_id, title, published_at). This
-- migration only removes the redundant policy/trigger a previous, incorrect
-- version of this migration created via CREATE POLICY / CREATE TRIGGER
-- running against the pre-existing table (its CREATE TABLE IF NOT EXISTS
-- had silently no-opped) — the pre-existing social_posts_business_member
-- policy and trg_social_posts_updated_at trigger already cover this table.

DROP POLICY IF EXISTS social_posts_business ON public.social_posts;
DROP TRIGGER IF EXISTS tr_updated_at_social_posts ON public.social_posts;
