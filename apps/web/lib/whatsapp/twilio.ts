/**
 * OGMJ BRANDS — Twilio WhatsApp Client (server-only)
 *
 * Uses the official Twilio SDK, authenticated via an API Key (TWILIO_
 * API_KEY_SID/SECRET), not the primary Auth Token — TWILIO_AUTH_TOKEN
 * is not configured on this deployment; an API Key is Twilio's scoped,
 * independently-revocable alternative and what's actually set up here.
 *
 * Sending is gated behind two independent checks: isTwilioConfigured()
 * (are credentials present) and isTwilioSendingEnabled() (has sending
 * been explicitly turned on). Credentials being present does not mean
 * sending should happen — TWILIO_WHATSAPP_ENABLED must be the literal
 * string "true", which is not set by default. This keeps the
 * integration in a safe, inert "configured but not yet live" state
 * until someone deliberately flips it on after verifying the sandbox
 * setup (joined number, approved template, etc.).
 */

import Twilio from 'twilio';

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_API_KEY_SID &&
    process.env.TWILIO_API_KEY_SECRET &&
    process.env.TWILIO_WHATSAPP_FROM
  );
}

export function isTwilioSendingEnabled(): boolean {
  return process.env.TWILIO_WHATSAPP_ENABLED === 'true';
}

let cachedClient: ReturnType<typeof Twilio> | null = null;

function getClient(): ReturnType<typeof Twilio> {
  if (!cachedClient) {
    cachedClient = Twilio(process.env.TWILIO_API_KEY_SID as string, process.env.TWILIO_API_KEY_SECRET as string, {
      accountSid: process.env.TWILIO_ACCOUNT_SID as string,
    });
  }
  return cachedClient;
}

function toWhatsAppAddress(value: string): string {
  return value.startsWith('whatsapp:') ? value : `whatsapp:${value}`;
}

export interface SendWhatsAppInput {
  /** E.164 phone number, e.g. +2348012345678 */
  to: string;
  /** Free-form body — only deliverable within an open 24h session (e.g. sandbox-joined numbers), or to reply to an inbound message. */
  body?: string;
  /** Approved Content Template SID (HXxxxxxxxx…) — required to message outside an open session. */
  contentSid?: string;
  contentVariables?: Record<string, string>;
}

export interface TwilioSendResult {
  sid: string | null;
  /** Twilio's own status for the send attempt (e.g. "queued", "accepted") — this is NOT delivery confirmation. */
  status: string | null;
  error: string | null;
}

/**
 * Submits a WhatsApp message via Twilio. A successful result means
 * Twilio accepted the request for delivery — it does NOT mean the
 * message was delivered or even sent yet. Twilio's own `status` field
 * reflects this (e.g. "queued"/"accepted"), and real delivery status
 * only arrives later via Twilio's status callback webhook, which this
 * integration does not yet implement. Never represent this result to a
 * user as "delivered".
 */
export async function sendWhatsAppMessage(input: SendWhatsAppInput): Promise<TwilioSendResult> {
  if (!isTwilioConfigured()) {
    return { sid: null, status: null, error: 'WhatsApp is not configured on this deployment' };
  }
  if (!isTwilioSendingEnabled()) {
    return {
      sid: null,
      status: null,
      error: 'WhatsApp sending has not been enabled on this deployment yet (set TWILIO_WHATSAPP_ENABLED=true once the sandbox/number is verified)',
    };
  }
  if (!input.body && !input.contentSid) {
    return { sid: null, status: null, error: 'Either a message body or a contentSid is required' };
  }

  try {
    const message = await getClient().messages.create({
      to: toWhatsAppAddress(input.to),
      from: toWhatsAppAddress(process.env.TWILIO_WHATSAPP_FROM as string),
      ...(input.body ? { body: input.body } : {}),
      ...(input.contentSid ? { contentSid: input.contentSid } : {}),
      ...(input.contentVariables ? { contentVariables: JSON.stringify(input.contentVariables) } : {}),
    });

    return { sid: message.sid, status: message.status, error: null };
  } catch (error) {
    // Twilio's RestException exposes a short API error description
    // (e.g. "The 'To' number ... is not currently reachable") in
    // .message — never the message content itself. Still: callers of
    // this function must not log the full error object, only this
    // string, to avoid ever persisting message content.
    return {
      sid: null,
      status: null,
      error: error instanceof Error ? error.message : 'Twilio request failed',
    };
  }
}
