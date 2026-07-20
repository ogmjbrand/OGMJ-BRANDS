-- Payout admin tooling: platform_admins has RLS (platform_admins_self:
-- users can only see their own row) but zero rows, so nothing can be
-- approved today. Rather than granting admin access to a specific account
-- unilaterally, add a one-time self-service bootstrap: any authenticated
-- user can claim admin ONLY while the table is completely empty, via an
-- atomic INSERT ... WHERE NOT EXISTS (avoids a check-then-insert race).
-- A status RPC lets the client know whether to show "claim admin" vs
-- "access denied" without being able to see who else is an admin (RLS
-- still hides other users' rows from a plain SELECT).

CREATE OR REPLACE FUNCTION public.get_platform_admin_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'hasAnyAdmin', EXISTS (SELECT 1 FROM public.platform_admins),
    'isCurrentUserAdmin', public.is_platform_admin()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_first_platform_admin()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_inserted int;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  INSERT INTO public.platform_admins (user_id, level, is_active)
  SELECT auth.uid(), 'admin', true
  WHERE NOT EXISTS (SELECT 1 FROM public.platform_admins);

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'An admin already exists');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$function$;
