-- Regression tests for 20261013010000_payment_rpc_authorization_fix.sql
-- (audit finding C1).
--
-- Proves:
-- A. anon can no longer call any of the 4 payment-recording RPCs.
-- B. an authenticated-but-unrelated user is also rejected (confirms
--    this is a real grant fix, not an anon-specific patch that leaves
--    the functions callable by any logged-in user).
-- C. service_role (the legitimate webhook path after this fix) can
--    still call them, and idempotency is unaffected.
--
-- This file applies the fix itself first, inside the same transaction,
-- so it can be run standalone against a disposable/test database to
-- verify the fix before it's applied for real. Run against PRODUCTION
-- only inside a session that ends in ROLLBACK (see the session notes
-- for how this was verified without persisting any change).
--
-- Run with: psql "$DATABASE_URL" -f packages/db/supabase/tests/payment_rpc_authorization_fix.sql

BEGIN;

REVOKE EXECUTE ON FUNCTION public.record_paystack_webhook_charge(uuid, uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.record_paystack_webhook_charge(uuid, uuid, text, numeric, text) SECURITY INVOKER;
GRANT EXECUTE ON FUNCTION public.record_paystack_webhook_charge(uuid, uuid, text, numeric, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_paystack_webhook_transaction_event(uuid, text, numeric, text, text) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.record_paystack_webhook_transaction_event(uuid, text, numeric, text, text) SECURITY INVOKER;
GRANT EXECUTE ON FUNCTION public.record_paystack_webhook_transaction_event(uuid, text, numeric, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_flutterwave_webhook_charge(uuid, uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.record_flutterwave_webhook_charge(uuid, uuid, text, numeric, text) SECURITY INVOKER;
GRANT EXECUTE ON FUNCTION public.record_flutterwave_webhook_charge(uuid, uuid, text, numeric, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_flutterwave_webhook_transaction_event(uuid, text, numeric, text, text) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.record_flutterwave_webhook_transaction_event(uuid, text, numeric, text, text) SECURITY INVOKER;
GRANT EXECUTE ON FUNCTION public.record_flutterwave_webhook_transaction_event(uuid, text, numeric, text, text) TO service_role;

-- Test A: anon is rejected on all 4 RPCs.
DO $$
DECLARE
  v_business_id uuid := '691c7ed7-3539-47dc-855f-280e0e002fd2';
  v_rejected boolean;
BEGIN
  SET LOCAL ROLE anon;

  v_rejected := false;
  BEGIN
    PERFORM public.record_paystack_webhook_charge(v_business_id, NULL, 'C1-TEST-ANON-PAYSTACK-CHARGE', 500, 'NGN');
  EXCEPTION WHEN insufficient_privilege THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN
    RAISE EXCEPTION 'FAIL: anon could still call record_paystack_webhook_charge';
  END IF;

  v_rejected := false;
  BEGIN
    PERFORM public.record_paystack_webhook_transaction_event(v_business_id, 'C1-TEST-ANON-PAYSTACK-EVENT', 500, 'NGN', 'failed');
  EXCEPTION WHEN insufficient_privilege THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN
    RAISE EXCEPTION 'FAIL: anon could still call record_paystack_webhook_transaction_event';
  END IF;

  v_rejected := false;
  BEGIN
    PERFORM public.record_flutterwave_webhook_charge(v_business_id, NULL, 'C1-TEST-ANON-FLW-CHARGE', 500, 'NGN');
  EXCEPTION WHEN insufficient_privilege THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN
    RAISE EXCEPTION 'FAIL: anon could still call record_flutterwave_webhook_charge';
  END IF;

  v_rejected := false;
  BEGIN
    PERFORM public.record_flutterwave_webhook_transaction_event(v_business_id, 'C1-TEST-ANON-FLW-EVENT', 500, 'NGN', 'failed');
  EXCEPTION WHEN insufficient_privilege THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN
    RAISE EXCEPTION 'FAIL: anon could still call record_flutterwave_webhook_transaction_event';
  END IF;

  RESET ROLE;
  RAISE NOTICE 'PASS: anon is rejected with insufficient_privilege on all 4 RPCs';
END $$;

-- Test B: an authenticated-but-unrelated user is also rejected.
DO $$
DECLARE
  v_business_id uuid := '691c7ed7-3539-47dc-855f-280e0e002fd2';
  v_random_user uuid := gen_random_uuid();
  v_rejected boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_random_user::text, true);
  SET LOCAL ROLE authenticated;

  BEGIN
    PERFORM public.record_paystack_webhook_charge(v_business_id, NULL, 'C1-TEST-AUTH-PAYSTACK-CHARGE', 500, 'NGN');
  EXCEPTION WHEN insufficient_privilege THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN
    RAISE EXCEPTION 'FAIL: an authenticated-but-unrelated user could still call record_paystack_webhook_charge';
  END IF;

  RESET ROLE;
  RAISE NOTICE 'PASS: authenticated role is also rejected -- this is a grant fix, not an anon-only patch';
END $$;

-- Test C: service_role (the legitimate webhook path after this fix)
-- can still call both providers' charge RPCs, and idempotency holds.
DO $$
DECLARE
  v_business_id uuid := '691c7ed7-3539-47dc-855f-280e0e002fd2';
  v_result1 jsonb;
  v_result2 jsonb;
  v_count int;
BEGIN
  SET LOCAL ROLE service_role;

  v_result1 := public.record_paystack_webhook_charge(v_business_id, NULL, 'C1-TEST-SERVICEROLE-CHARGE', 500, 'NGN');
  v_result2 := public.record_paystack_webhook_charge(v_business_id, NULL, 'C1-TEST-SERVICEROLE-CHARGE', 500, 'NGN');
  SELECT count(*) INTO v_count FROM transactions WHERE provider_reference = 'C1-TEST-SERVICEROLE-CHARGE';
  IF NOT ((v_result1->>'duplicate')::boolean = false AND (v_result2->>'duplicate')::boolean = true AND v_count = 1) THEN
    RAISE EXCEPTION 'FAIL: Paystack service_role path broken -- first_duplicate=%, second_duplicate=%, row_count=%', v_result1->>'duplicate', v_result2->>'duplicate', v_count;
  END IF;

  v_result1 := public.record_flutterwave_webhook_charge(v_business_id, NULL, 'C1-TEST-SERVICEROLE-FLW-CHARGE', 500, 'NGN');
  v_result2 := public.record_flutterwave_webhook_charge(v_business_id, NULL, 'C1-TEST-SERVICEROLE-FLW-CHARGE', 500, 'NGN');
  SELECT count(*) INTO v_count FROM transactions WHERE provider_reference = 'C1-TEST-SERVICEROLE-FLW-CHARGE';
  IF NOT ((v_result1->>'duplicate')::boolean = false AND (v_result2->>'duplicate')::boolean = true AND v_count = 1) THEN
    RAISE EXCEPTION 'FAIL: Flutterwave service_role path broken -- first_duplicate=%, second_duplicate=%, row_count=%', v_result1->>'duplicate', v_result2->>'duplicate', v_count;
  END IF;

  RESET ROLE;
  RAISE NOTICE 'PASS: service_role can still call both charge RPCs, and idempotency is unaffected by the fix';
END $$;

ROLLBACK;
