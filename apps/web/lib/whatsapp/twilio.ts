/**
 * OGMJ BRANDS — Twilio WhatsApp Client (server-only)
 *
 * Uses Twilio's REST API directly over fetch (no SDK dependency) — a
 * single POST per message is all this needs.
 */

export function isTwilioConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);
}

export interface TwilioSendResult {
  sid: string | null;
  error: string | null;
}

export async function sendWhatsAppMessage(to: string, body: string): Promise<TwilioSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
  const authToken = process.env.TWILIO_AUTH_TOKEN as string;
  const from = process.env.TWILIO_WHATSAPP_FROM as string;

  const toAddress = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const fromAddress = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;

  const params = new URLSearchParams({ To: toAddress, From: fromAddress, Body: body });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
    },
    body: params.toString(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { sid: null, error: data?.message || `Twilio request failed (${response.status})` };
  }

  return { sid: data?.sid ?? null, error: null };
}
