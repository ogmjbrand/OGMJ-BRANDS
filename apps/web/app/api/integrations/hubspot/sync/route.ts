import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUserServer as getCurrentUser } from "@/lib/auth.server";
import { runHubSpotSync, type SyncObjectType } from "@/lib/services/integrations/sync";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const businessId: string | undefined = body?.businessId;
    const objectTypes: SyncObjectType[] = body?.objectTypes || ["contact", "deal"];

    if (!businessId) {
      return NextResponse.json({ error: "Business ID required" }, { status: 400 });
    }

    const supabase = await createServerClient();

    const { data: membership } = await supabase
      .from("business_users")
      .select("role")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: integration, error: integrationError } = await supabase
      .from("integrations")
      .select("*")
      .eq("business_id", businessId)
      .eq("provider", "hubspot")
      .eq("is_active", true)
      .maybeSingle();

    if (integrationError) throw integrationError;
    if (!integration) {
      return NextResponse.json({ error: "HubSpot is not connected for this business" }, { status: 404 });
    }

    try {
      const results = await runHubSpotSync(supabase, integration as any, objectTypes);
      return NextResponse.json({ success: true, data: results }, { status: 200 });
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : "Sync failed";
      await (supabase as any)
        .from("integrations")
        .update({ error_message: message })
        .eq("id", (integration as any).id);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync HubSpot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
