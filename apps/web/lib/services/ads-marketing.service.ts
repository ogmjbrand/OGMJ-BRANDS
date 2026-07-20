/**
 * OGMJ BRANDS — Advertising Service (client)
 */

import type { APIResponse } from "../types";

export const AD_PLATFORMS = [
  { value: "meta", label: "Meta (Facebook/Instagram)" },
  { value: "google", label: "Google Ads" },
  { value: "linkedin", label: "LinkedIn Ads" },
  { value: "tiktok", label: "TikTok Ads" },
] as const;

export const AD_OBJECTIVES = [
  { value: "awareness", label: "Awareness" },
  { value: "traffic", label: "Traffic" },
  { value: "leads", label: "Leads" },
  { value: "conversions", label: "Conversions" },
  { value: "engagement", label: "Engagement" },
] as const;

export interface AdCopy {
  primaryText?: string;
  headlines?: string[];
  descriptions?: string[];
  cta?: string;
}

export interface AdMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
}

export interface AdCampaign {
  id: string;
  business_id: string;
  name: string;
  platform: "meta" | "google" | "linkedin" | "tiktok";
  objective: string;
  status: "draft" | "active" | "paused" | "completed";
  budget_amount: number | null;
  budget_type: "daily" | "lifetime";
  currency: string;
  start_date: string | null;
  end_date: string | null;
  targeting: Record<string, unknown>;
  ad_copy: AdCopy;
  metrics: AdMetrics;
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

export async function listAdCampaigns(businessId: string): Promise<APIResponse<AdCampaign[]>> {
  try {
    const response = await fetch(`/api/marketing/ads/campaigns?businessId=${encodeURIComponent(businessId)}`);
    return parseResponse(response, "LIST_AD_CAMPAIGNS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load campaigns";
    return { success: false, error: { code: "LIST_AD_CAMPAIGNS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function createAdCampaign(input: {
  businessId: string;
  name: string;
  platform: string;
  objective?: string;
  budgetAmount?: number;
  budgetType?: string;
  currency?: string;
  adCopy?: AdCopy;
}): Promise<APIResponse<AdCampaign>> {
  try {
    const response = await fetch("/api/marketing/ads/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "CREATE_AD_CAMPAIGN_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create campaign";
    return { success: false, error: { code: "CREATE_AD_CAMPAIGN_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function updateAdCampaign(
  id: string,
  updates: { status?: string; metrics?: AdMetrics; budgetAmount?: number }
): Promise<APIResponse<AdCampaign>> {
  try {
    const response = await fetch(`/api/marketing/ads/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return parseResponse(response, "UPDATE_AD_CAMPAIGN_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update campaign";
    return { success: false, error: { code: "UPDATE_AD_CAMPAIGN_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function deleteAdCampaign(id: string): Promise<APIResponse<null>> {
  try {
    const response = await fetch(`/api/marketing/ads/campaigns/${id}`, { method: "DELETE" });
    return parseResponse(response, "DELETE_AD_CAMPAIGN_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete campaign";
    return { success: false, error: { code: "DELETE_AD_CAMPAIGN_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function generateAdCopy(input: {
  businessId: string;
  platform: string;
  objective?: string;
  product: string;
  audience?: string;
}): Promise<APIResponse<AdCopy>> {
  try {
    const response = await fetch("/api/marketing/ads/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "GENERATE_AD_COPY_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate ad copy";
    return { success: false, error: { code: "GENERATE_AD_COPY_ERROR", message }, timestamp: new Date().toISOString() };
  }
}
