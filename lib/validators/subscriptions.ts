/**
 * OGMJ BRANDS — Subscriptions Validators
 * Last Updated: April 19, 2026
 */

import type { CreateSubscriptionInput, UpdateSubscriptionInput } from '../services/subscriptions.service';

// ================================
// UTILITY FUNCTIONS
// ================================

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

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

  // Payment method ID validation
  if (input.paymentMethodId !== undefined) {
    if (typeof input.paymentMethodId !== 'string') {
      errors.push('Payment method ID must be a string');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUpdateSubscriptionInput(input: UpdateSubscriptionInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Plan ID validation
  if (input.planId !== undefined) {
    if (typeof input.planId !== 'string') {
      errors.push('Plan ID must be a string');
    } else if (!isValidUUID(input.planId)) {
      errors.push('Plan ID must be a valid UUID');
    }
  }

  // Cancel at period end validation
  if (input.cancelAtPeriodEnd !== undefined) {
    if (typeof input.cancelAtPeriodEnd !== 'boolean') {
      errors.push('Cancel at period end must be a boolean');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ================================
// SANITIZATION FUNCTIONS
// ================================

export function sanitizeCreateSubscriptionInput(input: CreateSubscriptionInput): CreateSubscriptionInput {
  return {
    businessId: input.businessId?.trim(),
    planId: input.planId?.trim(),
    paymentMethodId: input.paymentMethodId?.trim(),
  };
}

export function sanitizeUpdateSubscriptionInput(input: UpdateSubscriptionInput): UpdateSubscriptionInput {
  return {
    planId: input.planId?.trim(),
    cancelAtPeriodEnd: input.cancelAtPeriodEnd,
  };
}