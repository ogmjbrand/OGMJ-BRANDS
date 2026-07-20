-- Affiliate/Partner Hub. RLS + a seeded program already existed on the live
-- database (applied outside this repo's tracked migrations at some point),
-- but three of the existing policies let a user directly UPDATE columns
-- that should only ever change through system/admin logic:
--   - referrals_own (ALL) let a referrer overwrite their own clicks/
--     signups/conversions/total_earned directly.
--   - payout_requests_own (ALL) let a user set their own payout status
--     (e.g. to 'paid') instead of only admins processing it.
--   - marketplace_orders_update let a buyer rewrite their own order's
--     price/status after creation.
-- Tightened to split select/insert (owner) from update (admin-only).
-- referral_clicks_insert (WITH CHECK true) is dropped too: it's superseded
-- by the SECURITY DEFINER record_referral_click() below, which is the only
-- path that also needs to increment referrals.clicks atomically — an open
-- direct-insert policy alongside that is just an unnecessary abuse surface.

DROP POLICY IF EXISTS referrals_own ON public.referrals;
CREATE POLICY referrals_select ON public.referrals AS PERMISSIVE FOR SELECT TO public
  USING (referrer_id = auth.uid() OR is_platform_admin());
CREATE POLICY referrals_insert ON public.referrals AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (referrer_id = auth.uid());
CREATE POLICY referrals_admin_update ON public.referrals AS PERMISSIVE FOR UPDATE TO public
  USING (is_platform_admin());

DROP POLICY IF EXISTS payout_requests_own ON public.payout_requests;
CREATE POLICY payout_requests_select ON public.payout_requests AS PERMISSIVE FOR SELECT TO public
  USING (user_id = auth.uid() OR is_platform_admin());
CREATE POLICY payout_requests_insert ON public.payout_requests AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (user_id = auth.uid());
CREATE POLICY payout_requests_admin_update ON public.payout_requests AS PERMISSIVE FOR UPDATE TO public
  USING (is_platform_admin());

DROP POLICY IF EXISTS marketplace_orders_update ON public.marketplace_orders;
CREATE POLICY marketplace_orders_admin_update ON public.marketplace_orders AS PERMISSIVE FOR UPDATE TO public
  USING (is_platform_admin());

DROP POLICY IF EXISTS referral_clicks_insert ON public.referral_clicks;

-- ── RPCs: click tracking and signup attribution cross the RLS boundary
-- (an anonymous visitor incrementing a referrer's counters, or a
-- brand-new signup marking a click converted), same pattern as the
-- existing accept_invitation() SECURITY DEFINER function.

CREATE OR REPLACE FUNCTION public.record_referral_click(
  p_code text,
  p_referrer_url text DEFAULT NULL,
  p_landing_url text DEFAULT NULL,
  p_ip_hash text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_referral_id uuid;
  v_click_id uuid;
BEGIN
  SELECT id INTO v_referral_id FROM public.referrals WHERE code = p_code AND status = 'active';

  IF v_referral_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  INSERT INTO public.referral_clicks (referral_id, ip_hash, user_agent, referrer_url, landing_url)
  VALUES (v_referral_id, p_ip_hash, p_user_agent, p_referrer_url, p_landing_url)
  RETURNING id INTO v_click_id;

  UPDATE public.referrals SET clicks = clicks + 1, updated_at = now() WHERE id = v_referral_id;

  RETURN jsonb_build_object('success', true, 'click_id', v_click_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_referral_signup(p_click_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_referral_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT referral_id INTO v_referral_id
  FROM public.referral_clicks
  WHERE id = p_click_id AND converted = false;

  IF v_referral_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Click not found or already converted');
  END IF;

  UPDATE public.referral_clicks SET converted = true WHERE id = p_click_id;

  UPDATE public.referrals
  SET signups = signups + 1,
      referred_id = COALESCE(referred_id, auth.uid()),
      updated_at = now()
  WHERE id = v_referral_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;
