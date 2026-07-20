import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUserServer as getCurrentUser } from "@/lib/auth.server";

function transformIntegration(row: any) {
  return {
    id: row.id,
    type: row.type,
    provider: row.provider,
    name: row.name,
    config: row.config,
    isActive: row.is_active,
    lastSyncedAt: row.last_synced_at,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    // credentials are never returned to the client
  };
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

    const { data: integrations, error } = await supabase
      .from("integrations")
      .select("id, type, provider, name, config, is_active, last_synced_at, error_message, created_at")
      .eq("business_id", businessId);

    if (error) throw error;

    const { data: logs } = await supabase
      .from("integration_sync_logs")
      .select("id, integration_id, object_type, direction, status, records_synced, records_failed, error_message, started_at, completed_at")
      .eq("business_id", businessId)
      .order("started_at", { ascending: false })
      .limit(25);

    return NextResponse.json(
      {
        success: true,
        data: {
          integrations: (integrations || []).map(transformIntegration),
          syncLogs: logs || [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch integrations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
