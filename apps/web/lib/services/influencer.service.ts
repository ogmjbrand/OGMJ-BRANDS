/**
 * OGMJ BRANDS — Influencer Marketing Service (client)
 */

import type { APIResponse } from "../types";

export const INFLUENCER_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X" },
  { value: "other", label: "Other" },
] as const;

export const INFLUENCER_STATUSES = ["prospecting", "contacted", "negotiating", "active", "completed", "declined"] as const;

export interface Influencer {
  id: string;
  business_id: string;
  name: string;
  handle: string | null;
  platform: "instagram" | "tiktok" | "youtube" | "x" | "other";
  followers_count: number | null;
  contact_email: string | null;
  status: (typeof INFLUENCER_STATUSES)[number];
  collab_type: "gifted" | "paid" | "affiliate";
  agreed_amount: number | null;
  currency: string;
  notes: string | null;
  created_at: string;
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

export async function listInfluencers(businessId: string): Promise<APIResponse<Influencer[]>> {
  try {
    const response = await fetch(`/api/marketing/influencers?businessId=${encodeURIComponent(businessId)}`);
    return parseResponse(response, "LIST_INFLUENCERS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load influencers";
    return { success: false, error: { code: "LIST_INFLUENCERS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function createInfluencer(input: {
  businessId: string;
  name: string;
  handle?: string;
  platform?: string;
  followersCount?: number;
  contactEmail?: string;
  collabType?: string;
  agreedAmount?: number;
}): Promise<APIResponse<Influencer>> {
  try {
    const response = await fetch("/api/marketing/influencers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "CREATE_INFLUENCER_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save influencer";
    return { success: false, error: { code: "CREATE_INFLUENCER_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function updateInfluencer(id: string, updates: { status?: string; notes?: string }): Promise<APIResponse<Influencer>> {
  try {
    const response = await fetch(`/api/marketing/influencers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return parseResponse(response, "UPDATE_INFLUENCER_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update influencer";
    return { success: false, error: { code: "UPDATE_INFLUENCER_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function deleteInfluencer(id: string): Promise<APIResponse<null>> {
  try {
    const response = await fetch(`/api/marketing/influencers/${id}`, { method: "DELETE" });
    return parseResponse(response, "DELETE_INFLUENCER_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete influencer";
    return { success: false, error: { code: "DELETE_INFLUENCER_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function generateOutreachMessage(input: {
  businessId: string;
  influencerName: string;
  platform?: string;
  collabType?: string;
}): Promise<APIResponse<{ message: string }>> {
  try {
    const response = await fetch("/api/marketing/influencers/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "GENERATE_OUTREACH_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate outreach message";
    return { success: false, error: { code: "GENERATE_OUTREACH_ERROR", message }, timestamp: new Date().toISOString() };
  }
}
