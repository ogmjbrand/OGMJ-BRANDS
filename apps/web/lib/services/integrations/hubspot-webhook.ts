/**
 * HubSpot webhook signature verification (v3).
 * https://developers.hubspot.com/docs/api/webhooks/validating-requests
 *
 * HubSpot signs with the app's client secret — one shared signing key for
 * every connected portal, since a single OGMJ HubSpot app receives events
 * from all businesses that have connected it at one target URL. Each event
 * in the payload carries its own portalId, which the route handler uses to
 * resolve which business's `integrations` row it belongs to.
 */

import crypto from "crypto";

export interface HubSpotWebhookEvent {
  eventId: number;
  subscriptionId: number;
  portalId: number;
  appId: number;
  occurredAt: number;
  subscriptionType: string;
  attemptNumber: number;
  objectId: number;
  changeSource?: string;
  propertyName?: string;
}

export function verifyHubSpotWebhookSignature(
  method: string,
  requestUri: string,
  body: string,
  timestamp: string,
  signature: string | null
): boolean {
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientSecret || !signature) return false;

  // Reject stale requests (HubSpot recommends a 5 minute window) to limit
  // replay of a captured, still-validly-signed request.
  const age = Date.now() - Number(timestamp);
  if (!Number.isFinite(age) || age > 5 * 60 * 1000 || age < -60 * 1000) return false;

  const base = `${method}${requestUri}${body}${timestamp}`;
  const expected = crypto.createHmac("sha256", clientSecret).update(base).digest("base64");

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
