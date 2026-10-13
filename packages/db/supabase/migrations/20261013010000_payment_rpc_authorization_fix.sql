-- SECURITY FIX (audit finding C1): payment-recording webhook RPCs were
-- SECURITY DEFINER functions granted EXECUTE to PUBLIC/anon/authenticated,
-- with no internal authorization check of their own. Since Supabase/
-- PostgREST exposes any anon-executable function as a public
-- `POST /rest/v1/rpc/<name>` endpoint, anyone with the public anon key
-- (shipped to every browser) could call these directly, bypassing the
-- Next.js webhook route's signature check entirely, and insert a
-- fabricated "completed" transaction for any business, or (for the
-- transaction-event functions, via their ON CONFLICT DO UPDATE) flip an
-- existing real transaction's status.
--
-- record_paystack_webhook_charge and record_paystack_webhook_transaction_event
-- are live in production today (merged in PR #54). record_flutterwave_
-- webhook_charge and record_flutterwave_webhook_transaction_event are
-- live in the same shared database (applied directly during development)
-- even though their PR (#55) is not yet merged to main -- the database
-- is a single shared resource, not gated by git branch state.
--
-- Fix: restrict these four functions to the service_role only, and move
-- their one legitimate caller (the webhook routes) onto a service-role
-- Supabase client (apps/web/lib/supabase/service-role.ts), which is
-- never exposed to the browser. Since service_role already bypasses RLS
-- unconditionally, SECURITY DEFINER no longer buys these functions
-- anything -- converting them to SECURITY INVOKER (the default) removes
-- the privilege-escalation surface entirely: if EXECUTE is ever
-- mistakenly re-granted to anon/authenticated in the future, an INVOKER
-- function is immediately subject to ordinary RLS as that caller, rather
-- than silently dangerous again the way a DEFINER function would be.
--
-- Checked for alternate-signature overloads of all four names before
-- writing this: confirmed there is exactly one overload per name (see
-- pg_get_function_identity_arguments), so there is no vulnerable sibling
-- signature left ungranted-against.

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

-- NOTE: these functions write to `transactions` and (when p_subscription_id
-- is supplied) `subscriptions`, both RLS-protected tables. Now that the
-- functions run SECURITY INVOKER as service_role, and service_role
-- bypasses RLS by definition, their writes continue to succeed exactly
-- as before for the one legitimate caller (the webhook route) -- this
-- migration changes WHO can call these functions, not WHAT they do once
-- called correctly.
