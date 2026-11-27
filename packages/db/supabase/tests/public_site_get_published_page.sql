-- Regression / security tests for
-- <migration>_public_site_get_published_page_rpc.sql
-- (public website serving RPC).
--
-- Proves:
--   A. anon can read a published page and the homepage, and gets ONLY the
--      allow-listed fields (no ssl_certificate / analytics_id / owner_id /
--      business_id / settings / metadata / non-approved content or seo keys).
--   B. draft pages, hidden (archived/suspended) websites, unknown websites
--      and unknown slugs return zero rows.
--   C. malformed input (bad uuid, injection-looking strings, over-long or
--      control-char slugs, NULL id) returns zero rows and NEVER raises.
--   D. cross-tenant: a published page owned by business B but pointing at
--      business A's website_id is never served on A's site, nor listed in
--      page_list.
--   E. authenticated visitors get exactly the same public view as anon, and
--      existing RLS is intact: an unrelated user still cannot SELECT A's
--      websites/web_pages rows directly, while A's owner still can
--      (business-owner preview path preserved).
--   F. function hardening: SECURITY DEFINER, empty search_path, STABLE,
--      no PUBLIC execute, EXECUTE only for anon/authenticated/service_role,
--      and the declared result columns are exactly the allow-list.
--   G. website_navigation passes through settings.navigation only (not the
--      rest of settings), and page_list carries every other published page
--      of the same site but not drafts or cross-tenant pages.
--
-- Self-contained and self-cleaning: applies the migration and seeds
-- fixtures inside one transaction that always ROLLs BACK. Intended for a
-- Supabase preview branch / staging / local `supabase start` database.
-- Do NOT run against production unless you are certain the session ends
-- in ROLLBACK (it does as written).
--
-- Run with (from repo root):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/db/supabase/tests/public_site_get_published_page.sql
-- Success = the script finishes and prints 'PASS: public_site_get_published_page'.

BEGIN;

\ir ../migrations/20261127210000_public_site_get_published_page_rpc.sql

-- ---------------------------------------------------------------------
-- Fixtures (as the privileged migration role, bypassing RLS).
-- ---------------------------------------------------------------------
INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', 'gpp-test-owner-a@example.invalid'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'gpp-test-owner-b@example.invalid');

INSERT INTO public.businesses (id, name, owner_id) VALUES
  ('aaaaaaaa-1111-4000-8000-000000000001', 'GPP-TEST Business A', 'aaaaaaaa-0000-4000-8000-000000000001'),
  ('bbbbbbbb-1111-4000-8000-000000000002', 'GPP-TEST Business B', 'bbbbbbbb-0000-4000-8000-000000000002');

INSERT INTO public.websites
  (id, business_id, owner_id, name, slug, status, ssl_certificate, analytics_id,
   settings, metadata, seo, seo_title, seo_description, favicon_url)
VALUES
  -- A: live (draft status is servable, see migration header), with real nav.
  ('aaaaaaaa-2222-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001',
   'aaaaaaaa-0000-4000-8000-000000000001', 'GPP Site A', 'gpp-test-site-a', 'draft',
   'SECRET-SSL-CERT', 'SECRET-ANALYTICS',
   '{"secret":"SECRET-SETTINGS","navigation":{"main":[{"id":"n1","label":"About","target":{"type":"page","pageId":"PLACEHOLDER"}}],"footer":[]}}',
   '{"secret":"SECRET-METADATA"}', '{"secret":"SECRET-WEBSITE-SEO"}',
   'Site A SEO', 'Site A description', 'https://cdn.example.com/a.ico'),
  -- A2: archived => hidden
  ('aaaaaaaa-2222-4000-8000-000000000002', 'aaaaaaaa-1111-4000-8000-000000000001',
   'aaaaaaaa-0000-4000-8000-000000000001', 'GPP Site A Archived', 'gpp-test-site-a-archived', 'archived',
   NULL, NULL, '{}', '{}', '{}', NULL, NULL, NULL),
  -- A3: suspended => hidden (not in allow-list)
  ('aaaaaaaa-2222-4000-8000-000000000003', 'aaaaaaaa-1111-4000-8000-000000000001',
   'aaaaaaaa-0000-4000-8000-000000000001', 'GPP Site A Suspended', 'gpp-test-site-a-suspended', 'suspended',
   NULL, NULL, '{}', '{}', '{}', NULL, NULL, NULL),
  -- A4: live but nothing published
  ('aaaaaaaa-2222-4000-8000-000000000004', 'aaaaaaaa-1111-4000-8000-000000000001',
   'aaaaaaaa-0000-4000-8000-000000000001', 'GPP Site A Empty', 'gpp-test-site-a-empty', 'draft',
   NULL, NULL, '{}', '{}', '{}', NULL, NULL, NULL);

