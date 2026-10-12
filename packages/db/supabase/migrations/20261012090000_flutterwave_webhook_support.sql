-- Flutterwave had no webhook at all — only the client-redirect verify
-- flow. Adds webhook support using the exact same pattern already
-- established for Paystack (record_paystack_webhook_charge /
-- record_paystack_webhook_transaction_event) and the fal.ai render
-- webhook: a SECURITY DEFINER RPC, since the webhook carries no
-- Supabase user session. Flutterwave's own documented webhook security
-- mechanism (a static secret-hash header, not HMAC — see
-- lib/payments/flutterwave.ts) is the authorization boundary, checked
-- in the route before either of these is ever called.
--
-- Kept as separate, Flutterwave-specific functions rather than
-- generalizing the existing Paystack ones with a provider parameter,
-- to avoid DROP FUNCTION — which, like DROP POLICY earlier this
-- session, hangs indefinitely against this project through the
-- Supabase MCP connector (apparently gated on a confirmation that
-- never arrives in this session), and CREATE OR REPLACE cannot change
-- a function's parameter list. Worth consolidating into one
-- provider-aware pair later from a normal migration/CLI context.
--
-- Applied directly to production via the Supabase MCP connector on
-- 2026-10-12; this file documents that change in version control.

CREATE OR REPLACE FUNCTION public.record_flutterwave_webhook_charge(
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
    p_business_id, p_subscription_id, 'subscription_charge', p_amount, p_currency, 'completed', 'flutterwave', p_reference
  );

  RETURN jsonb_build_object('success', true, 'duplicate', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_flutterwave_webhook_charge(uuid, uuid, text, numeric, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_flutterwave_webhook_transaction_event(
  p_business_id uuid,
  p_reference text,
  p_amount numeric,
  p_currency text,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_business_id IS NULL OR p_reference IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'missing business_id or reference');
  END IF;

  INSERT INTO public.transactions (business_id, type, amount, currency, status, payment_provider, provider_reference)
  VALUES (p_business_id, 'subscription_charge', COALESCE(p_amount, 0), COALESCE(p_currency, 'NGN'), p_status, 'flutterwave', p_reference)
  ON CONFLICT (provider_reference) WHERE provider_reference IS NOT NULL
  DO UPDATE SET status = EXCLUDED.status, updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_flutterwave_webhook_transaction_event(uuid, text, numeric, text, text) TO anon, authenticated;
