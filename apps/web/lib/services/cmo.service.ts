/**
 * OGMJ BRANDS — AI CMO Briefing Service (client)
 */

import type { APIResponse } from "../types";

export interface CMOBriefing {
  headline?: string;
  wins?: string[];
  concerns?: string[];
  priorities?: string[];
  snapshot?: Record<string, unknown>;
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

export async function generateCMOBriefing(businessId: string): Promise<APIResponse<CMOBriefing>> {
  try {
    const response = await fetch("/api/marketing/cmo/briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    });
    return parseResponse(response, "GENERATE_CMO_BRIEFING_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate briefing";
    return { success: false, error: { code: "GENERATE_CMO_BRIEFING_ERROR", message }, timestamp: new Date().toISOString() };
  }
}
