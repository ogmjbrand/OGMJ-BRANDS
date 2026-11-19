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
-- RETURNED FIELDS (the complete allow-list; nothing else leaves the DB):
--   website_id, website_slug             -- website ID + public identifier
--   website_name                         -- public display name (header/title)
--   website_status                       -- publication status
--   website_seo_title,
--   website_seo_description              -- site-level SEO metadata
--   website_favicon_url                  -- the only approved public asset
--   page_slug, page_title                -- page identity
--   page_seo_title, page_seo_description -- ONLY these two keys of web_pages.seo
--   page_sections                        -- ONLY web_pages.content->'sections'
--                                           (always a JSON array)
-- NEVER returned: ssl_certificate, analytics_id, owner_id, business_id,
-- template_id, websites.settings/seo/metadata, web_pages.settings/version/
-- parent_id/type/id, any other key of content or seo, timestamps.
--
-- VISIBILITY RULES (the function bypasses RLS, so it enforces these itself):
--   * web_pages.status must be 'published' (drafts are never returned)
--   * websites.status must be in the ALLOW-list ('draft', 'published').
--     Any other status (archived, deleted, disabled, suspended, or any
--     status added in the future) is hidden — fails closed.
--     NOTE: 'draft' websites are deliberately servable. Nothing in the app
--     ever sets websites.status = 'published' (or websites.published_at),
--     so requiring it would 404 every site. Whether a draft website should
--     be live is an open product decision — see PR #72.
--   * web_pages.business_id must equal websites.business_id. web_pages RLS
--     only checks membership of the page's own business_id, so without this
--     a member of business B could attach a published page to business A's
--     website_id and have it served on A's public site.
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

-- An earlier, never-applied revision of this migration declared
-- (uuid, text). Drop it so only the hardened signature can exist.
DROP FUNCTION IF EXISTS public.get_published_page(uuid, text);

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
  page_slug text,
  page_title text,
  page_seo_title text,
  page_seo_description text,
  page_sections jsonb
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
    p.slug,
    p.title,
    NULLIF(btrim(p.seo ->> 'title'), ''),
    NULLIF(btrim(p.seo ->> 'description'), ''),
    CASE
      WHEN jsonb_typeof(p.content -> 'sections') = 'array' THEN p.content -> 'sections'
      ELSE '[]'::jsonb
    END
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
  'Public site serving: returns an explicit allow-list of render-only fields for one published page (or the homepage when p_slug is NULL) of a visible website. SECURITY DEFINER, empty search_path, validates inputs, enforces visibility internally. Invalid input returns zero rows.';

-- Supabase's default privileges grant EXECUTE on new public functions to
-- PUBLIC/anon/authenticated/service_role. Reset, then grant explicitly:
--   anon, authenticated -> public visitors (logged in or not)
--   service_role        -> server-side callers; service_role already
--                          bypasses RLS on the underlying tables, so this
--                          grants it nothing it could not already read.
REVOKE ALL ON FUNCTION public.get_published_page(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_published_page(text, text) FROM anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_published_page(text, text) TO anon, authenticated, service_role;
