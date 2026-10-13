import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { isTwilioConfigured, isTwilioSendingEnabled, sendWhatsAppMessage } from '@/lib/whatsapp/twilio';
import { checkRateLimit } from '@/lib/utils/rate-limit';

// A bulk campaign send can reach far more people in one call than the
// ad-hoc single-send endpoint (which caps at 20/hour) -- cap it by total
// recipients dispatched per business per hour, not by call count, since
// a single campaign with thousands of contacts would otherwise sail
// through a per-call limit while blasting out thousands of messages.
const CAMPAIGN_RATE_LIMIT = { endpoint: 'whatsapp:campaign-send', limit: 500, windowMinutes: 60 };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isTwilioConfigured()) {
      return NextResponse.json(
        {
          error: 'WhatsApp sending is not configured',
          hint: 'TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, and TWILIO_WHATSAPP_FROM are not all set on this deployment.',
        },
        { status: 503 }
      );
    }

    if (!isTwilioSendingEnabled()) {
      return NextResponse.json(
        {
          error: 'WhatsApp sending has not been enabled on this deployment',
          hint: 'This integration is in sandbox/testing mode. Set TWILIO_WHATSAPP_ENABLED=true once the Twilio sandbox (or WhatsApp sender number) has been verified.',
        },
        { status: 503 }
      );
    }

    const { id } = await params;
    const supabase = await createServerClient();

    const { data: campaign, error: campaignError } = await supabase
      .from('whatsapp_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    if ((campaign as any).status !== 'draft') {
      return NextResponse.json({ error: 'This campaign has already been sent' }, { status: 400 });
    }

    const { data: membership } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', (campaign as any).business_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let contactsQuery = supabase
      .from('contacts')
      .select('id, phone')
      .eq('business_id', (campaign as any).business_id)
      .not('phone', 'is', null);

    const filter = (campaign as any).recipient_filter || {};
    if (filter.status) {
      contactsQuery = contactsQuery.eq('status', filter.status);
    }

    const { data: contacts, error: contactsError } = await contactsQuery;
    if (contactsError) {
      return NextResponse.json({ error: contactsError.message }, { status: 400 });
    }

    let recipients = (contacts as any[]) ?? [];
    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No matching recipients with a phone number' }, { status: 400 });
    }

    // Defense against duplicating a message to someone who already
    // received it. Nothing currently resets a 'sending'/'failed' campaign
    // back to 'draft' -- the atomic claim below is what actually prevents
    // a double-send today -- but this is what makes it SAFE if a future
    // resume/retry path (or a manual DB fix after a crash mid-send) ever
    // re-invokes this route for a campaign that's partially sent: anyone
    // already recorded as 'sent' for this campaign is skipped, never
    // messaged a second time.
    //
    // Fails closed like the rate-limit check below: a query error here
    // must not silently fall back to "nobody's been sent yet" -- that
    // would defeat the whole point of this safety net the one time it
    // would actually matter (a DB hiccup during a resumed/retried send).
    const { data: alreadySent, error: alreadySentError } = await supabase
      .from('whatsapp_sends')
      .select('contact_id')
      .eq('campaign_id', id)
      .eq('status', 'sent');

    if (alreadySentError) {
      return NextResponse.json(
        { error: 'Failed to verify which recipients already received this campaign. Nothing was sent.' },
        { status: 500 }
      );
    }

    const alreadySentContactIds = new Set(((alreadySent as any[]) ?? []).map((r) => r.contact_id));
    recipients = recipients.filter((r) => !alreadySentContactIds.has(r.id));

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'Every matching recipient has already been sent this campaign' }, { status: 400 });
    }

    const rateLimit = await checkRateLimit({
      businessId: (campaign as any).business_id,
      incrementBy: recipients.length,
      ...CAMPAIGN_RATE_LIMIT,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.error || 'This business has reached its WhatsApp campaign sending limit for this hour. Try again later.' },
        { status: 429 }
      );
    }

    // Two "Send" calls for the same draft campaign can both reach this
    // point having each read status === 'draft' above, before either
    // writes -- without a precondition on that write, both would go on
    // to message every recipient a second time. Requiring the row to
    // still be 'draft' at the moment of claiming it means only one call
    // can win; the loser gets a clean conflict and never sends anything.
    const { data: claimed, error: claimError } = await (supabase as any)
      .from('whatsapp_campaigns')
      .update({ status: 'sending' })
      .eq('id', id)
      .eq('status', 'draft')
      .select()
      .single();

    if (claimError) {
      // PGRST116 ("no rows returned") is exactly what a failed claim
      // looks like -- the WHERE status = 'draft' matched nothing because
      // another request already won it. Anything else is a genuine
      // database error, not a conflict, and must not be reported (or
      // treated) as one -- no messages have been sent either way.
      if (claimError.code === 'PGRST116') {
        return NextResponse.json({ error: 'This campaign has already been sent' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to start sending this campaign. Nothing was sent.' }, { status: 500 });
    }
    if (!claimed) {
      return NextResponse.json({ error: 'This campaign has already been sent' }, { status: 409 });
    }

    let sent = 0;
    let failed = 0;

    for (const contact of recipients) {
      try {
        const result = await sendWhatsAppMessage({ to: contact.phone, body: (campaign as any).message });

        await (supabase as any).from('whatsapp_sends').insert({
          campaign_id: id,
          business_id: (campaign as any).business_id,
          contact_id: contact.id,
          phone: contact.phone,
          status: result.error ? 'failed' : 'sent',
          twilio_message_sid: result.sid,
          error_message: result.error,
          sent_by: user.id,
          sent_at: result.error ? null : new Date().toISOString(),
        });

        if (result.error) failed++;
        else sent++;
      } catch (err) {
        failed++;
        await (supabase as any).from('whatsapp_sends').insert({
          campaign_id: id,
          business_id: (campaign as any).business_id,
          contact_id: contact.id,
          phone: contact.phone,
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Send failed',
          sent_by: user.id,
        });
      }
    }

    await (supabase as any)
      .from('whatsapp_campaigns')
      .update({
        status: failed === recipients.length ? 'failed' : 'sent',
        sent_at: new Date().toISOString(),
        recipient_count: recipients.length,
      })
      .eq('id', id);

    return NextResponse.json({ success: true, data: { sent, failed, total: recipients.length } }, { status: 200 });
  } catch (error) {
    console.error('Error sending WhatsApp campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
