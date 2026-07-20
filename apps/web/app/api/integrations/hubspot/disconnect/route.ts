import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUserServer as getCurrentUser } from "@/lib/auth.server";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const businessId: string | undefined = body?.businessId;
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

    // Deletes the integration row (and, via ON DELETE CASCADE, its sync
    // logs / object links). This only removes the connection record —
    // OGMJ's own contacts/deals data is untouched.
    const { error } = await supabase
      .from("integrations")
      .delete()
      .eq("business_id", businessId)
      .eq("provider", "hubspot");

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to disconnect HubSpot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
