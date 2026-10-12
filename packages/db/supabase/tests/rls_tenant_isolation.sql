-- Tenant isolation test for the `organizations` table.
--
-- Written in response to a confirmed, live cross-tenant data leak: a
-- second PERMISSIVE RLS policy (organizations_all, USING auth.uid() IS NOT
-- NULL) fully subsumed the correct ownership-scoped policy
-- (organizations_owner), letting any authenticated user read any other
-- tenant's organizations row (name, tax_id, registration_number, address,
-- phone, email). Verified exploitable against the live DB on 2026-10-12
-- before the fix (see migration 20261012050000_fix_organizations_and_
-- transactions_rls.sql), then verified fixed with this same test.
--
-- Run with: psql "$DATABASE_URL" -f packages/db/supabase/tests/rls_tenant_isolation.sql
-- (or via the Supabase SQL editor / CLI). Self-contained and self-cleaning
-- — runs inside a transaction that's always rolled back, so it leaves no
-- data behind and is safe to run against a real environment including
-- production, though staging is preferred.
--
-- Two real, pre-existing users are used as tenant owners (RLS-relevant
-- FKs reference auth.users, so synthetic UUIDs would fail the FK check).
-- Swap these for any two distinct real user ids if they stop existing.

BEGIN;

DO $$
DECLARE
  owner_a uuid := '530e3377-69b9-430a-8a92-ec9b20a1a3e0';
  owner_b uuid := '19c920b5-538c-4050-8cec-df65acf50f1c';
  org_a_id uuid;
  visible_rows int;
BEGIN
  -- Seed as the privileged migration role (bypasses RLS) — this is the
  -- fixture setup, not part of what's under test.
  INSERT INTO organizations (owner_id, name, slug, country, currency, tax_id, registration_number)
  VALUES (owner_a, 'RLS-TEST-Tenant-A', 'rls-test-tenant-a-' || substr(gen_random_uuid()::text, 1, 8), 'NG', 'NGN', 'SECRET-TAX-A', 'SECRET-REG-A')
  RETURNING id INTO org_a_id;

  -- Impersonate owner_b (a user with no relationship to org A) and attempt
  -- to read org A's row under real RLS enforcement (role=authenticated,
  -- not the privileged role used for the INSERT above).
  PERFORM set_config('request.jwt.claim.sub', owner_b::text, true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO visible_rows FROM organizations WHERE id = org_a_id;

  IF visible_rows > 0 THEN
    RAISE EXCEPTION 'TENANT ISOLATION FAILURE: an unrelated user (owner_b) can read another tenant''s organizations row (id=%)', org_a_id;
  END IF;

  RESET ROLE;

  -- Confirm the fix didn't also break legitimate access: the real owner
  -- must still be able to see their own row.
  PERFORM set_config('request.jwt.claim.sub', owner_a::text, true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO visible_rows FROM organizations WHERE id = org_a_id;

  IF visible_rows = 0 THEN
    RAISE EXCEPTION 'REGRESSION: the organization''s own owner (owner_a) can no longer read their own row (id=%)', org_a_id;
  END IF;

  RESET ROLE;

  RAISE NOTICE 'PASS: tenant isolation holds on organizations — owner_b cannot read owner_a''s row, owner_a still can';
END $$;

ROLLBACK;
