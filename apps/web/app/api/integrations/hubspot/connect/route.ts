import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUserServer as getCurrentUser } from "@/lib/auth.server";
import { buildHubSpotAuthorizeUrl } from "@/lib/services/integrations/hubspot-client";
import { HUBSPOT_STATE_COOKIE } from "@/lib/services/integrations/oauth-state";

function getRedirectUri(request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  return `${base.replace(/\/$/, "")}/api/integrations/hubspot/callback`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = request.nextUrl.searchParams.get("businessId");
    if (!businessId) {
      return NextResponse.json({ error: "Business ID required" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: userRole } = await supabase
      .from("business_users")
      .select("role")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!(userRole as any) || !["owner", "admin"].includes((userRole as any).role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    if (!process.env.HUBSPOT_CLIENT_ID || !process.env.HUBSPOT_CLIENT_SECRET) {
      return NextResponse.json(
        {
          error:
            "HubSpot is not configured on this deployment yet (HUBSPOT_CLIENT_ID / HUBSPOT_CLIENT_SECRET missing)",
        },
        { status: 503 }
      );
    }

    const nonce = crypto.randomBytes(16).toString("hex");
    const authorizeUrl = buildHubSpotAuthorizeUrl(getRedirectUri(request), nonce);

    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set(HUBSPOT_STATE_COOKIE, JSON.stringify({ nonce, businessId, userId: user.id }), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start HubSpot connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
