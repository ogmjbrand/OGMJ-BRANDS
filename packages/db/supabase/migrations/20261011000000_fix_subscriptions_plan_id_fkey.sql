-- subscriptions.plan_id was pointing at the orphaned legacy `plans` table
-- (never referenced by any application code), while every payment route
-- (/api/plans, /api/payments/initialize, /api/payments/verify,
-- /api/subscriptions/upgrade) reads and writes plan_id values from the
-- real, actively-used `subscription_plans` table. Those two tables have
-- completely different UUIDs for the same plan names, so every
-- successful Paystack payment would have failed to record a subscription
-- with a foreign key violation — the customer charged, with no active
-- plan to show for it. subscriptions had zero rows in production at the
-- time of this fix (no payments have ever gone through, since
-- PAYSTACK_SECRET_KEY was never set), so this is a pure schema
-- correction with no data to migrate.
--
-- Applied directly to production via the Supabase MCP connector on
-- 2026-10-11 and verified with a real INSERT against a subscription_plans
-- id; this file documents that change in version control.

ALTER TABLE public.subscriptions
  DROP CONSTRAINT subscriptions_plan_id_fkey;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_id_fkey
  FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);
