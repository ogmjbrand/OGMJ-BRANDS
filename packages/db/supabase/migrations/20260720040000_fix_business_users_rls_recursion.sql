-- Bug fix: business_users_select/insert/update each queried business_users
-- from *within their own USING/WITH CHECK clause* (a subquery aliased `bu`
-- against the same table the policy protects). Postgres RLS re-applies a
-- table's policy to every scan of that table, including scans inside its
-- own policy's subquery — so evaluating the policy required evaluating the
-- policy, which required evaluating the policy... Postgres's recursion
-- guard caught this and threw "infinite recursion detected in policy for
-- relation business_users", observed live during onboarding.
--
-- Every other table in this schema avoids this exact trap by centralizing
-- membership checks into a SECURITY DEFINER function (is_business_member,
-- is_biz_member, user_is_member) — those run as the function owner, which
-- bypasses RLS entirely on the table they query internally, so no
-- self-reference occurs. business_users just never got that treatment.
-- Fixed the same way, adding an admin-only equivalent (is_business_admin)
-- for the insert/update policies, which were admin-gated before.

CREATE OR REPLACE FUNCTION public.is_business_admin(bid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = bid AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = bid
    AND user_id = auth.uid()
    AND is_active = true
    AND role::text IN ('owner', 'admin')
  );
$function$;

DROP POLICY IF EXISTS business_users_select ON public.business_users;
DROP POLICY IF EXISTS business_users_insert ON public.business_users;
DROP POLICY IF EXISTS business_users_update ON public.business_users;

CREATE POLICY business_users_select ON public.business_users AS PERMISSIVE FOR SELECT TO public
  USING (user_id = auth.uid() OR is_business_member(business_id));

CREATE POLICY business_users_insert ON public.business_users AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_admin(business_id));

CREATE POLICY business_users_update ON public.business_users AS PERMISSIVE FOR UPDATE TO public
  USING (is_business_admin(business_id));
