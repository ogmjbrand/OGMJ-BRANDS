import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { isTwilioConfigured, isTwilioSendingEnabled, sendWhatsAppMessage } from '@/lib/whatsapp/twilio';
import { checkRateLimit } from '@/lib/utils/rate-limit';

// WhatsApp's own message body limit via Twilio is 1600 characters.
const MAX_BODY_LENGTH = 1600;
const E164_REGEX = /^\+[1-9]\d{6,14}$/;
const CONTENT_SID_REGEX = /^HX[0-9a-f]{32}$/i;

// A single ad-hoc send is a manual, one-at-a-time staff action (unlike
// the bulk campaign sender), but it still costs money and can reach a
// real person — cap it generously but finitely per business per hour.
const RATE_LIMIT = { endpoint: 'whatsapp:send', limit: 20, windowMinutes: 60 };

/**
 * Sends a single WhatsApp message. Authenticated, business-scoped.
 *
 * This endpoint never accepts a Twilio URL, account SID, or any
 * credential from the request body — the server's own configured
 * sender number and client are always used, never anything client-
 * supplied.
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const { businessId, to, contactId, message, contentSid, contentVariables, confirmConsent } = body ?? {};

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }
    if (!to && !contactId) {
      return NextResponse.json({ error: 'Either "to" (a phone number) or "contactId" is required' }, { status: 400 });
    }
    if (to && contactId) {
      return NextResponse.json({ error: 'Provide either "to" or "contactId", not both' }, { status: 400 });
    }
    if (!message && !contentSid) {
      return NextResponse.json({ error: 'Either "message" or "contentSid" is required' }, { status: 400 });
    }
    if (message && contentSid) {
      return NextResponse.json({ error: 'Provide either "message" or "contentSid", not both' }, { status: 400 });
    }
    if (message && (typeof message !== 'string' || message.length === 0 || message.length > MAX_BODY_LENGTH)) {
      return NextResponse.json({ error: `"message" must be between 1 and ${MAX_BODY_LENGTH} characters` }, { status: 400 });
    }
    if (contentSid && !CONTENT_SID_REGEX.test(contentSid)) {
      return NextResponse.json({ error: 'Invalid contentSid format (expected Twilio Content Template SID, e.g. HX...)' }, { status: 400 });
    }
    if (contentVariables && typeof contentVariables !== 'object') {
      return NextResponse.json({ error: 'contentVariables must be an object of string values' }, { status: 400 });
    }
    // Sending a real WhatsApp message to a real person requires an
    // explicit, affirmative signal that this business has consent to
    // message them — this is never assumed, and the UI must set this
    // only after a human confirms it.
    if (confirmConsent !== true) {
      return NextResponse.json(
        { error: 'confirmConsent must be true — confirm you have consent to message this recipient before sending' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const { data: membership } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let recipientPhone: string;
    let resolvedContactId: string | null = null;

    if (contactId) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, phone')
        .eq('id', contactId)
        .eq('business_id', businessId)
        .single();

      if (!contact || !(contact as any).phone) {
        return NextResponse.json({ error: 'Contact not found or has no phone number on file' }, { status: 404 });
      }
      recipientPhone = (contact as any).phone;
      resolvedContactId = (contact as any).id;
    } else {
      if (typeof to !== 'string' || !E164_REGEX.test(to)) {
        return NextResponse.json({ error: 'Invalid "to" — must be E.164 format, e.g. +2348012345678' }, { status: 400 });
      }
      recipientPhone = to;
    }

    const rateLimit = await checkRateLimit({ businessId, ...RATE_LIMIT });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.error || 'Rate limit exceeded for WhatsApp sends — try again later' },
        { status: 429 }
      );
    }

    const result = await sendWhatsAppMessage({
      to: recipientPhone,
      body: message,
      contentSid,
      contentVariables,
    });

    const { error: dbError } = await (supabase as any).from('whatsapp_sends').insert({
      campaign_id: null,
      business_id: businessId,
      contact_id: resolvedContactId,
      phone: recipientPhone,
      status: result.error ? 'failed' : 'sent',
      twilio_message_sid: result.sid,
      error_message: result.error,
      content_sid: contentSid ?? null,
      content_variables: contentVariables ?? null,
      sent_by: user.id,
      sent_at: result.error ? null : new Date().toISOString(),
    });

    if (dbError) {
      // Never log message content — only that recording failed.
      console.error('WhatsApp send succeeded/failed but recording it to whatsapp_sends errored:', dbError.message);
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    // Twilio accepted the request for delivery — this is NOT delivery
    // confirmation. Real delivery status requires a status callback
    // webhook, which this integration does not implement yet.
    return NextResponse.json(
      {
        success: true,
        data: { sid: result.sid, status: result.status, note: 'Message submitted to Twilio — this is not delivery confirmation.' },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending WhatsApp message:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