INSERT INTO public.web_pages
  (website_id, business_id, title, slug, type, status, content, seo, settings, created_at)
VALUES
  -- Homepage of A (published), with a current-schema VersionedDocument and
  -- non-approved keys elsewhere (seo/settings) that must never leak.
  ('aaaaaaaa-2222-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001',
   'Home', 'home', 'home', 'published',
   '{"schemaVersion":1,"document":{"root":{"id":"root","kind":"root","children":[{"id":"h1","kind":"heading","text":"Welcome","level":1}]},"tokenSetId":"default","breakpoints":[{"key":"base","minWidthPx":0}],"components":{},"assets":{}}}',
   '{"title":"Home SEO","description":"Home desc","internal":"SECRET-PAGE-SEO"}',
   '{"secret":"SECRET-PAGE-SETTINGS"}', now() - interval '2 days'),
  -- Published non-home, legacy-shaped page of A.
  ('aaaaaaaa-2222-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001',
   'About', 'about', 'page', 'published', '{"sections":[{"type":"text","text":"About us"}]}', '{}', '{}', now() - interval '1 day'),
  -- Draft page of A -- must never appear in page_content OR page_list.
  ('aaaaaaaa-2222-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001',
   'Secret Draft', 'secret-draft', 'page', 'draft', '{"sections":[{"type":"text","text":"SECRET-DRAFT"}]}', '{}', '{}', now()),
  -- Published page on the archived and suspended websites.
  ('aaaaaaaa-2222-4000-8000-000000000002', 'aaaaaaaa-1111-4000-8000-000000000001',
   'Archived Home', 'home', 'home', 'published', '{"sections":[]}', '{}', '{}', now()),
  ('aaaaaaaa-2222-4000-8000-000000000003', 'aaaaaaaa-1111-4000-8000-000000000001',
   'Suspended Home', 'home', 'home', 'published', '{"sections":[]}', '{}', '{}', now()),
  -- Draft-only page on the empty website.
  ('aaaaaaaa-2222-4000-8000-000000000004', 'aaaaaaaa-1111-4000-8000-000000000001',
   'Draft Home', 'home', 'home', 'draft', '{"sections":[]}', '{}', '{}', now()),
  -- Cross-tenant: owned by business B, pointing at A's website.
  ('aaaaaaaa-2222-4000-8000-000000000001', 'bbbbbbbb-1111-4000-8000-000000000002',
   'Hijack', 'hijack', 'page', 'published', '{"sections":[{"type":"text","text":"HIJACK"}]}', '{}', '{}', now() - interval '10 days');

-- ---------------------------------------------------------------------
-- A/B/C/D/G: anonymous visitor.
-- ---------------------------------------------------------------------
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SELECT set_config('request.jwt.claim.sub', '', true);

DO $$
DECLARE
  r record;
  n int;
  row_json text;
