/**
 * OGMJ BRANDS — Subscriptions Validators
 * Last Updated: April 19, 2026
 */

import type { CreateSubscriptionInput, UpdateSubscriptionInput } from '../services/subscriptions.service';

// ================================
// SUBSCRIPTION VALIDATION
// ================================

export function validateCreateSubscriptionInput(input: CreateSubscriptionInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Business ID validation
  if (!input.businessId || typeof input.businessId !== 'string') {
    errors.push('Business ID is required and must be a string');
  } else if (!isValidUUID(input.businessId)) {
    errors.push('Business ID must be a valid UUID');
  }

  // Plan ID validation
  if (!input.planId || typeof input.planId !== 'string') {
    errors.push('Plan ID is required and must be a string');
  } else if (!isValidUUID(input.planId)) {
    errors.push('Plan ID must be a valid UUID');
  }

  // Payment method validation
  if (input.paymentMethod !== undefined) {
    if (typeof input.paymentMethod !== 'string') {
      errors.push('Payment method must be a string');
    } else if (!['card', 'bank_transfer', 'wallet'].includes(input.paymentMethod)) {
      errors.push('Payment method must be one of: card, bank_transfer, wallet');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUpdateSubscriptionInput(input: UpdateSubscriptionInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Status validation
  if (input.status !== undefined) {
    if (typeof input.status !== 'string') {
      errors.push('Status must be a string');
    } else if (!['active', 'cancelled', 'suspended', 'expired'].includes(input.status)) {
      errors.push('Status must be one of: active, cancelled, suspended, expired');
    }
  }

  // Payment method validation
  if (input.paymentMethod !== undefined) {
    if (typeof input.paymentMethod !== 'string') {
      errors.push('Payment method must be a string');
    } else if (!['card', 'bank_transfer', 'wallet'].includes(input.paymentMethod)) {
      errors.push('Payment method must be one of: card, bank_transfer, wallet');
    }
  }

  // Amount validation
  if (input.amount !== undefined) {
    if (typeof input.amount !== 'number') {
      errors.push('Amount must be a number');
    } else if (input.amount < 0) {
      errors.push('Amount cannot be negative');
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

  // Billing period validation
  if (input.billingPeriod !== undefined) {
    if (typeof input.billingPeriod !== 'string') {
      errors.push('Billing period must be a string');
    } else if (!['monthly', 'yearly'].includes(input.billingPeriod)) {
      errors.push('Billing period must be one of: monthly, yearly');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ================================
// SUBSCRIPTION UPGRADE VALIDATION
// ================================

export function validateUpgradeSubscriptionInput(input: {
  businessId: string;
  newPlanId: string;
  paymentMethod?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Business ID validation
  if (!input.businessId || typeof input.businessId !== 'string') {
    errors.push('Business ID is required and must be a string');
  } else if (!isValidUUID(input.businessId)) {
    errors.push('Business ID must be a valid UUID');
  }

  // New plan ID validation
  if (!input.newPlanId || typeof input.newPlanId !== 'string') {
    errors.push('New plan ID is required and must be a string');
  } else if (!isValidUUID(input.newPlanId)) {
    errors.push('New plan ID must be a valid UUID');
  }

  // Payment method validation
  if (input.paymentMethod !== undefined) {
    if (typeof input.paymentMethod !== 'string') {
      errors.push('Payment method must be a string');
    } else if (!['card', 'bank_transfer', 'wallet'].includes(input.paymentMethod)) {
      errors.push('Payment method must be one of: card, bank_transfer, wallet');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ================================
// SUBSCRIPTION CANCEL VALIDATION
// ================================

export function validateCancelSubscriptionInput(input: {
  businessId: string;
  reason?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Business ID validation
  if (!input.businessId || typeof input.businessId !== 'string') {
    errors.push('Business ID is required and must be a string');
  } else if (!isValidUUID(input.businessId)) {
    errors.push('Business ID must be a valid UUID');
  }

  // Reason validation
  if (input.reason !== undefined) {
    if (typeof input.reason !== 'string') {
      errors.push('Reason must be a string');
    } else if (input.reason.length > 500) {
      errors.push('Reason must be less than 500 characters');
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

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ================================
// SANITIZATION FUNCTIONS
// ================================

export function sanitizeCreateSubscriptionInput(input: CreateSubscriptionInput): CreateSubscriptionInput {
  return {
    ...input,
    paymentMethod: input.paymentMethod || 'card',
  };
}

export function sanitizeUpdateSubscriptionInput(input: UpdateSubscriptionInput): UpdateSubscriptionInput {
  return {
    ...input,
  };
}