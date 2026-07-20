/**
 * OGMJ BRANDS — Platform Admin Service (client)
 */

import type { APIResponse } from "../types";
import { createClient } from "../supabase/client";

export interface PlatformAdminStatus {
  hasAnyAdmin: boolean;
  isCurrentUserAdmin: boolean;
}

export async function getPlatformAdminStatus(): Promise<PlatformAdminStatus> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_platform_admin_status");
  if (error || !data) return { hasAnyAdmin: false, isCurrentUserAdmin: false };
  return data as PlatformAdminStatus;
}

export async function claimFirstPlatformAdmin(): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("claim_first_platform_admin");
  if (error) return { success: false, error: error.message };
  return data as { success: boolean; error?: string };
}

export interface AdminPayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "paid" | "rejected";
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  notes: string | null;
  created_at: string;
  processed_at: string | null;
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

export async function listAllPayoutRequests(): Promise<APIResponse<AdminPayoutRequest[]>> {
  try {
    const response = await fetch("/api/admin/payouts");
    return parseResponse(response, "LIST_ADMIN_PAYOUTS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load payout requests";
    return { success: false, error: { code: "LIST_ADMIN_PAYOUTS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function updatePayoutRequestStatus(
  id: string,
  status: "processing" | "paid" | "rejected",
  notes?: string
): Promise<APIResponse<AdminPayoutRequest>> {
  try {
    const response = await fetch(`/api/admin/payouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    return parseResponse(response, "UPDATE_PAYOUT_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update payout";
    return { success: false, error: { code: "UPDATE_PAYOUT_ERROR", message }, timestamp: new Date().toISOString() };
  }
}