BEGIN
  -- A1: homepage (p_slug NULL) resolves to the type='home' page, even
  -- though the cross-tenant 'hijack' page is older.
  SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000001', NULL);
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL A1: expected 1 homepage row, got %', n; END IF;

  SELECT * INTO r FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000001', NULL);
  IF r.page_slug <> 'home' THEN RAISE EXCEPTION 'FAIL A1: homepage slug %', r.page_slug; END IF;
  IF r.website_slug <> 'gpp-test-site-a' OR r.website_name <> 'GPP Site A' OR r.website_status <> 'draft' THEN
    RAISE EXCEPTION 'FAIL A1: website identity fields wrong: %', row_to_json(r);
  END IF;
  IF r.page_seo_title <> 'Home SEO' OR r.page_seo_description <> 'Home desc' THEN
    RAISE EXCEPTION 'FAIL A1: page seo fields wrong: %', row_to_json(r);
  END IF;
  IF (r.page_content -> 'document' -> 'root' -> 'children' -> 0 ->> 'text') <> 'Welcome' THEN
    RAISE EXCEPTION 'FAIL A1: page_content wrong: %', r.page_content;
  END IF;

  -- A2: nothing non-approved leaks, anywhere in the row.
  row_json := row_to_json(r)::text;
  IF row_json LIKE '%SECRET%' THEN
    RAISE EXCEPTION 'FAIL A2: non-approved data leaked: %', row_json;
  END IF;

  -- A3: explicit slug; legacy content passed through verbatim.
  SELECT * INTO r FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000001', 'about');
  IF r.page_slug IS DISTINCT FROM 'about' THEN RAISE EXCEPTION 'FAIL A3: about page not returned'; END IF;
  IF (r.page_content -> 'sections' -> 0 ->> 'text') <> 'About us' THEN
    RAISE EXCEPTION 'FAIL A3: legacy content not passed through: %', r.page_content;
  END IF;

  -- B1: draft page never returned.
  SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000001', 'secret-draft');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL B1: draft page returned'; END IF;

  -- B2/B3: archived and suspended websites hidden (homepage and by slug).
  SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000002', NULL);
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL B2: archived website served'; END IF;
  SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000002', 'home');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL B2: archived website page served'; END IF;
  SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000003', NULL);
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL B3: suspended website served'; END IF;

  -- B4: website with only draft pages => empty (homepage).
  SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000004', NULL);
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL B4: draft-only website returned a page'; END IF;

  -- B5: unknown website / unknown slug.
  SELECT count(*) INTO n FROM public.get_published_page('00000000-0000-4000-8000-000000000000', NULL);
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL B5: unknown website returned a row'; END IF;
  SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000001', 'does-not-exist');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL B5: unknown slug returned a row'; END IF;

  -- C: malformed input never raises, always zero rows.
  BEGIN
    SELECT count(*) INTO n FROM public.get_published_page(NULL, NULL);
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL C1: NULL id returned a row'; END IF;
    SELECT count(*) INTO n FROM public.get_published_page('not-a-uuid', NULL);
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL C2: bad uuid returned a row'; END IF;
    SELECT count(*) INTO n FROM public.get_published_page(''' OR 1=1 --', NULL);
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL C3: injection-looking id returned a row'; END IF;
    SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa22224000800000000000000 1', NULL);
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL C4: non-canonical id returned a row'; END IF;
    SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000001', repeat('a', 201));
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL C5: over-long slug returned a row'; END IF;
    SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000001', E'home\n');
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL C6: control-char slug returned a row'; END IF;
    SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000001', ''' OR ''1''=''1');
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL C7: injection-looking slug returned a row'; END IF;
  EXCEPTION
    WHEN raise_exception THEN RAISE;
    WHEN OTHERS THEN
      RAISE EXCEPTION 'FAIL C: malformed input raised % (%), expected zero rows', SQLSTATE, SQLERRM;
  END;

  -- D: cross-tenant page is never served on A's site, nor listed.
  SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000001', 'hijack');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL D: cross-tenant page served on website A'; END IF;

  SELECT * INTO r FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000001', NULL);
  IF r.page_list::text LIKE '%hijack%' THEN
    RAISE EXCEPTION 'FAIL D: cross-tenant page appeared in page_list: %', r.page_list;
  END IF;

  -- G: website_navigation passes only settings.navigation; page_list has
  -- exactly the 2 real published pages of A (home, about), not the draft
  -- or the cross-tenant hijack page.
  IF r.website_navigation -> 'main' -> 0 ->> 'label' <> 'About' THEN
    RAISE EXCEPTION 'FAIL G1: website_navigation not passed through: %', r.website_navigation;
  END IF;
  IF jsonb_array_length(r.page_list) <> 2 THEN
    RAISE EXCEPTION 'FAIL G2: page_list should have exactly 2 entries, got: %', r.page_list;
  END IF;
  IF NOT (r.page_list @> '[{"slug":"home"}]'::jsonb) OR NOT (r.page_list @> '[{"slug":"about"}]'::jsonb) THEN
    RAISE EXCEPTION 'FAIL G2: page_list missing an expected page: %', r.page_list;
  END IF;

  -- E0: anon still cannot read the raw tables.
  BEGIN
    SELECT count(*) INTO n FROM public.websites WHERE id = 'aaaaaaaa-2222-4000-8000-000000000001';
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL E0: anon can SELECT websites rows directly'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; -- no table grant is also fine
  END;
END $$;

RESET ROLE;

-- ---------------------------------------------------------------------
-- E: authenticated visitor unrelated to business A (owner of B).
-- ---------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-000000000002', true);
SELECT set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', true);

DO $$
DECLARE
  r record;
  n int;
BEGIN
  -- Same public view as anon.
  SELECT * INTO r FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000001', NULL);
  IF r.page_slug IS DISTINCT FROM 'home' THEN RAISE EXCEPTION 'FAIL E1: authenticated visitor did not get homepage'; END IF;
  SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000001', 'secret-draft');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL E2: authenticated visitor got a draft page via RPC'; END IF;
  -- B owns the hijack page, but it still must not appear on A's site.
  SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000001', 'hijack');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL E3: cross-tenant page served to its own author'; END IF;

  -- Existing RLS intact: B cannot read A's rows directly.
  SELECT count(*) INTO n FROM public.websites WHERE business_id = 'aaaaaaaa-1111-4000-8000-000000000001';
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL E4: RLS weakened -- unrelated user sees A websites'; END IF;
  SELECT count(*) INTO n FROM public.web_pages WHERE business_id = 'aaaaaaaa-1111-4000-8000-000000000001';
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL E4: RLS weakened -- unrelated user sees A web_pages'; END IF;
END $$;

RESET ROLE;

-- ---------------------------------------------------------------------
-- E5: business owner A still sees drafts directly (preview path preserved).
-- ---------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
SELECT set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);

