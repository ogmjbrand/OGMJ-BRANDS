/**
 * OGMJ BRANDS — Creative Studio Service (client)
 */

import type { APIResponse } from "../types";

export const CREATIVE_FORMATS = [
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "carousel", label: "Carousel" },
] as const;

export interface ShotListItem {
  beat: string;
  description: string;
  durationSeconds?: number;
}

export interface CreativeBriefContent {
  logline?: string;
  visualDirection?: string;
  shotList?: ShotListItem[];
  musicMood?: string;
  aspectRatio?: string;
}

export interface CreativeBrief {
  id: string;
  business_id: string;
  title: string;
  format: "video" | "image" | "carousel";
  platform: string | null;
  topic: string | null;
  brief: CreativeBriefContent;
  status: "draft" | "ready" | "in_production" | "complete";
  created_at: string;
  updated_at: string;
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

export async function listCreativeBriefs(businessId: string): Promise<APIResponse<CreativeBrief[]>> {
  try {
    const response = await fetch(`/api/marketing/creative/briefs?businessId=${encodeURIComponent(businessId)}`);
    return parseResponse(response, "LIST_CREATIVE_BRIEFS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load briefs";
    return { success: false, error: { code: "LIST_CREATIVE_BRIEFS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function createCreativeBrief(input: {
  businessId: string;
  title: string;
  format: string;
  platform?: string;
  topic?: string;
  brief?: CreativeBriefContent;
}): Promise<APIResponse<CreativeBrief>> {
  try {
    const response = await fetch("/api/marketing/creative/briefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "CREATE_CREATIVE_BRIEF_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save brief";
    return { success: false, error: { code: "CREATE_CREATIVE_BRIEF_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function updateCreativeBrief(id: string, updates: { status?: string }): Promise<APIResponse<CreativeBrief>> {
  try {
    const response = await fetch(`/api/marketing/creative/briefs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return parseResponse(response, "UPDATE_CREATIVE_BRIEF_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update brief";
    return { success: false, error: { code: "UPDATE_CREATIVE_BRIEF_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function deleteCreativeBrief(id: string): Promise<APIResponse<null>> {
  try {
    const response = await fetch(`/api/marketing/creative/briefs/${id}`, { method: "DELETE" });
    return parseResponse(response, "DELETE_CREATIVE_BRIEF_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete brief";
    return { success: false, error: { code: "DELETE_CREATIVE_BRIEF_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function generateCreativeBrief(input: {
  businessId: string;
  format: string;
  platform?: string;
  topic: string;
}): Promise<APIResponse<CreativeBriefContent>> {
  try {
    const response = await fetch("/api/marketing/creative/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "GENERATE_CREATIVE_BRIEF_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate brief";
    return { success: false, error: { code: "GENERATE_CREATIVE_BRIEF_ERROR", message }, timestamp: new Date().toISOString() };
  }
}
