import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { getResendClient, isResendConfigured, RESEND_FROM_EMAIL } from '@/lib/email/resend';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isResendConfigured()) {
      return NextResponse.json(
        { error: 'Email sending is not configured', hint: 'RESEND_API_KEY is not set on this deployment.' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const supabase = await createServerClient();

    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
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
      .select('id, email, first_name')
      .eq('business_id', (campaign as any).business_id)
      .not('email', 'is', null);

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
      return NextResponse.json({ error: 'No matching recipients with an email address' }, { status: 400 });
    }

    await (supabase as any).from('email_campaigns').update({ status: 'sending' }).eq('id', id);

    const resend = getResendClient();
    let sent = 0;
    let failed = 0;

    for (const contact of recipients) {
      try {
        const { data: sendResult, error: sendError } = await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: contact.email,
          subject: (campaign as any).subject,
          html: (campaign as any).body.replace(/\n/g, '<br/>'),
        });

        await (supabase as any).from('email_sends').insert({
          campaign_id: id,
          business_id: (campaign as any).business_id,
          contact_id: contact.id,
          email: contact.email,
          status: sendError ? 'failed' : 'sent',
          resend_message_id: sendResult?.id ?? null,
          error_message: sendError?.message ?? null,
          sent_at: sendError ? null : new Date().toISOString(),
        });

        if (sendError) failed++;
        else sent++;
      } catch (err) {
        failed++;
        await (supabase as any).from('email_sends').insert({
          campaign_id: id,
          business_id: (campaign as any).business_id,
          contact_id: contact.id,
          email: contact.email,
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Send failed',
        });
      }
    }

    await (supabase as any)
      .from('email_campaigns')
      .update({
        status: failed === recipients.length ? 'failed' : 'sent',
        sent_at: new Date().toISOString(),
        recipient_count: recipients.length,
      })
      .eq('id', id);

    return NextResponse.json({ success: true, data: { sent, failed, total: recipients.length } }, { status: 200 });
  } catch (error) {
    console.error('Error sending email campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
