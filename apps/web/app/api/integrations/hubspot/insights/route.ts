import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUserServer as getCurrentUser } from "@/lib/auth.server";
import { AI_MODEL, buildSystemPrompt, getAnthropicClient, isAIConfigured } from "@/lib/ai/anthropic";

const INSIGHTS_INSTRUCTIONS = `You're reviewing a business's HubSpot-synced CRM data (mirrored from HubSpot into OGMJ's own CRM). Produce:

1. A 2-3 sentence executive summary of relationship health.
2. 3-5 specific, prioritized recommended actions (name real contacts/deals from the data where relevant — never invent ones not in the data).
3. Flag anything that looks stale or at risk (deals with no movement, no recent contact activity).

Be concrete and decisive. No filler, no generic CRM advice — ground everything in the numbers given.`;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: "AI is not configured", hint: "ANTHROPIC_API_KEY is not set on this deployment." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const businessId: string | undefined = body?.businessId;
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

    const { data: integration } = await supabase
      .from("integrations")
      .select("id")
      .eq("business_id", businessId)
      .eq("provider", "hubspot")
      .eq("is_active", true)
      .maybeSingle();

    if (!integration) {
      return NextResponse.json({ error: "HubSpot is not connected for this business" }, { status: 404 });
    }

    const { data: contactLinks } = await supabase
      .from("integration_object_links")
      .select("ogmj_id")
      .eq("integration_id", (integration as any).id)
      .eq("object_type", "contact");

    const { data: dealLinks } = await supabase
      .from("integration_object_links")
      .select("ogmj_id")
      .eq("integration_id", (integration as any).id)
      .eq("object_type", "deal");

    const contactIds = (contactLinks ?? []).map((l: any) => l.ogmj_id);
    const dealIds = (dealLinks ?? []).map((l: any) => l.ogmj_id);

    const [{ data: contacts }, { data: deals }] = await Promise.all([
      contactIds.length
        ? supabase.from("contacts").select("first_name, last_name, email, company_name, lifecycle_stage, last_contact_at").in("id", contactIds)
        : Promise.resolve({ data: [] as any[] }),
      dealIds.length
        ? supabase.from("deals").select("title, value, currency, stage, updated_at").in("id", dealIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const dealList = (deals as any[]) ?? [];
    const contactList = (contacts as any[]) ?? [];

    if (contactList.length === 0 && dealList.length === 0) {
      return NextResponse.json(
        { error: "No synced HubSpot data yet — run a sync first from the Integrations page." },
        { status: 400 }
      );
    }

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const staleDeals = dealList.filter((d) => d.updated_at && new Date(d.updated_at).getTime() < thirtyDaysAgo);
    const totalDealValue = dealList.reduce((sum, d) => sum + Number(d.value || 0), 0);
    const topDeals = [...dealList].sort((a, b) => Number(b.value || 0) - Number(a.value || 0)).slice(0, 5);

    const context = {
      totalContacts: contactList.length,
      totalDeals: dealList.length,
      totalDealValue,
      dealsByStage: dealList.reduce((acc: Record<string, number>, d) => {
        acc[d.stage || "unknown"] = (acc[d.stage || "unknown"] || 0) + 1;
        return acc;
      }, {}),
      staleDeals: staleDeals.map((d) => ({ title: d.title, value: d.value, stage: d.stage, lastUpdated: d.updated_at })),
      topDeals: topDeals.map((d) => ({ title: d.title, value: d.value, stage: d.stage })),
      recentContacts: contactList.slice(0, 15).map((c) => ({
        name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email,
        company: c.company_name,
        lifecycleStage: c.lifecycle_stage,
        lastContact: c.last_contact_at,
      })),
    };

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 2_000,
      system: buildSystemPrompt("ceo"),
      messages: [
        {
          role: "user",
          content: `${INSIGHTS_INSTRUCTIONS}\n\nData:\n${JSON.stringify(context, null, 2)}`,
        },
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return NextResponse.json({ success: true, data: { text, generatedAt: new Date().toISOString() } }, { status: 200 });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: "AI request failed" }, { status: 502 });
    }
    console.error("HubSpot insights error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
