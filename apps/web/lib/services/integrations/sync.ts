/**
 * OGMJ BRANDS — HubSpot Two-Way Sync
 *
 * Phase 1 scope: Contacts and Deals only. Each synced OGMJ record is linked
 * to its HubSpot counterpart via integration_object_links so repeat syncs
 * update in place instead of duplicating. Deal *stage* is intentionally not
 * synced two-way yet — HubSpot's dealstage IDs and OGMJ's pipeline_stages
 * are different taxonomies with no default mapping.
 *
 * Phase 2: field mappings are now data-driven (integration.config.
 * fieldMappings, editable from the Integrations UI) instead of hardcoded,
 * and single-record upsert/unlink helpers are exported so the webhook
 * handler can process one HubSpot event without re-running a full sync.
 */

import { createServerClient } from "@/lib/supabase/server";
import {
  createHubSpotObject,
  getHubSpotObject,
  listHubSpotObjects,
  refreshHubSpotToken,
  updateHubSpotObject,
  type HubSpotObject,
} from "./hubspot-client";
import { decryptSecret, encryptSecret } from "./crypto";

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

export type SyncObjectType = "contact" | "deal";

export interface IntegrationRow {
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

export type FieldMapping = Record<string, string>;

const DEFAULT_FIELD_MAPPINGS: Record<SyncObjectType, FieldMapping> = {
  contact: {
    email: "email",
    first_name: "firstname",
    last_name: "lastname",
    phone: "phone",
    company_name: "company",
    job_title: "jobtitle",
    website: "website",
  },
  deal: {
    title: "dealname",
    value: "amount",
    close_date: "closedate",
    description: "description",
  },
};

const HUBSPOT_OBJECT_TYPE: Record<SyncObjectType, "contacts" | "deals"> = {
  contact: "contacts",
  deal: "deals",
};

export function getFieldMapping(integration: Pick<IntegrationRow, "config">, objectType: SyncObjectType): FieldMapping {
  const override = integration.config?.fieldMappings?.[objectType];
  return { ...DEFAULT_FIELD_MAPPINGS[objectType], ...(override || {}) };
}

export function getHubSpotProperties(mapping: FieldMapping): string[] {
  return Object.values(mapping);
}

function ogmjToHubSpotProps(record: Record<string, any>, mapping: FieldMapping) {
  const props: Record<string, string | number | undefined> = {};
  for (const [ogmjField, hubspotProp] of Object.entries(mapping)) {
    let value = record[ogmjField];
    if (ogmjField === "value" && value != null) value = String(value);
    props[hubspotProp] = value ?? undefined;
  }
  return props;
}

function hubspotToOgmjFields(props: Record<string, string | null>, mapping: FieldMapping) {
  const fields: Record<string, any> = {};
  for (const [ogmjField, hubspotProp] of Object.entries(mapping)) {
    fields[ogmjField] = props[hubspotProp] ?? null;
  }
  return fields;
}

export async function getValidAccessToken(supabase: SupabaseClient, integration: IntegrationRow): Promise<string> {
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
  integration: Pick<IntegrationRow, "id" | "business_id">,
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

// ── Single-record upsert (used by both the pull loop and the webhook) ─────

export async function upsertContactFromHubSpot(
  supabase: SupabaseClient,
  integration: IntegrationRow,
  hubspotObject: HubSpotObject
): Promise<{ ogmjId: string; created: boolean }> {
  const mapping = getFieldMapping(integration, "contact");
  const link = await getLink(supabase, integration.id, "contact", { externalId: hubspotObject.id });
  const fields = hubspotToOgmjFields(hubspotObject.properties, mapping);
  if (!fields.first_name) {
    fields.first_name = fields.email ? String(fields.email).split("@")[0] : "Unknown";
  }

  if (link) {
    await (supabase as any)
      .from("contacts")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", link.ogmj_id)
      .eq("business_id", integration.business_id);
    return { ogmjId: link.ogmj_id, created: false };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", integration.business_id)
    .single();
  const ownerId = (business as any)?.owner_id;

  const { data: created, error } = await (supabase as any)
    .from("contacts")
    .insert({ ...fields, business_id: integration.business_id, owner_id: ownerId, created_by: ownerId, source: "hubspot" })
    .select("id")
    .single();
  if (error) throw error;

  await (supabase as any).from("integration_object_links").insert({
    business_id: integration.business_id,
    integration_id: integration.id,
    object_type: "contact",
    ogmj_id: created.id,
    external_id: hubspotObject.id,
    last_synced_at: new Date().toISOString(),
  });

  return { ogmjId: created.id, created: true };
}

export async function upsertDealFromHubSpot(
  supabase: SupabaseClient,
  integration: IntegrationRow,
  hubspotObject: HubSpotObject
): Promise<{ ogmjId: string; created: boolean } | null> {
  const mapping = getFieldMapping(integration, "deal");
  const link = await getLink(supabase, integration.id, "deal", { externalId: hubspotObject.id });
  const fields = hubspotToOgmjFields(hubspotObject.properties, mapping);
  if (!fields.title) fields.title = "Untitled deal";
  if (fields.value != null) fields.value = Number(fields.value);

  if (link) {
    await (supabase as any)
      .from("deals")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", link.ogmj_id)
      .eq("business_id", integration.business_id);
    return { ogmjId: link.ogmj_id, created: false };
  }

  const { data: pipeline } = await supabase
    .from("pipelines")
    .select("id")
    .eq("business_id", integration.business_id)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();
  const pipelineId = (pipeline as any)?.id;
  if (!pipelineId) return null;

  const { data: firstStage } = await supabase
    .from("pipeline_stages")
    .select("id, name")
    .eq("pipeline_id", pipelineId)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!firstStage) return null;

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
    external_id: hubspotObject.id,
    last_synced_at: new Date().toISOString(),
  });

