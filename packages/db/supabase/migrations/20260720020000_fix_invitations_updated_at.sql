-- Bug fix: tr_updated_at_invitations (BEFORE UPDATE, handle_updated_at())
-- was already attached to invitations, but the table never had an
-- updated_at column — so every UPDATE (accept_invitation's own status
-- change included) has been failing with "record NEW has no field
-- updated_at" since that trigger was created. Adding the column, as every
-- other tr_updated_at_* table in this schema already has, fixes it.

ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
