/**
 * OGMJ BRANDS — HubSpot Two-Way Sync
 *
 * Phase 1 scope: Contacts and Deals only. Each synced OGMJ record is linked
 * to its HubSpot counterpart via integration_object_links so repeat syncs
 * update in place instead of duplicating. Deal *stage* is intentionally not
 * synced two-way yet — HubSpot's dealstage IDs and OGMJ's pipeline_stages
 * are different taxonomies with no default mapping; pulled-in deals land in
 * the business's default pipeline's first stage until a field-mapping UI
 * (phase 2) lets an admin wire the two together.
 */

import { createServerClient } from "@/lib/supabase/server";
import {
  createHubSpotObject,
  listHubSpotObjects,
  refreshHubSpotToken,
  updateHubSpotObject,
  type HubSpotObject,
} from "./hubspot-client";
import { decryptSecret, encryptSecret } from "./crypto";

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

export type SyncObjectType = "contact" | "deal";

interface IntegrationRow {
  id: string;
  business_id: string;
  config: Record<string, any>;
  credentials: { access_token: string; refresh_token: string; expires_at: string };
}

interface SyncResult {
  objectType: SyncObjectType;
  pulled: number;
  pushed: number;
  failed: number;
  errors: string[];
}

const CONTACT_PROPERTIES = ["email", "firstname", "lastname", "phone", "company", "jobtitle", "website"];
const DEAL_PROPERTIES = ["dealname", "amount", "closedate", "description"];

async function getValidAccessToken(supabase: SupabaseClient, integration: IntegrationRow): Promise<string> {
  const expiresAt = new Date(integration.credentials.expires_at).getTime();

  if (Date.now() < expiresAt - 60_000) {
    return decryptSecret(integration.credentials.access_token);
  }

  const refreshToken = decryptSecret(integration.credentials.refresh_token);
  const refreshed = await refreshHubSpotToken(refreshToken);
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  await (supabase as any)
    .from("integrations")
    .update({
      credentials: {
        access_token: encryptSecret(refreshed.access_token),
        refresh_token: encryptSecret(refreshed.refresh_token),
        expires_at: newExpiresAt,
      },
    })
    .eq("id", integration.id);

  return refreshed.access_token;
}

async function logSync(
  supabase: SupabaseClient,
  integration: IntegrationRow,
  objectType: SyncObjectType,
  direction: "inbound" | "outbound",
  result: { synced: number; failed: number; error?: string }
) {
  await (supabase as any).from("integration_sync_logs").insert({
    business_id: integration.business_id,
    integration_id: integration.id,
    object_type: objectType,
    direction,
    status: result.error ? "failed" : result.failed > 0 ? "partial" : "success",
    records_synced: result.synced,
    records_failed: result.failed,
    error_message: result.error || null,
    completed_at: new Date().toISOString(),
  });
}

async function getLink(
  supabase: SupabaseClient,
  integrationId: string,
  objectType: SyncObjectType,
  opts: { ogmjId?: string; externalId?: string }
) {
  let query = supabase
    .from("integration_object_links")
    .select("*")
    .eq("integration_id", integrationId)
    .eq("object_type", objectType);

  if (opts.ogmjId) query = query.eq("ogmj_id", opts.ogmjId);
  if (opts.externalId) query = query.eq("external_id", opts.externalId);

  const { data } = await query.maybeSingle();
  return data as any;
}

function contactToHubSpotProps(contact: any) {
  return {
    email: contact.email || undefined,
    firstname: contact.first_name || undefined,
    lastname: contact.last_name || undefined,
    phone: contact.phone || undefined,
    company: contact.company_name || contact.company || undefined,
    jobtitle: contact.job_title || undefined,
    website: contact.website || undefined,
  };
}

