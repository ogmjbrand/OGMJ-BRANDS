/**
 * OGMJ BRANDS — Marketplace Service (client)
 */

import type { APIResponse } from "../types";

export interface MarketplaceListing {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string | null;
  short_desc: string | null;
  price: number;
  sale_price: number | null;
  currency: string;
  price_type: "fixed" | "starting_from" | "custom" | "free";
  delivery_days: number;
  revisions: number;
  thumbnail_url: string | null;
  features: string[];
  is_featured: boolean;
}

export interface MarketplaceOrder {
  id: string;
  order_number: string;
  status: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  delivery_date: string | null;
  created_at: string;
  listing: { id: string; title: string; slug: string; thumbnail_url: string | null } | null;
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

export async function listMarketplaceListings(category?: string): Promise<APIResponse<MarketplaceListing[]>> {
  try {
    const url = category ? `/api/marketplace/listings?category=${encodeURIComponent(category)}` : "/api/marketplace/listings";
    const response = await fetch(url);
    return parseResponse(response, "LIST_LISTINGS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load listings";
    return { success: false, error: { code: "LIST_LISTINGS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function listMarketplaceOrders(businessId: string): Promise<APIResponse<MarketplaceOrder[]>> {
  try {
    const response = await fetch(`/api/marketplace/orders?businessId=${encodeURIComponent(businessId)}`);
    return parseResponse(response, "LIST_ORDERS_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load orders";
    return { success: false, error: { code: "LIST_ORDERS_ERROR", message }, timestamp: new Date().toISOString() };
  }
}

export async function placeMarketplaceOrder(input: {
  businessId: string;
  listingId: string;
  quantity?: number;
  requirements?: string;
}): Promise<APIResponse<MarketplaceOrder>> {
  try {
    const response = await fetch("/api/marketplace/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return parseResponse(response, "PLACE_ORDER_ERROR");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to place order";
    return { success: false, error: { code: "PLACE_ORDER_ERROR", message }, timestamp: new Date().toISOString() };
  }
}
