-- Team Collaboration: record an activity_logs entry when a user accepts a
-- team invitation, so the new member shows up in the business's activity
-- feed the same way invites/role-changes/removals already do.

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  inv public.invitations%ROWTYPE;
BEGIN
  SELECT * INTO inv FROM public.invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > now();

  IF inv.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Add member
  INSERT INTO public.business_members (business_id, user_id, role, invited_by)
  VALUES (inv.business_id, auth.uid(), inv.role, inv.invited_by)
  ON CONFLICT DO NOTHING;

  -- Update invitation status
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = inv.id;

  INSERT INTO public.activity_logs (business_id, user_id, action, entity_type, entity_id)
  VALUES (inv.business_id, auth.uid(), 'joined', 'team_member', auth.uid());

  RETURN jsonb_build_object('success', true, 'business_id', inv.business_id);
END;
$function$;
