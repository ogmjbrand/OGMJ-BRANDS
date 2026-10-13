-- Defense in depth against ever recording a WhatsApp message as 'sent'
-- to the same contact twice for the same campaign. The application
-- layer already guards against this (POST .../campaigns/[id]/send
-- filters out contacts with an existing 'sent' row before looping, and
-- an atomic claim on whatsapp_campaigns.status prevents two concurrent
-- sends of the same campaign), but a database constraint catches this
-- class of bug even if a future code path forgets to check.
--
-- A plain unique index on (campaign_id, contact_id) would be wrong --
-- it would also block recording a second attempt after a first one
-- failed, which is exactly the case a retry needs to work. Partial on
-- status = 'sent' allows any number of 'failed' attempt rows per
-- contact, but at most one 'sent' row, ever.
--
-- NOT YET APPLIED to any environment. Apply only after explicit
-- approval.

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_sends_campaign_contact_sent_once
  ON public.whatsapp_sends (campaign_id, contact_id)
  WHERE status = 'sent';
