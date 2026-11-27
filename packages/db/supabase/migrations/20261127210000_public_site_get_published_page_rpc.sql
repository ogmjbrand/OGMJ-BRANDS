-- Public website serving: narrowly scoped, column-limited read path for
-- anonymous visitors.
--
-- websites and web_pages are RLS-restricted to business members
-- (is_business_member(business_id)), so the public /sites/[websiteId]/...
-- routes cannot read them as anon. Rather than adding a public SELECT
-- policy on the raw tables (which would expose ssl_certificate,
-- analytics_id, owner_id, business_id, settings, metadata, etc. to anyone
-- holding the anon key), this adds ONE SECURITY DEFINER function that
-- returns an explicit allow-list of render-only fields. Existing RLS
-- policies are not touched, so authenticated business-member access
-- (builder, dashboard previews) is unchanged.
--
-- This supersedes the never-applied, never-merged revision of this same
-- function prepared on a stale branch (PR #72, 20261119000000_...sql),
-- which the project owner reviewed and approved the design of on
-- 2026-11-19. Two columns were added on top of that approved design:
--   * page_content now carries the page's FULL content (whatever shape
--     it is -- a legacy `{sections:[...]}` array or a current
--     `VersionedDocument`), instead of only `content->'sections'`, so the
--     real shared document-model renderer (apps/web/components/document/
--     DocumentRenderer.tsx, merged in Phase 1) can render it, the same
--     component the builder's own preview will eventually use -- not a
--     second, ad hoc renderer that would drift from it.
--   * website_navigation and page_list give a public nav bar what it
--     needs (the site-wide nav config, and the live slug of every other
--     published page) without a second round trip. Phase 3's navigation
--     manager (`websites.settings.navigation`) was built with no public
--     renderer to consume it yet -- this is that renderer's data source.
--
-- RETURNED FIELDS (the complete allow-list; nothing else leaves the DB):
--   website_id, website_slug             -- website ID + public identifier
--   website_name                         -- public display name (header/title)
--   website_status                       -- publication status
--   website_seo_title,
--   website_seo_description              -- site-level SEO metadata
--   website_favicon_url                  -- the only approved public asset
--   website_navigation                   -- settings->'navigation' only (main/footer link lists)
--   page_slug, page_title                -- page identity
--   page_seo_title, page_seo_description -- ONLY these two keys of web_pages.seo
--   page_content                         -- the full web_pages.content value
--   page_list                            -- [{id, slug, title}] of this website's
--                                           other published pages (nav resolution)
-- NEVER returned: ssl_certificate, analytics_id, owner_id, business_id,
-- template_id, websites.seo/metadata, any other key of websites.settings,
-- web_pages.settings/version/parent_id/type/id, any other key of seo,
-- timestamps, or any page that isn't itself published.
--
-- VISIBILITY RULES (the function bypasses RLS, so it enforces these itself):
--   * web_pages.status must be 'published' (drafts are never returned)
--   * websites.status must be in the ALLOW-list ('draft', 'published').
--     Any other status (archived, deleted, disabled, suspended, or any
--     status added in the future) is hidden -- fails closed.
--     NOTE: 'draft' websites are deliberately servable. Nothing in the app
--     ever sets websites.status = 'published', so requiring it would 404
--     every site. This was an explicit, approved product decision
--     (2026-11-19): a website-level publish step is a separate feature.
--   * web_pages.business_id must equal websites.business_id. web_pages RLS
--     only checks membership of the page's own business_id, so without this
--     a member of business B could attach a published page to business A's
--     website_id and have it served on A's public site. (This is a gap in
--     web_pages' existing RLS itself, not just this function -- see this
--     migration's PR description for why it's being worked around here
--     rather than fixed at the RLS layer in the same change.)
--
-- INPUT VALIDATION (never raises; invalid input => zero rows):
--   * p_website_id is TEXT, not uuid, so a malformed id from the URL
--     returns an empty result instead of a raw 22P02 cast error.
--     It must be a canonical 8-4-4-4-12 hex uuid.
--   * p_slug NULL => homepage. Otherwise 1..200 chars, no control chars.
--
-- Homepage priority (p_slug NULL): type 'home', then slug 'home', 'index',
-- '' (empty), then the oldest published page (created_at, id tie-break).
--
-- Returns zero or one row.

