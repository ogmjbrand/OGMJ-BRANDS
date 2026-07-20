/**
 * OGMJ BRANDS — Partner/Affiliate Hub Service (client)
 */

import type { APIResponse } from "../types";

export interface ReferralProgram {
  id: string;
  name: string;
  description: string | null;
  commission_type: "percentage" | "fixed";
  commission_value: number;
  cookie_days: number;
  min_payout: number;
  payout_currency: string;
}

export interface Referral {
  id: string;
  code: string;
  link: string;
  clicks: number;
  signups: number;
  conversions: number;
  total_earned: number;
  status: string;
  created_at: string;
}

export interface Commission {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "paid" | "cancelled";
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "paid" | "rejected";
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  created_at: string;
  processed_at: string | null;
}

export interface PartnerStatus {
  enrolled: boolean;
  program: ReferralProgram | null;
  referral: Referral | null;
  commissions: Commission[];
  payouts: PayoutRequest[];
  availableBalance: number;
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

export async function getPartnerStatus(): Promise<APIResponse<PartnerStatus>> {
  try {
    const response = await fetch("/api/partner");
    return parseResponse(response, "GET_PARTNER_STATUS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load partner status";
    return { success: false, error: { code: "GET_PARTNER_STATUS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function joinPartnerProgram(): Promise<APIResponse<{ id: string; code: string }>> {
  try {
    const response = await fetch("/api/partner/join", { method: "POST" });
    return parseResponse(response, "JOIN_PARTNER_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to join partner program";
    return { success: false, error: { code: "JOIN_PARTNER_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function requestPayout(input: {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}): Promise<APIResponse<PayoutRequest>> {
  try {
    const response = await fetch("/api/partner/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "REQUEST_PAYOUT_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to request payout";
    return { success: false, error: { code: "REQUEST_PAYOUT_ERROR", message }, timestamp: new Date().toISOString() };
  }
}
