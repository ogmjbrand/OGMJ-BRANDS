/**
 * OGMJ BRANDS — Business Affiliate Program Service (client)
 *
 * Distinct from the platform's own Partner Hub (referring new businesses
 * to OGMJ BRANDS itself) — this is an affiliate program a business runs
 * for its own products.
 */

import type { APIResponse } from "../types";

export interface AffiliatePartner {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  referral_code: string;
  commission_type: "percentage" | "fixed";
  commission_value: number;
  currency: string;
  total_sales: number;
  total_commission: number;
  status: "active" | "paused";
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

export async function listAffiliates(businessId: string): Promise<APIResponse<AffiliatePartner[]>> {
  try {
    const response = await fetch(`/api/marketing/affiliates?businessId=${encodeURIComponent(businessId)}`);
    return parseResponse(response, "LIST_AFFILIATES_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load affiliates";
    return { success: false, error: { code: "LIST_AFFILIATES_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function createAffiliate(input: {
  businessId: string;
  name: string;
  email?: string;
  commissionType?: string;
  commissionValue?: number;
}): Promise<APIResponse<AffiliatePartner>> {
  try {
    const response = await fetch("/api/marketing/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "CREATE_AFFILIATE_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add affiliate";
    return { success: false, error: { code: "CREATE_AFFILIATE_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function updateAffiliate(
  id: string,
  updates: { status?: string; totalSales?: number; totalCommission?: number }
): Promise<APIResponse<AffiliatePartner>> {
  try {
    const response = await fetch(`/api/marketing/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return parseResponse(response, "UPDATE_AFFILIATE_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update affiliate";
    return { success: false, error: { code: "UPDATE_AFFILIATE_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function deleteAffiliate(id: string): Promise<APIResponse<null>> {
  try {
    const response = await fetch(`/api/marketing/affiliates/${id}`, { method: "DELETE" });
    return parseResponse(response, "DELETE_AFFILIATE_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete affiliate";
    return { success: false, error: { code: "DELETE_AFFILIATE_ERROR", message }, timestamp: new Date().toISOString() };
  }
}