DROP FUNCTION IF EXISTS public.get_published_page(uuid, text);
DROP FUNCTION IF EXISTS public.get_published_page(text, text);

CREATE OR REPLACE FUNCTION public.get_published_page(
  p_website_id text,
  p_slug text DEFAULT NULL
)
RETURNS TABLE (
  website_id uuid,
  website_slug text,
  website_name text,
  website_status text,
  website_seo_title text,
  website_seo_description text,
  website_favicon_url text,
  website_navigation jsonb,
  page_slug text,
  page_title text,
  page_seo_title text,
  page_seo_description text,
  page_content jsonb,
  page_list jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
-- Empty search_path: every relation below is schema-qualified, so a caller
-- cannot shadow public.* objects via a temp/other schema.
SET search_path = ''
AS $$
#variable_conflict use_column
DECLARE
  v_website_id uuid;
BEGIN
  IF p_website_id IS NULL
     OR p_website_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN;
  END IF;

  IF p_slug IS NOT NULL AND (length(p_slug) > 200 OR p_slug ~ '[[:cntrl:]]') THEN
    RETURN;
  END IF;

  v_website_id := p_website_id::uuid;

  RETURN QUERY
  SELECT
    w.id,
    w.slug,
    w.name,
    w.status,
    w.seo_title::text,
    w.seo_description,
    w.favicon_url,
    CASE WHEN jsonb_typeof(w.settings -> 'navigation') = 'object' THEN w.settings -> 'navigation' ELSE NULL END,
    p.slug,
    p.title,
    NULLIF(btrim(p.seo ->> 'title'), ''),
    NULLIF(btrim(p.seo ->> 'description'), ''),
    COALESCE(p.content, '{}'::jsonb),
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('id', pl.id, 'slug', pl.slug, 'title', pl.title) ORDER BY pl.created_at ASC)
         FROM public.web_pages pl
        WHERE pl.website_id = w.id
          AND pl.business_id = w.business_id
          AND pl.status = 'published'),
      '[]'::jsonb
    )
  FROM public.web_pages p
  JOIN public.websites w
    ON w.id = p.website_id
   AND w.business_id = p.business_id
  WHERE w.id = v_website_id
    AND p.status = 'published'
    AND w.status IN ('draft', 'published')
    AND (p_slug IS NULL OR p.slug = p_slug)
  ORDER BY
    CASE
      WHEN p_slug IS NOT NULL THEN 0
      WHEN p.type = 'home' THEN 0
      WHEN p.slug = 'home' THEN 1
      WHEN p.slug = 'index' THEN 2
      WHEN p.slug = '' THEN 3
      ELSE 4
    END,
    p.created_at ASC,
    p.id ASC
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_published_page(text, text) IS
  'Public site serving: returns an explicit allow-list of render-only fields for one published page (or the homepage when p_slug is NULL) of a visible website, plus site navigation and the slugs of its other published pages. SECURITY DEFINER, empty search_path, validates inputs, enforces visibility internally. Invalid input returns zero rows.';

-- Supabase's default privileges grant EXECUTE on new public functions to
-- PUBLIC/anon/authenticated/service_role. Reset, then grant explicitly:
--   anon, authenticated -> public visitors (logged in or not)
--   service_role        -> server-side callers; service_role already
--                          bypasses RLS on the underlying tables, so this
--                          grants it nothing it could not already read.
REVOKE ALL ON FUNCTION public.get_published_page(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_published_page(text, text) FROM anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_published_page(text, text) TO anon, authenticated, service_role;