function hubspotPropsToContact(props: Record<string, string | null>) {
  return {
    email: props.email || null,
    first_name: props.firstname || props.email?.split("@")[0] || "Unknown",
    last_name: props.lastname || null,
    phone: props.phone || null,
    company_name: props.company || null,
    job_title: props.jobtitle || null,
    website: props.website || null,
  };
}

function dealToHubSpotProps(deal: any) {
  return {
    dealname: deal.title || undefined,
    amount: deal.value != null ? String(deal.value) : undefined,
    closedate: deal.close_date || deal.expected_close_date || undefined,
    description: deal.description || undefined,
  };
}

function hubspotPropsToDeal(props: Record<string, string | null>) {
  return {
    title: props.dealname || "Untitled deal",
    value: props.amount ? Number(props.amount) : null,
    description: props.description || null,
  };
}

async function pullContacts(
  supabase: SupabaseClient,
  integration: IntegrationRow,
  accessToken: string
): Promise<{ synced: number; failed: number }> {
  const { data: business } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", integration.business_id)
    .single();
  const ownerId = (business as any)?.owner_id;

  let synced = 0;
  let failed = 0;
  let after: string | undefined;

  do {
    const { results, nextAfter } = await listHubSpotObjects(accessToken, "contacts", CONTACT_PROPERTIES, after);
    after = nextAfter;

    for (const obj of results) {
      try {
        const link = await getLink(supabase, integration.id, "contact", { externalId: obj.id });
        const fields = hubspotPropsToContact(obj.properties);

        if (link) {
          await (supabase as any)
            .from("contacts")
            .update({ ...fields, updated_at: new Date().toISOString() })
            .eq("id", link.ogmj_id)
            .eq("business_id", integration.business_id);
        } else {
          const { data: created, error } = await (supabase as any)
            .from("contacts")
            .insert({
              ...fields,
              business_id: integration.business_id,
              owner_id: ownerId,
              created_by: ownerId,
              source: "hubspot",
            })
            .select("id")
            .single();
          if (error) throw error;

          await (supabase as any).from("integration_object_links").insert({
            business_id: integration.business_id,
            integration_id: integration.id,
            object_type: "contact",
            ogmj_id: created.id,
            external_id: obj.id,
            last_synced_at: new Date().toISOString(),
          });
        }
        synced++;
      } catch {
        failed++;
      }
    }
  } while (after);

  return { synced, failed };
}

