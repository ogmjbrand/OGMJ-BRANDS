/**
 * OGMJ BRANDS — Analytics Service
 * Last Updated: April 19, 2026
 */

import type { APIResponse } from "../types";

// ================================
// ANALYTICS TYPES
// ================================

export interface DashboardMetrics {
  overview: {
    newContacts: number;
    newDeals: number;
    totalRevenue: number;
  };
  period: string;
}

export interface RevenueData {
  total: number;
  monthly: Record<string, number>;
  period: string;
}

export interface DealPipelineData {
  prospecting: number;
  qualification: number;
  proposal: number;
  negotiation: number;
  decision: number;
}

export interface TopContactsData {
  contacts: Array<{
    id: string;
    name: string;
    email: string;
    totalValue: number;
    dealCount: number;
  }>;
}

// ================================
// ANALYTICS FUNCTIONS
// ================================

export async function getDashboardMetrics(
  businessId: string,
  period: string = '30d'
): Promise<APIResponse<DashboardMetrics>> {
  try {
    const queryParams = new URLSearchParams({
      businessId,
      period,
    });

    const response = await fetch(`/api/analytics/dashboard?${queryParams}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to fetch dashboard metrics',
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

export async function getRevenueData(
  businessId: string,
  period: string = '30d'
): Promise<APIResponse<RevenueData>> {
  try {
    const queryParams = new URLSearchParams({
      businessId,
      period,
    });

    const response = await fetch(`/api/analytics/revenue?${queryParams}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to fetch revenue data',
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

export async function getDealPipelineData(
  businessId: string
): Promise<APIResponse<DealPipelineData>> {
  try {
    const queryParams = new URLSearchParams({
      businessId,
    });

    const response = await fetch(`/api/analytics/crm?${queryParams}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to fetch deal pipeline data',
          code: response.status.toString(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Transform the API response to match our interface
    const pipelineData = result.data.crm.deals.byStage;
    return {
      success: true,
      data: {
        prospecting: pipelineData.prospecting || 0,
        qualification: pipelineData.qualification || 0,
        proposal: pipelineData.proposal || 0,
        negotiation: pipelineData.negotiation || 0,
        decision: pipelineData.decision || 0,
      },
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

export async function getTopContacts(
  businessId: string,
  limit: number = 5
): Promise<APIResponse<TopContactsData>> {
  try {
    const queryParams = new URLSearchParams({
      businessId,
      limit: limit.toString(),
    });

    const response = await fetch(`/api/analytics/crm?${queryParams}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to fetch top contacts',
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