-- The Paystack webhook only handled charge.success — nothing recorded a
-- failed charge or a refund anywhere. This adds a second, minimal
-- SECURITY DEFINER function (same sessionless-webhook pattern as
-- record_paystack_webhook_charge) that records a failed/refunded event
-- as a transaction row for visibility, idempotent on provider_reference.
--
-- Deliberately does NOT touch subscription status or access — what
-- should happen to a business's access on refund (pause? cancel? leave
-- it?) is a product decision, not something to invent here. This only
-- makes failed/refunded events visible in the transactions table where
-- today they vanish entirely.
--
-- Applied directly to production via the Supabase MCP connector on
-- 2026-10-12; this file documents that change in version control.

CREATE OR REPLACE FUNCTION public.record_paystack_webhook_transaction_event(
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
  VALUES (p_business_id, 'subscription_charge', COALESCE(p_amount, 0), COALESCE(p_currency, 'NGN'), p_status, 'paystack', p_reference)
  ON CONFLICT (provider_reference) WHERE provider_reference IS NOT NULL
  DO UPDATE SET status = EXCLUDED.status, updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_paystack_webhook_transaction_event(uuid, text, numeric, text, text) TO anon, authenticated;
