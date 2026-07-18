/**
 * OGMJ BRANDS — Support Validators
 * Last Updated: April 19, 2026
 */

import type { CreateSupportTicketInput, UpdateSupportTicketInput, CreateTicketReplyInput } from '../services/support.service';

// ================================
// SUPPORT TICKET VALIDATION
// ================================

export function validateCreateSupportTicketInput(input: CreateSupportTicketInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Subject validation
  if (!input.subject || typeof input.subject !== 'string') {
    errors.push('Subject is required and must be a string');
  } else if (input.subject.trim().length === 0) {
    errors.push('Subject cannot be empty');
  } else if (input.subject.length > 255) {
    errors.push('Subject must be less than 255 characters');
  }

  // Description validation
  if (input.description !== undefined) {
    if (typeof input.description !== 'string') {
      errors.push('Description must be a string');
    } else if (input.description.length > 5000) {
      errors.push('Description must be less than 5000 characters');
    }
  }

  // Priority validation
  if (input.priority !== undefined) {
    if (typeof input.priority !== 'string') {
      errors.push('Priority must be a string');
    } else if (!['low', 'medium', 'high', 'urgent'].includes(input.priority)) {
      errors.push('Priority must be one of: low, medium, high, urgent');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUpdateSupportTicketInput(input: UpdateSupportTicketInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Subject validation
  if (input.subject !== undefined) {
    if (typeof input.subject !== 'string') {
      errors.push('Subject must be a string');
    } else if (input.subject.trim().length === 0) {
      errors.push('Subject cannot be empty');
    } else if (input.subject.length > 255) {
      errors.push('Subject must be less than 255 characters');
    }
  }

  // Description validation
  if (input.description !== undefined) {
    if (typeof input.description !== 'string') {
      errors.push('Description must be a string');
    } else if (input.description.length > 5000) {
      errors.push('Description must be less than 5000 characters');
    }
  }

  // Priority validation
  if (input.priority !== undefined) {
    if (typeof input.priority !== 'string') {
      errors.push('Priority must be a string');
    } else if (!['low', 'medium', 'high', 'urgent'].includes(input.priority)) {
      errors.push('Priority must be one of: low, medium, high, urgent');
    }
  }

  // Status validation
  if (input.status !== undefined) {
    if (typeof input.status !== 'string') {
      errors.push('Status must be a string');
    } else if (!['open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed'].includes(input.status)) {
      errors.push('Status must be one of: open, in_progress, waiting_for_customer, resolved, closed');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ================================
// TICKET REPLY VALIDATION
// ================================

export function validateCreateTicketReplyInput(input: CreateTicketReplyInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Body validation
  if (!input.body || typeof input.body !== 'string') {
    errors.push('Reply body is required and must be a string');
  } else if (input.body.trim().length === 0) {
    errors.push('Reply body cannot be empty');
  } else if (input.body.length > 10000) {
    errors.push('Reply body must be less than 10000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ================================
// UTILITY FUNCTIONS
// ================================

export function sanitizeSupportTicketInput(input: CreateSupportTicketInput): CreateSupportTicketInput {
  return {
    ...input,
    subject: input.subject.trim(),
    description: input.description?.trim(),
  };
}

export function sanitizeUpdateSupportTicketInput(input: UpdateSupportTicketInput): UpdateSupportTicketInput {
  return {
    ...input,
    subject: input.subject?.trim(),
    description: input.description?.trim(),
  };
}

export function sanitizeTicketReplyInput(input: CreateTicketReplyInput): CreateTicketReplyInput {
  return {
    ...input,
    body: input.body.trim(),
  };
}

