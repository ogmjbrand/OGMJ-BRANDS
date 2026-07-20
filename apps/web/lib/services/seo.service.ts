/**
 * OGMJ BRANDS — SEO Assistant Service (client)
 */

import type { APIResponse } from "../types";

export interface SEOMeta {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  headingSuggestions: string[];
}

export interface ContentGapAnalysis {
  summary: string;
  wellCovered: string[];
  gaps: { pillar: string; suggestion: string }[];
  quickWins: string[];
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

export async function generateSEOMeta(input: {
  businessId: string;
  topic: string;
  content?: string;
}): Promise<APIResponse<SEOMeta>> {
  try {
    const response = await fetch("/api/marketing/seo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "GENERATE_SEO_META_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate SEO meta";
    return { success: false, error: { code: "GENERATE_SEO_META_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function analyzeContentGaps(businessId: string): Promise<APIResponse<ContentGapAnalysis>> {
  try {
    const response = await fetch("/api/marketing/seo/content-gaps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    });
    return parseResponse(response, "CONTENT_GAP_ANALYSIS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze content gaps";
    return { success: false, error: { code: "CONTENT_GAP_ANALYSIS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}
