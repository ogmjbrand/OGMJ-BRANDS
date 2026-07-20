/**
 * OGMJ BRANDS — Email Marketing Service (client)
 */

import type { APIResponse } from "../types";

export interface EmailCampaign {
  id: string;
  business_id: string;
  name: string;
  subject: string;
  body: string;
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

export async function listEmailCampaigns(businessId: string): Promise<APIResponse<EmailCampaign[]>> {
  try {
    const response = await fetch(`/api/marketing/email/campaigns?businessId=${encodeURIComponent(businessId)}`);
    return parseResponse(response, "LIST_CAMPAIGNS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load campaigns";
    return { success: false, error: { code: "LIST_CAMPAIGNS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function createEmailCampaign(input: {
  businessId: string;
  name: string;
  subject: string;
  emailBody: string;
  recipientFilter?: { status?: string };
}): Promise<APIResponse<EmailCampaign>> {
  try {
    const response = await fetch("/api/marketing/email/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "CREATE_CAMPAIGN_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create campaign";
    return { success: false, error: { code: "CREATE_CAMPAIGN_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function deleteEmailCampaign(id: string): Promise<APIResponse<null>> {
  try {
    const response = await fetch(`/api/marketing/email/campaigns/${id}`, { method: "DELETE" });
    return parseResponse(response, "DELETE_CAMPAIGN_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete campaign";
    return { success: false, error: { code: "DELETE_CAMPAIGN_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function sendEmailCampaign(id: string): Promise<APIResponse<{ sent: number; failed: number; total: number }>> {
  try {
    const response = await fetch(`/api/marketing/email/campaigns/${id}/send`, { method: "POST" });
    return parseResponse(response, "SEND_CAMPAIGN_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send campaign";
    return { success: false, error: { code: "SEND_CAMPAIGN_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function generateEmailContent(
  businessId: string,
  topic: string
): Promise<APIResponse<{ subject: string; body: string }>> {
  try {
    const response = await fetch("/api/marketing/email/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, topic }),
    });
    return parseResponse(response, "GENERATE_EMAIL_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate email content";
    return { success: false, error: { code: "GENERATE_EMAIL_ERROR", message }, timestamp: new Date().toISOString() };
  }
}
