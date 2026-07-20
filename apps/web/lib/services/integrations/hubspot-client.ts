/**
 * OGMJ BRANDS — HubSpot API Client
 *
 * Thin wrapper around HubSpot's OAuth + CRM v3 REST APIs. Every OGMJ
 * business that connects HubSpot registers its own OAuth grant against a
 * single HubSpot "public app" (HUBSPOT_CLIENT_ID/SECRET) — that app must be
 * created once in HubSpot's developer console (an external, one-time setup
 * step outside this codebase), same as any third-party OAuth integration.
 */

const HUBSPOT_AUTHORIZE_URL = "https://app.hubspot.com/oauth/authorize";
const HUBSPOT_TOKEN_URL = "https://api.hubapi.com/oauth/v1/token";
const HUBSPOT_API_BASE = "https://api.hubapi.com";

export const HUBSPOT_DEFAULT_SCOPES = [
  "crm.objects.contacts.read",
  "crm.objects.contacts.write",
  "crm.objects.companies.read",
  "crm.objects.companies.write",
  "crm.objects.deals.read",
  "crm.objects.deals.write",
  "crm.schemas.contacts.read",
  "crm.schemas.deals.read",
];

export interface HubSpotTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface HubSpotObject {
  id: string;
  properties: Record<string, string | null>;
  updatedAt?: string;
}

function getClientCredentials() {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "HubSpot is not configured: HUBSPOT_CLIENT_ID / HUBSPOT_CLIENT_SECRET are not set"
    );
  }
  return { clientId, clientSecret };
}

export function buildHubSpotAuthorizeUrl(redirectUri: string, state: string, scopes = HUBSPOT_DEFAULT_SCOPES) {
  const { clientId } = getClientCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(" "),
    state,
  });
  return `${HUBSPOT_AUTHORIZE_URL}?${params.toString()}`;
}

async function requestToken(body: Record<string, string>): Promise<HubSpotTokens> {
  const res = await fetch(HUBSPOT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot token request failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function exchangeHubSpotCode(code: string, redirectUri: string): Promise<HubSpotTokens> {
  const { clientId, clientSecret } = getClientCredentials();
  return requestToken({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });
}

export async function refreshHubSpotToken(refreshToken: string): Promise<HubSpotTokens> {
  const { clientId, clientSecret } = getClientCredentials();
  return requestToken({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });
}

export interface HubSpotTokenInfo {
  hub_id: number;
  hub_domain: string;
  user: string;
  scopes: string[];
}

export async function getHubSpotTokenInfo(accessToken: string): Promise<HubSpotTokenInfo> {
  const res = await fetch(`${HUBSPOT_API_BASE}/oauth/v1/access-tokens/${accessToken}`);
  if (!res.ok) {
    throw new Error(`Failed to read HubSpot token info (${res.status})`);
  }
  return res.json();
}

async function hubspotFetch(accessToken: string, path: string, init?: RequestInit) {
  const res = await fetch(`${HUBSPOT_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot API ${path} failed (${res.status}): ${text}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function listHubSpotObjects(
  accessToken: string,
  objectType: "contacts" | "deals",
  properties: string[],
  after?: string
): Promise<{ results: HubSpotObject[]; nextAfter?: string }> {
  const params = new URLSearchParams({
    limit: "100",
    properties: properties.join(","),
  });
  if (after) params.set("after", after);

  const data = await hubspotFetch(accessToken, `/crm/v3/objects/${objectType}?${params.toString()}`);
  return {
    results: data.results || [],
    nextAfter: data.paging?.next?.after,
  };
}

export async function createHubSpotObject(
  accessToken: string,
  objectType: "contacts" | "deals",
  properties: Record<string, string | number | undefined>
): Promise<HubSpotObject> {
  return hubspotFetch(accessToken, `/crm/v3/objects/${objectType}`, {
    method: "POST",
    body: JSON.stringify({ properties }),
  });
}

export async function updateHubSpotObject(
  accessToken: string,
  objectType: "contacts" | "deals",
  externalId: string,
  properties: Record<string, string | number | undefined>
): Promise<HubSpotObject> {
  return hubspotFetch(accessToken, `/crm/v3/objects/${objectType}/${externalId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties }),
  });
}
