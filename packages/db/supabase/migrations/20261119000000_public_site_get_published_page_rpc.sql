-- Public website serving: column-limited read path for anonymous visitors.
--
-- websites and web_pages are RLS-restricted to business members
-- (is_business_member(business_id)), so the public /sites/[websiteId]/...
-- routes 404 for anonymous visitors. Rather than adding a public SELECT
-- policy on the raw tables (which would expose ssl_certificate,
-- analytics_id, owner_id, settings, metadata, etc. to anyone holding the
-- anon key), this adds a SECURITY DEFINER function that returns ONLY the
-- columns a visitor needs to render a page.
--
-- The function bypasses RLS (it runs as its owner), so it enforces the
-- visibility rules itself:
--   * web_pages.status must be 'published'
--   * websites.status must NOT be one of archived/deleted/disabled/suspended
--     (same list as HIDDEN_WEBSITE_STATUSES in apps/web/lib/sites/public-site.ts)
--
-- p_slug NULL => homepage, chosen with the same priority as the app code:
--   type 'home', then slug 'home', then 'index', then '' (empty), then the
--   oldest published page (created_at, id as a stable tie-breaker).
--
-- Returns zero or one row.

CREATE OR REPLACE FUNCTION public.get_published_page(
  p_website_id uuid,
  p_slug text DEFAULT NULL
)
RETURNS TABLE (
  website_id uuid,
  website_name text,
  website_description text,
  website_seo_title text,
  website_seo_description text,
  website_favicon_url text,
  page_id uuid,
  page_title text,
  page_slug text,
  page_type text,
  page_content jsonb,
  page_seo jsonb,
  page_published_at timestamptz,
  page_created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    w.id,
    w.name,
    w.description,
    w.seo_title::text,
    w.seo_description,
    w.favicon_url,
    p.id,
    p.title,
    p.slug,
    p.type,
    p.content,
    p.seo,
    p.published_at,
    p.created_at
  FROM public.web_pages p
  JOIN public.websites w ON w.id = p.website_id
  WHERE w.id = p_website_id
    AND p.status = 'published'
    AND w.status NOT IN ('archived', 'deleted', 'disabled', 'suspended')
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
$$;

COMMENT ON FUNCTION public.get_published_page(uuid, text) IS
  'Public site serving: returns render-only columns for one published page (or the homepage when p_slug is NULL) of a non-hidden website. SECURITY DEFINER; enforces status checks internally.';

-- Supabase's default privileges grant EXECUTE on new public functions to
-- PUBLIC/anon/authenticated/service_role. Reset to exactly anon + authenticated.
REVOKE ALL ON FUNCTION public.get_published_page(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_published_page(uuid, text) FROM anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_published_page(uuid, text) TO anon, authenticated;