async function pushContacts(
  supabase: SupabaseClient,
  integration: IntegrationRow,
  accessToken: string
): Promise<{ synced: number; failed: number }> {
  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("business_id", integration.business_id)
    .neq("source", "hubspot");

  let synced = 0;
  let failed = 0;

  for (const contact of (contacts as any[]) || []) {
    try {
      const link = await getLink(supabase, integration.id, "contact", { ogmjId: contact.id });
      const props = contactToHubSpotProps(contact);

      let externalId = link?.external_id;
      if (externalId) {
        await updateHubSpotObject(accessToken, "contacts", externalId, props);
      } else {
        const created: HubSpotObject = await createHubSpotObject(accessToken, "contacts", props);
        externalId = created.id;
        await (supabase as any).from("integration_object_links").insert({
          business_id: integration.business_id,
          integration_id: integration.id,
          object_type: "contact",
          ogmj_id: contact.id,
          external_id: externalId,
          last_synced_at: new Date().toISOString(),
        });
      }
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

async function pullDeals(
  supabase: SupabaseClient,
  integration: IntegrationRow,
  accessToken: string
): Promise<{ synced: number; failed: number }> {
  const { data: pipeline } = await supabase
    .from("pipelines")
    .select("id")
    .eq("business_id", integration.business_id)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();
  const pipelineId = (pipeline as any)?.id;

  const { data: firstStage } = pipelineId
    ? await supabase
        .from("pipeline_stages")
        .select("id, name")
        .eq("pipeline_id", pipelineId)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle()
    : { data: null };

  let synced = 0;
  let failed = 0;
  let after: string | undefined;

  if (!pipelineId || !firstStage) {
    return { synced: 0, failed: 0 };
  }

  do {
    const { results, nextAfter } = await listHubSpotObjects(accessToken, "deals", DEAL_PROPERTIES, after);
    after = nextAfter;

    for (const obj of results) {
      try {
        const link = await getLink(supabase, integration.id, "deal", { externalId: obj.id });
        const fields = hubspotPropsToDeal(obj.properties);

        if (link) {
          await (supabase as any)
            .from("deals")
            .update({ ...fields, updated_at: new Date().toISOString() })
            .eq("id", link.ogmj_id)
            .eq("business_id", integration.business_id);
        } else {
          const { data: created, error } = await (supabase as any)
            .from("deals")
            .insert({
              ...fields,
              business_id: integration.business_id,
              pipeline_id: pipelineId,
              stage_id: (firstStage as any).id,
              stage: (firstStage as any).name,
            })
            .select("id")
            .single();
          if (error) throw error;

          await (supabase as any).from("integration_object_links").insert({
            business_id: integration.business_id,
            integration_id: integration.id,
            object_type: "deal",
            ogmj_id: created.id,
            external_id: obj.id,
            last_synced_at: new Date().toISOString(),
          });
        }
        synced++;
      } catch {
        failed++;
      }
    }
  } while (after);

  return { synced, failed };
}

async function pushDeals(
  supabase: SupabaseClient,
  integration: IntegrationRow,
  accessToken: string
): Promise<{ synced: number; failed: number }> {
  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .eq("business_id", integration.business_id);

  let synced = 0;
  let failed = 0;

  for (const deal of (deals as any[]) || []) {
    try {
      const link = await getLink(supabase, integration.id, "deal", { ogmjId: deal.id });
      const props = dealToHubSpotProps(deal);

      let externalId = link?.external_id;
      if (externalId) {
        await updateHubSpotObject(accessToken, "deals", externalId, props);
      } else {
        const created: HubSpotObject = await createHubSpotObject(accessToken, "deals", props);
        externalId = created.id;
        await (supabase as any).from("integration_object_links").insert({
          business_id: integration.business_id,
          integration_id: integration.id,
          object_type: "deal",
          ogmj_id: deal.id,
          external_id: externalId,
          last_synced_at: new Date().toISOString(),
        });
      }
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

export async function runHubSpotSync(
  supabase: SupabaseClient,
  integration: IntegrationRow,
  objectTypes: SyncObjectType[] = ["contact", "deal"]
): Promise<SyncResult[]> {
  const accessToken = await getValidAccessToken(supabase, integration);
  const results: SyncResult[] = [];

  for (const objectType of objectTypes) {
    const errors: string[] = [];
    let pulled = { synced: 0, failed: 0 };
    let pushed = { synced: 0, failed: 0 };

    try {
      pulled = objectType === "contact" ? await pullContacts(supabase, integration, accessToken) : await pullDeals(supabase, integration, accessToken);
      await logSync(supabase, integration, objectType, "inbound", pulled);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Inbound sync failed";
      errors.push(message);
      await logSync(supabase, integration, objectType, "inbound", { synced: 0, failed: 0, error: message });
    }

    try {
      pushed = objectType === "contact" ? await pushContacts(supabase, integration, accessToken) : await pushDeals(supabase, integration, accessToken);
      await logSync(supabase, integration, objectType, "outbound", pushed);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Outbound sync failed";
      errors.push(message);
      await logSync(supabase, integration, objectType, "outbound", { synced: 0, failed: 0, error: message });
    }

    results.push({
      objectType,
      pulled: pulled.synced,
      pushed: pushed.synced,
      failed: pulled.failed + pushed.failed,
      errors,
    });
  }

  await (supabase as any)
    .from("integrations")
    .update({ last_synced_at: new Date().toISOString(), error_message: null })
    .eq("id", integration.id);

  return results;
}
