/**
 * OGMJ BRANDS — Settings Validators
 * Last Updated: April 19, 2026
 */

import type { UpdateProfileInput, UpdateBusinessSettingsInput } from '../services/settings.service';

// ================================
// PROFILE VALIDATION
// ================================

export function validateProfileInput(input: UpdateProfileInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Full name validation
  if (input.fullName !== undefined) {
    if (typeof input.fullName !== 'string') {
      errors.push('Full name must be a string');
    } else if (input.fullName.trim().length === 0) {
      errors.push('Full name cannot be empty');
    } else if (input.fullName.length > 100) {
      errors.push('Full name must be less than 100 characters');
    }
  }

  // Phone validation
  if (input.phone !== undefined) {
    if (typeof input.phone !== 'string') {
      errors.push('Phone must be a string');
    } else if (input.phone.trim().length === 0) {
      errors.push('Phone cannot be empty');
    } else if (!isValidPhoneNumber(input.phone)) {
      errors.push('Invalid phone number format');
    }
  }

  // Avatar URL validation
  if (input.avatarUrl !== undefined) {
    if (typeof input.avatarUrl !== 'string') {
      errors.push('Avatar URL must be a string');
    } else if (input.avatarUrl.trim().length === 0) {
      errors.push('Avatar URL cannot be empty');
    } else if (!isValidUrl(input.avatarUrl)) {
      errors.push('Invalid avatar URL format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ================================
// BUSINESS SETTINGS VALIDATION
// ================================

export function validateBusinessSettingsInput(input: UpdateBusinessSettingsInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Name validation
  if (input.name !== undefined) {
    if (typeof input.name !== 'string') {
      errors.push('Business name must be a string');
    } else if (input.name.trim().length === 0) {
      errors.push('Business name cannot be empty');
    } else if (input.name.length > 100) {
      errors.push('Business name must be less than 100 characters');
    }
  }

  // Industry validation
  if (input.industry !== undefined) {
    if (typeof input.industry !== 'string') {
      errors.push('Industry must be a string');
    } else if (input.industry.trim().length === 0) {
      errors.push('Industry cannot be empty');
    } else if (input.industry.length > 100) {
      errors.push('Industry must be less than 100 characters');
    }
  }

  // Country validation
  if (input.country !== undefined) {
    if (typeof input.country !== 'string') {
      errors.push('Country must be a string');
    } else if (input.country.trim().length === 0) {
      errors.push('Country cannot be empty');
    } else if (input.country.length > 100) {
      errors.push('Country must be less than 100 characters');
    }
  }

  // Currency validation
  if (input.currency !== undefined) {
    if (typeof input.currency !== 'string') {
      errors.push('Currency must be a string');
    } else if (!['NGN', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(input.currency)) {
      errors.push('Invalid currency code');
    }
  }

  // Timezone validation
  if (input.timezone !== undefined) {
    if (typeof input.timezone !== 'string') {
      errors.push('Timezone must be a string');
    } else if (input.timezone.trim().length === 0) {
      errors.push('Timezone cannot be empty');
    } else if (!isValidTimezone(input.timezone)) {
      errors.push('Invalid timezone format');
    }
  }

  // Team size validation
  if (input.teamSize !== undefined) {
    if (typeof input.teamSize !== 'number') {
      errors.push('Team size must be a number');
    } else if (input.teamSize < 1) {
      errors.push('Team size must be at least 1');
    } else if (input.teamSize > 10000) {
      errors.push('Team size cannot exceed 10,000');
    }
  }

  // Phone validation
  if (input.phone !== undefined) {
    if (typeof input.phone !== 'string') {
      errors.push('Phone must be a string');
    } else if (input.phone.trim().length === 0) {
      errors.push('Phone cannot be empty');
    } else if (!isValidPhoneNumber(input.phone)) {
      errors.push('Invalid phone number format');
    }
  }

  // Brand color validation
  if (input.brandColor !== undefined) {
    if (typeof input.brandColor !== 'string') {
      errors.push('Brand color must be a string');
    } else if (!isValidHexColor(input.brandColor)) {
      errors.push('Invalid hex color format (use #RRGGBB)');
    }
  }

  // Logo URL validation
  if (input.logoUrl !== undefined) {
    if (typeof input.logoUrl !== 'string') {
      errors.push('Logo URL must be a string');
    } else if (input.logoUrl.trim().length === 0) {
      errors.push('Logo URL cannot be empty');
    } else if (!isValidUrl(input.logoUrl)) {
      errors.push('Invalid logo URL format');
    }
  }

  // Custom domain validation
  if (input.customDomain !== undefined) {
    if (typeof input.customDomain !== 'string') {
      errors.push('Custom domain must be a string');
    } else if (input.customDomain.trim().length === 0) {
      errors.push('Custom domain cannot be empty');
    } else if (!isValidDomain(input.customDomain)) {
      errors.push('Invalid domain format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ================================
// UTILITY FUNCTIONS
// ================================

function isValidPhoneNumber(phone: string): boolean {
  // Basic phone number validation - accepts international formats
  const phoneRegex = /^\+?[\d\s\-\(\)]{7,20}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidTimezone(timezone: string): boolean {
  // Check if it's a valid IANA timezone identifier
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function isValidHexColor(color: string): boolean {
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  return hexRegex.test(color);
}

function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain) && domain.length <= 253;
}