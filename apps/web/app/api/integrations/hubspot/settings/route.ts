import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUserServer as getCurrentUser } from "@/lib/auth.server";

const SYNC_FREQUENCIES = ["manual", "hourly", "daily"];
const CONFLICT_STRATEGIES = ["hubspot_wins", "ogmj_wins", "newest_wins"];

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { businessId, syncFrequency, conflictResolution, enabledObjects, fieldMappings } = body;

    if (!businessId) {
      return NextResponse.json({ error: "Business ID required" }, { status: 400 });
    }
    if (syncFrequency && !SYNC_FREQUENCIES.includes(syncFrequency)) {
      return NextResponse.json({ error: "Invalid sync frequency" }, { status: 400 });
    }
    if (conflictResolution && !CONFLICT_STRATEGIES.includes(conflictResolution)) {
      return NextResponse.json({ error: "Invalid conflict resolution strategy" }, { status: 400 });
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

    const { data: integration, error: fetchError } = await supabase
      .from("integrations")
      .select("id, config")
      .eq("business_id", businessId)
      .eq("provider", "hubspot")
      .single();

    if (fetchError || !integration) {
      return NextResponse.json({ error: "HubSpot is not connected for this business" }, { status: 404 });
    }

    const existingConfig = (integration as any).config || {};
    const nextConfig = {
      ...existingConfig,
      ...(syncFrequency ? { syncFrequency } : {}),
      ...(conflictResolution ? { conflictResolution } : {}),
      ...(enabledObjects ? { enabledObjects } : {}),
      ...(fieldMappings
        ? {
            fieldMappings: {
              ...(existingConfig.fieldMappings || {}),
              ...fieldMappings,
            },
          }
        : {}),
    };

    const { data, error } = await (supabase as any)
      .from("integrations")
      .update({ config: nextConfig })
      .eq("id", (integration as any).id)
      .select("id, config")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update HubSpot settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
