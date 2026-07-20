/**
 * OGMJ BRANDS — Review Management Service (client)
 */

import type { APIResponse } from "../types";

export const REVIEW_PLATFORMS = [
  { value: "google", label: "Google" },
  { value: "trustpilot", label: "Trustpilot" },
  { value: "yelp", label: "Yelp" },
  { value: "facebook", label: "Facebook" },
  { value: "other", label: "Other" },
] as const;

export interface Review {
  id: string;
  business_id: string;
  platform: "google" | "trustpilot" | "yelp" | "facebook" | "other";
  reviewer_name: string | null;
  rating: number;
  review_text: string;
  review_date: string | null;
  external_url: string | null;
  status: "new" | "responded" | "flagged";
  response_text: string | null;
  responded_at: string | null;
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

export async function listReviews(businessId: string): Promise<APIResponse<Review[]>> {
  try {
    const response = await fetch(`/api/marketing/reviews?businessId=${encodeURIComponent(businessId)}`);
    return parseResponse(response, "LIST_REVIEWS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load reviews";
    return { success: false, error: { code: "LIST_REVIEWS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function createReview(input: {
  businessId: string;
  platform: string;
  reviewerName?: string;
  rating: number;
  reviewText: string;
  reviewDate?: string;
  externalUrl?: string;
}): Promise<APIResponse<Review>> {
  try {
    const response = await fetch("/api/marketing/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "CREATE_REVIEW_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to log review";
    return { success: false, error: { code: "CREATE_REVIEW_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function updateReview(
  id: string,
  updates: { status?: string; responseText?: string }
): Promise<APIResponse<Review>> {
  try {
    const response = await fetch(`/api/marketing/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return parseResponse(response, "UPDATE_REVIEW_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update review";
    return { success: false, error: { code: "UPDATE_REVIEW_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function deleteReview(id: string): Promise<APIResponse<null>> {
  try {
    const response = await fetch(`/api/marketing/reviews/${id}`, { method: "DELETE" });
    return parseResponse(response, "DELETE_REVIEW_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete review";
    return { success: false, error: { code: "DELETE_REVIEW_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function generateReviewResponse(id: string): Promise<APIResponse<{ response: string }>> {
  try {
    const response = await fetch(`/api/marketing/reviews/${id}/respond`, { method: "POST" });
    return parseResponse(response, "GENERATE_REVIEW_RESPONSE_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate response";
    return { success: false, error: { code: "GENERATE_REVIEW_RESPONSE_ERROR", message }, timestamp: new Date().toISOString() };
  }
}
