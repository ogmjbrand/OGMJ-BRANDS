/**
 * OGMJ BRANDS — Integrations Service (client)
 * Talks to /api/integrations/* on behalf of the Integration Marketplace UI.
 */

import type { APIResponse } from "../types";

export interface IntegrationRecord {
  id: string;
  type: string;
  provider: string;
  name: string;
  config: Record<string, any>;
  isActive: boolean;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface IntegrationSyncLog {
  id: string;
  integration_id: string;
  object_type: string;
  direction: "inbound" | "outbound";
  status: "success" | "partial" | "failed" | "pending";
  records_synced: number;
  records_failed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface SyncRunResult {
  objectType: string;
  pulled: number;
  pushed: number;
  failed: number;
  errors: string[];
}

async function parseResponse<T>(response: Response, fallbackCode: string): Promise<APIResponse<T>> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      error: { code: fallbackCode, message: body?.error || "Request failed" },
      timestamp: new Date().toISOString(),
    };
  }
  return { success: true, data: body.data, timestamp: new Date().toISOString() };
}

export async function listIntegrations(
  businessId: string
): Promise<APIResponse<{ integrations: IntegrationRecord[]; syncLogs: IntegrationSyncLog[] }>> {
  try {
    const response = await fetch(`/api/integrations?businessId=${encodeURIComponent(businessId)}`);
    return parseResponse(response, "LIST_INTEGRATIONS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load integrations";
    return { success: false, error: { code: "LIST_INTEGRATIONS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export function getHubSpotConnectUrl(businessId: string): string {
  return `/api/integrations/hubspot/connect?businessId=${encodeURIComponent(businessId)}`;
}

export async function disconnectHubSpot(businessId: string): Promise<APIResponse<null>> {
  try {
    const response = await fetch("/api/integrations/hubspot/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    });
    return parseResponse(response, "DISCONNECT_HUBSPOT_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to disconnect HubSpot";
    return { success: false, error: { code: "DISCONNECT_HUBSPOT_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function syncHubSpotNow(businessId: string): Promise<APIResponse<SyncRunResult[]>> {
  try {
    const response = await fetch("/api/integrations/hubspot/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    });
    return parseResponse(response, "SYNC_HUBSPOT_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync HubSpot";
    return { success: false, error: { code: "SYNC_HUBSPOT_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function updateHubSpotSettings(
  businessId: string,
  input: { syncFrequency?: string; conflictResolution?: string; enabledObjects?: string[] }
): Promise<APIResponse<{ id: string; config: Record<string, any> }>> {
  try {
    const response = await fetch("/api/integrations/hubspot/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, ...input }),
    });
    return parseResponse(response, "UPDATE_HUBSPOT_SETTINGS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update HubSpot settings";
    return { success: false, error: { code: "UPDATE_HUBSPOT_SETTINGS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}
