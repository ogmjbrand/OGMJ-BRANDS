/**
 * OGMJ BRANDS — WhatsApp Marketing Service (client)
 */

import type { APIResponse } from "../types";

export interface WhatsAppCampaign {
  id: string;
  business_id: string;
  name: string;
  message: string;
  status: "draft" | "sending" | "sent" | "failed";
  recipient_filter: { status?: string };
  recipient_count: number;
  scheduled_at: string | null;
  sent_at: string | null;
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

export async function listWhatsAppCampaigns(businessId: string): Promise<APIResponse<WhatsAppCampaign[]>> {
  try {
    const response = await fetch(`/api/marketing/whatsapp/campaigns?businessId=${encodeURIComponent(businessId)}`);
    return parseResponse(response, "LIST_WHATSAPP_CAMPAIGNS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load campaigns";
    return { success: false, error: { code: "LIST_WHATSAPP_CAMPAIGNS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function createWhatsAppCampaign(input: {
  businessId: string;
  name: string;
  message: string;
  recipientFilter?: { status?: string };
}): Promise<APIResponse<WhatsAppCampaign>> {
  try {
    const response = await fetch("/api/marketing/whatsapp/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "CREATE_WHATSAPP_CAMPAIGN_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create campaign";
    return { success: false, error: { code: "CREATE_WHATSAPP_CAMPAIGN_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function deleteWhatsAppCampaign(id: string): Promise<APIResponse<null>> {
  try {
    const response = await fetch(`/api/marketing/whatsapp/campaigns/${id}`, { method: "DELETE" });
    return parseResponse(response, "DELETE_WHATSAPP_CAMPAIGN_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete campaign";
    return { success: false, error: { code: "DELETE_WHATSAPP_CAMPAIGN_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function sendWhatsAppCampaign(id: string): Promise<APIResponse<{ sent: number; failed: number; total: number }>> {
  try {
    const response = await fetch(`/api/marketing/whatsapp/campaigns/${id}/send`, { method: "POST" });
    return parseResponse(response, "SEND_WHATSAPP_CAMPAIGN_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send campaign";
    return { success: false, error: { code: "SEND_WHATSAPP_CAMPAIGN_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function generateWhatsAppContent(businessId: string, topic: string): Promise<APIResponse<{ message: string }>> {
  try {
    const response = await fetch("/api/marketing/whatsapp/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, topic }),
    });
    return parseResponse(response, "GENERATE_WHATSAPP_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate content";
    return { success: false, error: { code: "GENERATE_WHATSAPP_ERROR", message }, timestamp: new Date().toISOString() };
  }
}
