import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUserServer as getCurrentUser } from "@/lib/auth.server";
import {
  exchangeHubSpotCode,
  getHubSpotTokenInfo,
} from "@/lib/services/integrations/hubspot-client";
import { encryptSecret } from "@/lib/services/integrations/crypto";
import { HUBSPOT_STATE_COOKIE } from "@/lib/services/integrations/oauth-state";

function getRedirectUri(request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  return `${base.replace(/\/$/, "")}/api/integrations/hubspot/callback`;
}

function redirectToIntegrations(request: NextRequest, query: Record<string, string>) {
  const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const url = new URL("/dashboard/integrations", base);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const response = NextResponse.redirect(url);
  response.cookies.delete(HUBSPOT_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const hubspotError = request.nextUrl.searchParams.get("error");
  if (hubspotError) {
    return redirectToIntegrations(request, { hubspot_error: hubspotError });
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const rawCookie = request.cookies.get(HUBSPOT_STATE_COOKIE)?.value;

  if (!code || !state || !rawCookie) {
    return redirectToIntegrations(request, { hubspot_error: "missing_state" });
  }

  let cookieState: { nonce: string; businessId: string; userId: string };
  try {
    cookieState = JSON.parse(rawCookie);
  } catch {
    return redirectToIntegrations(request, { hubspot_error: "invalid_state" });
  }

  if (cookieState.nonce !== state) {
    return redirectToIntegrations(request, { hubspot_error: "state_mismatch" });
  }

  const user = await getCurrentUser();
  if (!user || user.id !== cookieState.userId) {
    return redirectToIntegrations(request, { hubspot_error: "session_mismatch" });
  }

  try {
    const tokens = await exchangeHubSpotCode(code, getRedirectUri(request));
    const tokenInfo = await getHubSpotTokenInfo(tokens.access_token);

    const supabase = await createServerClient();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error } = await (supabase as any)
      .from("integrations")
      .upsert(
        {
          business_id: cookieState.businessId,
          type: "crm",
          provider: "hubspot",
          name: "HubSpot",
          config: {
            hubId: tokenInfo.hub_id,
            hubDomain: tokenInfo.hub_domain,
            scopes: tokenInfo.scopes,
            syncFrequency: "manual",
            conflictResolution: "newest_wins",
            enabledObjects: ["contact", "deal"],
          },
          credentials: {
            access_token: encryptSecret(tokens.access_token),
            refresh_token: encryptSecret(tokens.refresh_token),
            expires_at: expiresAt,
          },
          is_active: true,
          error_message: null,
        },
        { onConflict: "business_id,provider,type" }
      );

    if (error) throw error;

    return redirectToIntegrations(request, { connected: "hubspot" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "HubSpot connection failed";
    console.error("HubSpot OAuth callback error:", message);
    return redirectToIntegrations(request, { hubspot_error: "connection_failed" });
  }
}
