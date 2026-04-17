/**
 * OGMJ BRANDS — Settings Service
 * Last Updated: April 18, 2026
 */

import type { APIResponse } from "../types";

// ================================
// PROFILE TYPES
// ================================

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

// ================================
// BUSINESS SETTINGS TYPES
// ================================

export interface BusinessSettings {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  customDomain?: string;
  logoUrl?: string;
  brandColor: string;
  currency: string;
  timezone: string;
  country?: string;
  industry?: string;
  teamSize?: number;
  phone?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBusinessSettingsInput {
  name?: string;
  industry?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  teamSize?: number;
  phone?: string;
  brandColor?: string;
  logoUrl?: string;
  customDomain?: string;
}

// ================================
// PROFILE FUNCTIONS
// ================================

export async function getUserProfile(): Promise<APIResponse<UserProfile>> {
  try {
    const response = await fetch('/api/settings/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'FETCH_PROFILE_ERROR', 'Failed to fetch profile'),
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Profile fetch failed';
    return {
      success: false,
      error: { code: 'FETCH_PROFILE_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function updateUserProfile(
  input: UpdateProfileInput
): Promise<APIResponse<UserProfile>> {
  try {
    const response = await fetch('/api/settings/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'UPDATE_PROFILE_ERROR', 'Failed to update profile'),
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Profile update failed';
    return {
      success: false,
      error: { code: 'UPDATE_PROFILE_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// BUSINESS SETTINGS FUNCTIONS
// ================================

export async function getBusinessSettings(
  businessId: string
): Promise<APIResponse<BusinessSettings>> {
  try {
    const response = await fetch(`/api/settings/business?businessId=${encodeURIComponent(businessId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'FETCH_BUSINESS_SETTINGS_ERROR', 'Failed to fetch business settings'),
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Business settings fetch failed';
    return {
      success: false,
      error: { code: 'FETCH_BUSINESS_SETTINGS_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function updateBusinessSettings(
  businessId: string,
  input: UpdateBusinessSettingsInput
): Promise<APIResponse<BusinessSettings>> {
  try {
    const response = await fetch(`/api/settings/business?businessId=${encodeURIComponent(businessId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'UPDATE_BUSINESS_SETTINGS_ERROR', 'Failed to update business settings'),
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Business settings update failed';
    return {
      success: false,
      error: { code: 'UPDATE_BUSINESS_SETTINGS_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

function normalizeServiceError(
  errorData: any,
  fallbackCode: string,
  fallbackMessage: string
): { code: string; message: string } {
  if (!errorData || typeof errorData !== 'object') {
    return { code: fallbackCode, message: fallbackMessage };
  }

  if (typeof errorData.error === 'string') {
    return { code: fallbackCode, message: errorData.error };
  }

  if (typeof errorData.error === 'object' && errorData.error !== null) {
    return {
      code: errorData.error.code || fallbackCode,
      message: errorData.error.message || fallbackMessage,
    };
  }

  return { code: fallbackCode, message: fallbackMessage };
}

// ================================
// UTILITY FUNCTIONS
// ================================

export function validateProfileInput(input: UpdateProfileInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.fullName !== undefined && input.fullName.trim().length === 0) {
    errors.push('Full name cannot be empty');
  }

  if (input.phone !== undefined && input.phone.trim().length === 0) {
    errors.push('Phone cannot be empty');
  }

  if (input.avatarUrl !== undefined && input.avatarUrl.trim().length === 0) {
    errors.push('Avatar URL cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateBusinessSettingsInput(input: UpdateBusinessSettingsInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.name !== undefined && input.name.trim().length === 0) {
    errors.push('Business name cannot be empty');
  }

  if (input.teamSize !== undefined && input.teamSize < 1) {
    errors.push('Team size must be at least 1');
  }

  if (input.currency !== undefined && !['NGN', 'USD', 'EUR', 'GBP'].includes(input.currency)) {
    errors.push('Invalid currency');
  }

  if (input.timezone !== undefined && input.timezone.trim().length === 0) {
    errors.push('Timezone cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}