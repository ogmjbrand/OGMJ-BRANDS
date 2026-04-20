/**
 * OGMJ BRANDS — Subscriptions Service
 * Last Updated: April 19, 2026
 */

import type { APIResponse } from "../types";

// ================================
// SUBSCRIPTION TYPES
// ================================

export interface Subscription {
  id: string;
  businessId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionInput {
  businessId: string;
  planId: string;
  paymentMethodId?: string;
}

export interface UpdateSubscriptionInput {
  planId?: string;
  cancelAtPeriodEnd?: boolean;
}

// ================================
// SUBSCRIPTION FUNCTIONS
// ================================

export async function createSubscription(
  input: CreateSubscriptionInput
): Promise<APIResponse<Subscription>> {
  try {
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to create subscription',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
        code: 'NETWORK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function updateSubscription(
  subscriptionId: string,
  input: UpdateSubscriptionInput
): Promise<APIResponse<Subscription>> {
  try {
    const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to update subscription',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
        code: 'NETWORK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<APIResponse<Subscription>> {
  try {
    const response = await fetch(`/api/subscriptions/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionId }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to cancel subscription',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An error occurred',
        code: 'NETWORK_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
  }
}