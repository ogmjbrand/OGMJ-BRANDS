-- SECURITY FIX: record_paystack_webhook_charge trusted its caller-supplied
-- p_subscription_id to decide which subscription row to activate, with no
-- check that the subscription actually belongs to p_business_id (the
-- business the verified payment is for).
--
-- Found during review of the metadata path that fed p_subscription_id:
-- apps/web/app/api/payments/initialize/route.ts used to spread an
-- attacker-controlled `metadata` object into what Paystack stores and
-- echoes back on charge.success, so a client could inject a
-- `subscriptionId` key pointing at a different business's subscription.
-- That application-layer path has been closed (initialize now builds
-- Paystack metadata from a fixed, server-only allowlist with no client
-- passthrough), but this function is a SECURITY DEFINER RPC callable by
-- service_role with no application-layer involvement at all once called
-- -- it should not depend on the calling route being the only thing
-- standing between it and a cross-business update. Enforcing the
-- ownership check here as well means a future caller (or a regression
-- in the application-layer fix) can't silently reopen this.
--
-- Fix: the subscription UPDATE now also requires business_id =
-- p_business_id. A subscription id that doesn't belong to the paying
-- business simply matches zero rows (safe no-op) instead of activating
-- or extending someone else's subscription. The transaction insert is
-- unchanged -- it already correctly uses p_business_id, not whatever
-- business the stale subscription id might belong to.

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
    -- A subscription id that exists but belongs to a different business
    -- matches zero rows here: v_matched_subscription_id stays NULL, so
    -- the transaction below is correctly recorded as not tied to any
    -- subscription, instead of referencing a subscription it has no
    -- business pointing at.
  END IF;

  INSERT INTO public.transactions (
    business_id, subscription_id, type, amount, currency, status, payment_provider, provider_reference
  ) VALUES (
    p_business_id, v_matched_subscription_id, 'subscription_charge', p_amount, p_currency, 'completed', 'paystack', p_reference
  );

  RETURN jsonb_build_object('success', true, 'duplicate', false);
END;
$$;

-- Function already carries the correct SECURITY INVOKER mode and
-- service_role-only grant from 20261013010000_payment_rpc_authorization_fix.sql.
-- CREATE OR REPLACE preserves existing grants, but this is restated for
-- clarity and to be explicit this migration does not change who can call it.
REVOKE EXECUTE ON FUNCTION public.record_paystack_webhook_charge(uuid, uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_paystack_webhook_charge(uuid, uuid, text, numeric, text) TO service_role;