DO $$
DECLARE
  n int;
BEGIN
  SELECT count(*) INTO n FROM public.web_pages
   WHERE website_id = 'aaaaaaaa-2222-4000-8000-000000000001' AND slug = 'secret-draft';
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL E5: owner can no longer read own draft page via RLS'; END IF;
  -- ...but the PUBLIC RPC still refuses it, even for the owner.
  SELECT count(*) INTO n FROM public.get_published_page('aaaaaaaa-2222-4000-8000-000000000001', 'secret-draft');
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL E5: public RPC returned a draft to the owner'; END IF;
END $$;

RESET ROLE;

-- ---------------------------------------------------------------------
-- F: function hardening / privileges.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  fn regprocedure := 'public.get_published_page(text, text)'::regprocedure;
  v_secdef boolean;
  v_volatile "char";
  v_config text[];
  v_result text;
BEGIN
  SELECT prosecdef, provolatile, proconfig INTO v_secdef, v_volatile, v_config
    FROM pg_proc WHERE oid = fn;
  IF NOT v_secdef THEN RAISE EXCEPTION 'FAIL F1: not SECURITY DEFINER'; END IF;
  IF v_volatile <> 's' THEN RAISE EXCEPTION 'FAIL F2: not STABLE (got %)', v_volatile; END IF;
  IF v_config IS NULL OR NOT (v_config && ARRAY['search_path=""', 'search_path=']) THEN
    RAISE EXCEPTION 'FAIL F3: search_path not pinned to empty (proconfig=%)', v_config;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p, aclexplode(p.proacl) a
              WHERE p.oid = fn AND a.grantee = 0 AND a.privilege_type = 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL F4: PUBLIC can execute';
  END IF;
  IF NOT has_function_privilege('anon', fn, 'EXECUTE') THEN RAISE EXCEPTION 'FAIL F5: anon cannot execute'; END IF;
  IF NOT has_function_privilege('authenticated', fn, 'EXECUTE') THEN RAISE EXCEPTION 'FAIL F5: authenticated cannot execute'; END IF;
  IF NOT has_function_privilege('service_role', fn, 'EXECUTE') THEN RAISE EXCEPTION 'FAIL F5: service_role cannot execute'; END IF;

  -- Old/stale signatures must not exist.
  IF to_regprocedure('public.get_published_page(uuid, text)') IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL F6: legacy (uuid, text) overload still exists';
  END IF;

  -- Declared result columns are exactly the allow-list.
  v_result := pg_get_function_result(fn);
  IF v_result <> 'TABLE(website_id uuid, website_slug text, website_name text, website_status text, '
                 'website_seo_title text, website_seo_description text, website_favicon_url text, '
                 'website_navigation jsonb, page_slug text, page_title text, page_seo_title text, '
                 'page_seo_description text, page_content jsonb, page_list jsonb)' THEN
    RAISE EXCEPTION 'FAIL F7: result columns differ from the approved allow-list: %', v_result;
  END IF;
END $$;

SELECT 'PASS: public_site_get_published_page' AS result;

ROLLBACK;
