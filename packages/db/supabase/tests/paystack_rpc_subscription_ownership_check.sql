-- Regression tests for 20261013150000_paystack_rpc_subscription_ownership_check.sql
--
-- Proves:
-- A. A legitimate same-business subscription id is still activated/
--    extended correctly (no regression on the normal path).
-- B. A subscription id belonging to a DIFFERENT business is NOT
--    activated/extended by a payment for business A -- the business's
--    own subscription state is untouched, and the recorded transaction
--    does not reference the mismatched subscription id either.
-- C. Idempotency on provider_reference is unaffected.
--
-- Applies the fix itself first, inside the same transaction, so it can
-- be verified standalone before being applied for real. Always ends in
-- ROLLBACK -- safe to run against production, though staging is
-- preferred.
--
-- Run with: psql "$DATABASE_URL" -f packages/db/supabase/tests/paystack_rpc_subscription_ownership_check.sql
--
-- Two real, pre-existing businesses are used (subscriptions.business_id
-- references businesses, which has RLS-relevant ownership FKs). Swap
-- these for any two distinct real business ids if they stop existing.

BEGIN;

CREATE OR REPLACE FUNCTION public.record_paystack_webhook_charge(
  p_business_id uuid,
  p_subscription_id uuid,
  p_reference text,
  p_amount numeric,
  p_currency text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_matched_subscription_id uuid := NULL;
BEGIN
  IF EXISTS (SELECT 1 FROM public.transactions WHERE provider_reference = p_reference) THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  IF p_subscription_id IS NOT NULL THEN
    UPDATE public.subscriptions
    SET status = 'active',
        current_period_end = now() + interval '1 month'
    WHERE id = p_subscription_id
      AND business_id = p_business_id
    RETURNING id INTO v_matched_subscription_id;
  END IF;

  INSERT INTO public.transactions (
    business_id, subscription_id, type, amount, currency, status, payment_provider, provider_reference
  ) VALUES (
    p_business_id, v_matched_subscription_id, 'subscription_charge', p_amount, p_currency, 'completed', 'paystack', p_reference
  );

  RETURN jsonb_build_object('success', true, 'duplicate', false);
END;
$$;

DO $$
DECLARE
  v_business_a uuid := '691c7ed7-3539-47dc-855f-280e0e002fd2';
  v_business_b uuid := '3346477a-3aa4-489b-af68-72776a7bbccf';
  v_sub_a uuid;
  v_sub_b uuid;
  v_plan_id uuid;
  v_result jsonb;
  v_sub_a_status text;
  v_sub_a_period_end timestamptz;
  v_sub_b_status text;
  v_sub_b_period_end timestamptz;
  v_sub_b_period_end_before timestamptz;
  v_tx_subscription_id uuid;
  v_count int;
BEGIN
  SELECT id INTO v_plan_id FROM public.subscription_plans LIMIT 1;

  INSERT INTO public.subscriptions (business_id, plan_id, status, provider, amount, currency, billing_period, current_period_start, current_period_end, payment_method, reference_id)
  VALUES (v_business_a, v_plan_id, 'past_due', 'paystack', 1000, 'NGN', 'monthly', now() - interval '35 days', now() - interval '5 days', 'paystack', 'OWNERSHIP-TEST-A-REF')
  RETURNING id INTO v_sub_a;

  INSERT INTO public.subscriptions (business_id, plan_id, status, provider, amount, currency, billing_period, current_period_start, current_period_end, payment_method, reference_id)
  VALUES (v_business_b, v_plan_id, 'active', 'paystack', 1000, 'NGN', 'monthly', now() - interval '10 days', now() + interval '20 days', 'paystack', 'OWNERSHIP-TEST-B-REF')
  RETURNING id INTO v_sub_b;

  SELECT current_period_end INTO v_sub_b_period_end_before FROM public.subscriptions WHERE id = v_sub_b;

  -- Test A: a legitimate same-business call still activates/extends
  -- business A's own (past-due) subscription correctly.
  v_result := public.record_paystack_webhook_charge(v_business_a, v_sub_a, 'OWNERSHIP-TEST-LEGIT-CHARGE', 1000, 'NGN');
  SELECT status, current_period_end INTO v_sub_a_status, v_sub_a_period_end FROM public.subscriptions WHERE id = v_sub_a;
  IF v_sub_a_status != 'active' OR v_sub_a_period_end <= now() THEN
    RAISE EXCEPTION 'FAIL: legitimate same-business charge did not activate/extend subscription A (status=%, period_end=%)', v_sub_a_status, v_sub_a_period_end;
  END IF;
  RAISE NOTICE 'PASS: legitimate same-business subscription is still activated/extended';

  -- Test B: business A pays, but the subscription id supplied belongs
  -- to business B (the exact shape of the metadata-injection attack).
  -- Business B's subscription must be completely untouched.
  v_result := public.record_paystack_webhook_charge(v_business_a, v_sub_b, 'OWNERSHIP-TEST-CROSS-BUSINESS-ATTEMPT', 1000, 'NGN');
  SELECT status, current_period_end INTO v_sub_b_status, v_sub_b_period_end FROM public.subscriptions WHERE id = v_sub_b;
  IF v_sub_b_status != 'active' OR v_sub_b_period_end != v_sub_b_period_end_before THEN
    RAISE EXCEPTION 'FAIL: a payment for business A updated business B''s subscription -- status=%, period_end=% (expected unchanged %)', v_sub_b_status, v_sub_b_period_end, v_sub_b_period_end_before;
  END IF;

  -- The transaction must still be recorded (business A did pay), but
  -- must NOT reference business B's subscription id.
  SELECT subscription_id INTO v_tx_subscription_id FROM public.transactions WHERE provider_reference = 'OWNERSHIP-TEST-CROSS-BUSINESS-ATTEMPT';
  IF v_tx_subscription_id = v_sub_b THEN
    RAISE EXCEPTION 'FAIL: recorded transaction references business B''s subscription id despite the mismatch';
  END IF;
  IF v_tx_subscription_id IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: expected NULL subscription_id on the mismatched-ownership transaction, got %', v_tx_subscription_id;
  END IF;
  RAISE NOTICE 'PASS: cross-business subscription id is rejected -- business B''s subscription is untouched, and the transaction does not reference it';

  -- Test C: idempotency on provider_reference is unaffected by this change.
  v_result := public.record_paystack_webhook_charge(v_business_a, v_sub_a, 'OWNERSHIP-TEST-LEGIT-CHARGE', 1000, 'NGN');
  SELECT count(*) INTO v_count FROM public.transactions WHERE provider_reference = 'OWNERSHIP-TEST-LEGIT-CHARGE';
  IF NOT ((v_result->>'duplicate')::boolean = true AND v_count = 1) THEN
    RAISE EXCEPTION 'FAIL: idempotency regression -- duplicate=%, row_count=%', v_result->>'duplicate', v_count;
  END IF;
  RAISE NOTICE 'PASS: idempotency on provider_reference is unaffected';
END $$;

ROLLBACK;