  return { ogmjId: created.id, created: true };
}

// A HubSpot-side deletion only removes the id link, never the OGMJ record —
// OGMJ's own CRM data is never destroyed by an external signal.
export async function unlinkHubSpotObject(
  supabase: SupabaseClient,
  integration: Pick<IntegrationRow, "id">,
  objectType: SyncObjectType,
  externalId: string
) {
  await supabase
    .from("integration_object_links")
    .delete()
    .eq("integration_id", integration.id)
    .eq("object_type", objectType)
    .eq("external_id", externalId);
}

// ── Full pull/push sync (manual "Sync now" + future scheduled runs) ───────

async function pullContacts(supabase: SupabaseClient, integration: IntegrationRow, accessToken: string) {
  const mapping = getFieldMapping(integration, "contact");
  let synced = 0;
  let failed = 0;
  let after: string | undefined;

  do {
    const { results, nextAfter } = await listHubSpotObjects(accessToken, "contacts", getHubSpotProperties(mapping), after);
    after = nextAfter;

    for (const obj of results) {
      try {
        await upsertContactFromHubSpot(supabase, integration, obj);
        synced++;
      } catch {
        failed++;
      }
    }
  } while (after);

  return { synced, failed };
}

async function pushContacts(supabase: SupabaseClient, integration: IntegrationRow, accessToken: string) {
  const mapping = getFieldMapping(integration, "contact");
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
      const props = ogmjToHubSpotProps(contact, mapping);

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

async function pullDeals(supabase: SupabaseClient, integration: IntegrationRow, accessToken: string) {
  const mapping = getFieldMapping(integration, "deal");
  let synced = 0;
  let failed = 0;
  let after: string | undefined;

  do {
    const { results, nextAfter } = await listHubSpotObjects(accessToken, "deals", getHubSpotProperties(mapping), after);
    after = nextAfter;

    for (const obj of results) {
      try {
        const result = await upsertDealFromHubSpot(supabase, integration, obj);
        if (result) synced++;
        else failed++;
      } catch {
        failed++;
      }
    }
  } while (after);

  return { synced, failed };
}

async function pushDeals(supabase: SupabaseClient, integration: IntegrationRow, accessToken: string) {
  const mapping = getFieldMapping(integration, "deal");
  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .eq("business_id", integration.business_id);

  let synced = 0;
  let failed = 0;

  for (const deal of (deals as any[]) || []) {
    try {
      const link = await getLink(supabase, integration.id, "deal", { ogmjId: deal.id });
      const props = ogmjToHubSpotProps(deal, mapping);

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

// ── Webhook-driven incremental sync (one record, not a full pull) ─────────

export async function syncOneFromWebhook(
  supabase: SupabaseClient,
  integration: IntegrationRow,
  objectType: SyncObjectType,
  externalId: string
): Promise<{ synced: number; failed: number }> {
  const accessToken = await getValidAccessToken(supabase, integration);
  const mapping = getFieldMapping(integration, objectType);

  try {
    const obj = await getHubSpotObject(accessToken, HUBSPOT_OBJECT_TYPE[objectType], externalId, getHubSpotProperties(mapping));

    if (!obj) {
      await unlinkHubSpotObject(supabase, integration, objectType, externalId);
      await logSync(supabase, integration, objectType, "inbound", { synced: 0, failed: 0 });
      return { synced: 0, failed: 0 };
    }

    const result = objectType === "contact"
      ? await upsertContactFromHubSpot(supabase, integration, obj)
      : await upsertDealFromHubSpot(supabase, integration, obj);

    await logSync(supabase, integration, objectType, "inbound", { synced: result ? 1 : 0, failed: result ? 0 : 1 });
    return { synced: result ? 1 : 0, failed: result ? 0 : 1 };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook sync failed";
    await logSync(supabase, integration, objectType, "inbound", { synced: 0, failed: 1, error: message });
    return { synced: 0, failed: 1 };
  }
}
