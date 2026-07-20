/**
 * OGMJ BRANDS — AI Marketing Service (client)
 * Phase 1: Brand Strategy + Content Studio.
 */

import type { APIResponse } from "../types";

export interface BrandStrategy {
  id: string;
  business_id: string;
  industry: string | null;
  products_services: string | null;
  budget: string | null;
  target_audience: string | null;
  competitors: string | null;
  usp: string | null;
  brand_story: string | null;
  mission: string | null;
  vision: string | null;
  core_values: string | null;
  brand_voice: string | null;
  brand_tone: string | null;
  goals: string | null;
  market: string | null;
  generated: {
    positioning?: string;
    messaging?: string;
    personas?: { name: string; summary: string }[];
    buyerJourney?: { stage: string; description: string }[];
    swot?: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
    competitiveAnalysis?: string;
    offerStrategy?: string;
    pricingStrategy?: string;
    contentPillars?: string[];
    seoStrategy?: string;
    roadmap?: { month: string; focus: string }[];
    kpis?: string[];
  };
  generated_at: string | null;
}

export interface BrandStrategyInput {
  businessId: string;
  industry?: string;
  productsServices?: string;
  budget?: string;
  targetAudience?: string;
  competitors?: string;
  usp?: string;
  brandStory?: string;
  mission?: string;
  vision?: string;
  coreValues?: string;
  brandVoice?: string;
  brandTone?: string;
  goals?: string;
  market?: string;
}

export const CONTENT_TYPES = [
  { value: "blog_article", label: "Blog Article" },
  { value: "seo_article", label: "SEO Article" },
  { value: "landing_page", label: "Landing Page" },
  { value: "sales_page", label: "Sales Page" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "newsletter", label: "Newsletter" },
  { value: "product_description", label: "Product Description" },
  { value: "linkedin_post", label: "LinkedIn Post" },
  { value: "instagram_post", label: "Instagram Post" },
  { value: "facebook_post", label: "Facebook Post" },
  { value: "tiktok_script", label: "TikTok Script" },
  { value: "youtube_script", label: "YouTube Script" },
  { value: "thread_post", label: "Threads Post" },
  { value: "pinterest_post", label: "Pinterest Pin" },
  { value: "x_post", label: "X Post" },
  { value: "google_business_post", label: "Google Business Post" },
  { value: "podcast_script", label: "Podcast Script" },
  { value: "press_release", label: "Press Release" },
  { value: "case_study", label: "Case Study" },
  { value: "white_paper", label: "White Paper" },
  { value: "ebook", label: "Ebook Outline" },
  { value: "lead_magnet", label: "Lead Magnet" },
  { value: "ad_copy", label: "Ad Copy" },
] as const;

export interface ContentItem {
  id: string;
  business_id: string;
  type: string;
  platform: string | null;
  topic: string | null;
  title: string | null;
  body: string;
  status: "draft" | "published" | "archived";
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

export async function getBrandStrategy(businessId: string): Promise<APIResponse<BrandStrategy | null>> {
  try {
    const response = await fetch(`/api/marketing/brand-strategy?businessId=${encodeURIComponent(businessId)}`);
    return parseResponse(response, "GET_BRAND_STRATEGY_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load brand strategy";
    return { success: false, error: { code: "GET_BRAND_STRATEGY_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function generateBrandStrategy(input: BrandStrategyInput): Promise<APIResponse<BrandStrategy>> {
  try {
    const response = await fetch("/api/marketing/brand-strategy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "GENERATE_BRAND_STRATEGY_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate brand strategy";
    return { success: false, error: { code: "GENERATE_BRAND_STRATEGY_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function listContentItems(businessId: string, type?: string): Promise<APIResponse<ContentItem[]>> {
  try {
    const url = type
      ? `/api/marketing/content?businessId=${encodeURIComponent(businessId)}&type=${encodeURIComponent(type)}`
      : `/api/marketing/content?businessId=${encodeURIComponent(businessId)}`;
    const response = await fetch(url);
    return parseResponse(response, "LIST_CONTENT_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load content";
    return { success: false, error: { code: "LIST_CONTENT_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function generateContentItem(input: {
  businessId: string;
  type: string;
  platform?: string;
  topic: string;
  instructions?: string;
}): Promise<APIResponse<ContentItem>> {
  try {
    const response = await fetch("/api/marketing/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "GENERATE_CONTENT_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate content";
    return { success: false, error: { code: "GENERATE_CONTENT_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function updateContentItem(
  id: string,
  updates: { title?: string; body?: string; status?: "draft" | "published" | "archived" }
): Promise<APIResponse<ContentItem>> {
  try {
    const response = await fetch(`/api/marketing/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return parseResponse(response, "UPDATE_CONTENT_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update content";
    return { success: false, error: { code: "UPDATE_CONTENT_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function deleteContentItem(id: string): Promise<APIResponse<null>> {
  try {
    const response = await fetch(`/api/marketing/content/${id}`, { method: "DELETE" });
    return parseResponse(response, "DELETE_CONTENT_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete content";
    return { success: false, error: { code: "DELETE_CONTENT_ERROR", message }, timestamp: new Date().toISOString() };
  }
}
