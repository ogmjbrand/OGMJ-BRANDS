-- app/api/webhooks/paystack/route.ts has no Supabase user session (it's
-- Paystack calling back directly, authenticated only by its HMAC-SHA512
-- signature, already verified before this function is ever called) — so
-- its direct .update('subscriptions') / .insert('transactions') calls
-- were silently rejected by RLS regardless of the role-array fix in
-- 20261012050000, since auth.uid() is NULL for an unauthenticated
-- request. Same root cause class as the fal.ai render webhook
-- (complete_video_scene_render, see 20261012030000) — not RLS-fixable
-- from a sessionless caller, and a service-role key would be a new
-- privileged secret the app has deliberately avoided everywhere else.
--
-- This SECURITY DEFINER function performs the same update/insert the
-- route already attempted, as one call, and is idempotent on
-- provider_reference since Paystack can redeliver the same webhook event
-- (a second delivery returns {duplicate: true} and does nothing further,
-- rather than creating a second transaction row).
--
-- Applied directly to production via the Supabase MCP connector on
-- 2026-10-12; this file documents that change in version control.

CREATE UNIQUE INDEX IF NOT EXISTS transactions_provider_reference_unique
  ON public.transactions (provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.record_paystack_webhook_charge(
  p_business_id uuid,
  p_subscription_id uuid,
  p_reference text,
  p_amount numeric,
  p_currency text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.transactions WHERE provider_reference = p_reference) THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  IF p_subscription_id IS NOT NULL THEN
    UPDATE public.subscriptions
    SET status = 'active',
        current_period_end = now() + interval '1 month'
    WHERE id = p_subscription_id;
  END IF;

  INSERT INTO public.transactions (
    business_id, subscription_id, type, amount, currency, status, payment_provider, provider_reference
  ) VALUES (
    p_business_id, p_subscription_id, 'subscription_charge', p_amount, p_currency, 'completed', 'paystack', p_reference
  );

  RETURN jsonb_build_object('success', true, 'duplicate', false);
END;
$$;

-- Called by the unauthenticated webhook route via the anon key — the
-- HMAC signature check in the route itself is what gates this, not RLS
-- or this grant.
GRANT EXECUTE ON FUNCTION public.record_paystack_webhook_charge(uuid, uuid, text, numeric, text) TO anon, authenticated;
