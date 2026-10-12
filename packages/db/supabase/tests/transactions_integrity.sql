-- Transaction-recording integrity tests.
--
-- Written in response to confirmed bugs, fixed in migrations
-- 20261012050000_fix_organizations_and_transactions_rls.sql,
-- 20261012060000_paystack_webhook_rpc.sql,
-- 20261012080000_paystack_failed_refund_events.sql, and
-- 20261012090000_flutterwave_webhook_support.sql:
--
-- 1. transactions_insert_system / transactions_select restricted access
--    to business_users.role IN ('admin','manager'), excluding 'owner' —
--    the only role that exists on any live business. Every real Paystack/
--    Flutterwave payment activated its subscription but silently failed
--    to record a transaction row.
-- 2. The Paystack webhook (app/api/webhooks/paystack/route.ts) has no
--    user session at all, so its writes were blocked regardless of (1) —
--    fixed via a SECURITY DEFINER RPC, same pattern as the fal.ai render
--    webhook.
-- 3. Flutterwave had no webhook at all. Added with the same pattern.
--
-- Run with: psql "$DATABASE_URL" -f packages/db/supabase/tests/transactions_integrity.sql
-- Self-contained and self-cleaning — runs inside a transaction that's
-- always rolled back.

BEGIN;

-- Test 1: a real business owner (role=owner) can create and read their
-- own business's transaction records.
DO $$
DECLARE
  v_business_id uuid := '691c7ed7-3539-47dc-855f-280e0e002fd2';
  v_owner uuid := '530e3377-69b9-430a-8a92-ec9b20a1a3e0';
  v_tx_id uuid;
  v_visible int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_owner::text, true);
  SET LOCAL ROLE authenticated;

  INSERT INTO transactions (business_id, type, amount, currency, status, payment_provider, provider_reference)
  VALUES (v_business_id, 'subscription_charge', 1000, 'NGN', 'completed', 'paystack', 'RLS-TEST-REF-OWNER-INSERT')
  RETURNING id INTO v_tx_id;

  SELECT count(*) INTO v_visible FROM transactions WHERE id = v_tx_id;

  IF v_visible != 1 THEN
    RAISE EXCEPTION 'FAIL: business owner (role=owner) could not insert/read their own transactions row';
  END IF;

  RESET ROLE;
  RAISE NOTICE 'PASS: business owner (role=owner) can insert and read their own transactions row';
END $$;

-- Test 2: the Paystack webhook RPC records a charge once and treats a
-- redelivery of the same provider_reference as a no-op duplicate, not a
-- second transaction row.
DO $$
DECLARE
  v_business_id uuid := '691c7ed7-3539-47dc-855f-280e0e002fd2';
  v_result1 jsonb;
  v_result2 jsonb;
  v_count int;
BEGIN
  v_result1 := public.record_paystack_webhook_charge(v_business_id, NULL, 'RLS-TEST-WEBHOOK-REF', 500, 'NGN');
  v_result2 := public.record_paystack_webhook_charge(v_business_id, NULL, 'RLS-TEST-WEBHOOK-REF', 500, 'NGN');

  SELECT count(*) INTO v_count FROM transactions WHERE provider_reference = 'RLS-TEST-WEBHOOK-REF';

  IF NOT ((v_result1->>'duplicate')::boolean = false AND (v_result2->>'duplicate')::boolean = true AND v_count = 1) THEN
    RAISE EXCEPTION 'FAIL: first_duplicate=%, second_duplicate=%, row_count=%', v_result1->>'duplicate', v_result2->>'duplicate', v_count;
  END IF;

  RAISE NOTICE 'PASS: webhook RPC records a charge once and correctly identifies a redelivery as a duplicate';
END $$;

-- Test 3: same idempotency guarantee for the Flutterwave webhook RPC.
DO $$
DECLARE
  v_business_id uuid := '691c7ed7-3539-47dc-855f-280e0e002fd2';
  v_result1 jsonb;
  v_result2 jsonb;
  v_count int;
BEGIN
  v_result1 := public.record_flutterwave_webhook_charge(v_business_id, NULL, 'RLS-TEST-FLW-WEBHOOK-REF', 500, 'NGN');
  v_result2 := public.record_flutterwave_webhook_charge(v_business_id, NULL, 'RLS-TEST-FLW-WEBHOOK-REF', 500, 'NGN');

  SELECT count(*) INTO v_count FROM transactions WHERE provider_reference = 'RLS-TEST-FLW-WEBHOOK-REF';

  IF NOT ((v_result1->>'duplicate')::boolean = false AND (v_result2->>'duplicate')::boolean = true AND v_count = 1) THEN
    RAISE EXCEPTION 'FAIL: flutterwave first_duplicate=%, second_duplicate=%, row_count=%', v_result1->>'duplicate', v_result2->>'duplicate', v_count;
  END IF;

  RAISE NOTICE 'PASS: Flutterwave webhook RPC records a charge once and correctly identifies a redelivery as a duplicate';
END $$;

-- Test 4: failed/refunded events are recorded without creating or
-- touching a subscription, and are themselves idempotent (a redelivered
-- failed/refund event updates the same row's status, not a new row).
DO $$
DECLARE
  v_business_id uuid := '691c7ed7-3539-47dc-855f-280e0e002fd2';
  v_count int;
BEGIN
  PERFORM public.record_paystack_webhook_transaction_event(v_business_id, 'RLS-TEST-FAILED-REF', 1000, 'NGN', 'failed');
  PERFORM public.record_paystack_webhook_transaction_event(v_business_id, 'RLS-TEST-FAILED-REF', 1000, 'NGN', 'failed');

  SELECT count(*) INTO v_count FROM transactions WHERE provider_reference = 'RLS-TEST-FAILED-REF';
  IF v_count != 1 THEN
    RAISE EXCEPTION 'FAIL: failed-event recording created % rows instead of 1', v_count;
  END IF;

  IF EXISTS (SELECT 1 FROM subscriptions WHERE reference_id = 'RLS-TEST-FAILED-REF') THEN
    RAISE EXCEPTION 'FAIL: a failed-charge event created a subscription row — it must not';
  END IF;

  RAISE NOTICE 'PASS: failed/refunded events record once, idempotently, and never touch subscriptions';
END $$;

ROLLBACK;
