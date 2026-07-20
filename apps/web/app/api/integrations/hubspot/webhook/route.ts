import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyHubSpotWebhookSignature, type HubSpotWebhookEvent } from "@/lib/services/integrations/hubspot-webhook";
import { syncOneFromWebhook, type SyncObjectType } from "@/lib/services/integrations/sync";

// HubSpot calls this URL for every connected portal — it must be
// registered once as the app's webhook target URL in HubSpot's developer
// portal (subscribing to contact.creation/propertyChange/deletion and
// deal.creation/propertyChange/deletion), the same kind of one-time
// external setup as the OAuth app registration itself.

function parseObjectType(subscriptionType: string): SyncObjectType | null {
  const [object] = subscriptionType.split(".");
  if (object === "contact") return "contact";
  if (object === "deal") return "deal";
  return null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const signature = request.headers.get("x-hubspot-signature-v3");
  const timestamp = request.headers.get("x-hubspot-request-timestamp");

  const isValid = verifyHubSpotWebhookSignature("POST", request.url, rawBody, timestamp || "", signature);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let events: HubSpotWebhookEvent[];
  try {
    events = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = await createServerClient();
  const integrationCache = new Map<number, any>();

  for (const event of events) {
    const objectType = parseObjectType(event.subscriptionType);
    if (!objectType) continue;

    let integration = integrationCache.get(event.portalId);
    if (integration === undefined) {
      const { data } = await supabase
        .from("integrations")
        .select("*")
        .eq("provider", "hubspot")
        .eq("is_active", true)
        .contains("config", { hubId: event.portalId })
        .maybeSingle();
      integration = data ?? null;
      integrationCache.set(event.portalId, integration);
    }

    if (!integration) continue;

    try {
      // Same call for creation/propertyChange/deletion: it re-fetches the
      // object's current state from HubSpot, which naturally 404s (and
      // unlinks) for a deletion — no need to special-case the event kind.
      await syncOneFromWebhook(supabase, integration, objectType, String(event.objectId));
    } catch (error) {
      console.error("HubSpot webhook processing error:", error);
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
