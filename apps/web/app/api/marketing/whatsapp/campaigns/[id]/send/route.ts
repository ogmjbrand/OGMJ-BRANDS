import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { isTwilioConfigured, sendWhatsAppMessage } from '@/lib/whatsapp/twilio';

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
          hint: 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM are not set on this deployment.',
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

    const recipients = (contacts as any[]) ?? [];
    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No matching recipients with a phone number' }, { status: 400 });
    }

    await (supabase as any).from('whatsapp_campaigns').update({ status: 'sending' }).eq('id', id);

    let sent = 0;
    let failed = 0;

    for (const contact of recipients) {
      try {
        const result = await sendWhatsAppMessage(contact.phone, (campaign as any).message);

        await (supabase as any).from('whatsapp_sends').insert({
          campaign_id: id,
          business_id: (campaign as any).business_id,
          contact_id: contact.id,
          phone: contact.phone,
          status: result.error ? 'failed' : 'sent',
          twilio_message_sid: result.sid,
          error_message: result.error,
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
