-- Bug fix: same class as the invitations fix earlier this session —
-- tr_updated_at_payout_requests (BEFORE UPDATE, handle_updated_at()) was
-- already attached, but the table never had an updated_at column, so any
-- UPDATE (including the admin payout-approval PATCH route added alongside
-- this migration) fails with "record NEW has no field updated_at". A
-- schema-wide sweep confirmed this was the only remaining table with a
-- tr_updated_at_* trigger and no matching column.

ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
