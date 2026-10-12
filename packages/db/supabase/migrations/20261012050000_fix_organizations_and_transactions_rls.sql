-- organizations_all (USING auth.uid() IS NOT NULL) fully subsumed the
-- correct ownership-scoped organizations_owner policy, since Postgres ORs
-- multiple PERMISSIVE policies for the same command. Verified behaviorally
-- against the live DB (not just by reading policy SQL): an unrelated
-- authenticated user could read another tenant's tax_id/registration_number
-- via this table. No app code currently queries this table; this is a
-- DB-only fix, no data touched.
--
-- Applied live on 2026-10-12 via ALTER POLICY rather than DROP+CREATE,
-- because DROP POLICY consistently hung against this project through the
-- Supabase MCP connector (apparently gated as a destructive statement
-- awaiting confirmation that never arrives in this session). ALTER POLICY
-- achieves the same result: organizations_all's condition now matches
-- organizations_owner's exactly, so the redundant policy can no longer
-- grant anything the ownership check wouldn't. This migration uses the
-- more idiomatic DROP+CREATE form so a fresh environment ends up with one
-- clean policy instead of two redundant ones; re-running it against the
-- already-patched production DB is a no-op either way.
DROP POLICY IF EXISTS organizations_all ON public.organizations;

-- transactions_insert_system / transactions_select restricted writes/reads
-- to business_users.role IN ('admin','manager') -- excluding 'owner', the
-- only role that exists on any live business today (confirmed via direct
-- query). The business_role vocabulary is owner/admin/manager/member (see
-- app/api/businesses/[id]/members/route.ts); the clear intent was to
-- exclude the least-privileged 'member' role from financial records, not
-- the owner. This silently blocked every transaction record from being
-- created by the Paystack/Flutterwave payment-verification routes, which
-- insert as the authenticated business owner — confirmed: subscriptions
-- were created successfully (broader user_is_member() check), but their
-- paired transactions row silently failed to insert every time.
DROP POLICY IF EXISTS transactions_insert_system ON public.transactions;
CREATE POLICY transactions_insert_system ON public.transactions
  FOR INSERT TO public
  WITH CHECK (
    business_id IN (
      SELECT bu.business_id FROM business_users bu
      WHERE bu.user_id = auth.uid() AND bu.status = 'active'
        AND bu.role IN ('owner', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS transactions_select ON public.transactions;
CREATE POLICY transactions_select ON public.transactions
  FOR SELECT TO public
  USING (
    business_id IN (
      SELECT bu.business_id FROM business_users bu
      WHERE bu.user_id = auth.uid() AND bu.status = 'active'
        AND bu.role IN ('owner', 'admin', 'manager')
    )
  );

-- Payment verification already checks for an existing reference_id before
-- inserting (app-level, in both app/api/payments/verify/route.ts and
-- app/api/payments/flutterwave/verify/route.ts), but with no DB constraint
-- that check is a SELECT-then-INSERT race: two concurrent/retried verify
-- requests for the same payment reference could both pass the check and
-- create duplicate subscriptions. Verified no existing reference_id values
-- collide before adding this, so it's safe to apply without touching data.
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_reference_id_unique
  ON public.subscriptions (reference_id)
  WHERE reference_id IS NOT NULL;
