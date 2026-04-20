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

  // Category validation
  if (input.category !== undefined) {
    if (typeof input.category !== 'string') {
      errors.push('Category must be a string');
    } else if (input.category.trim().length === 0) {
      errors.push('Category cannot be empty');
    } else if (input.category.length > 100) {
      errors.push('Category must be less than 100 characters');
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

  // Category validation
  if (input.category !== undefined) {
    if (typeof input.category !== 'string') {
      errors.push('Category must be a string');
    } else if (input.category.trim().length === 0) {
      errors.push('Category cannot be empty');
    } else if (input.category.length > 100) {
      errors.push('Category must be less than 100 characters');
    }
  }

  // Resolution notes validation
  if (input.resolutionNotes !== undefined) {
    if (typeof input.resolutionNotes !== 'string') {
      errors.push('Resolution notes must be a string');
    } else if (input.resolutionNotes.length > 5000) {
      errors.push('Resolution notes must be less than 5000 characters');
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

  // Is internal validation
  if (input.isInternal !== undefined && typeof input.isInternal !== 'boolean') {
    errors.push('Is internal must be a boolean');
  }

  // Attachments validation
  if (input.attachments !== undefined) {
    if (!Array.isArray(input.attachments)) {
      errors.push('Attachments must be an array');
    } else {
      input.attachments.forEach((attachment, index) => {
        if (typeof attachment !== 'object' || attachment === null) {
          errors.push(`Attachment at index ${index} must be an object`);
        } else {
          // Validate attachment structure
          if (!attachment.url || typeof attachment.url !== 'string') {
            errors.push(`Attachment at index ${index} must have a valid URL`);
          }
          if (attachment.name && typeof attachment.name !== 'string') {
            errors.push(`Attachment name at index ${index} must be a string`);
          }
          if (attachment.size && typeof attachment.size !== 'number') {
            errors.push(`Attachment size at index ${index} must be a number`);
          }
        }
      });
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

export function sanitizeSupportTicketInput(input: CreateSupportTicketInput): CreateSupportTicketInput {
  return {
    ...input,
    subject: input.subject.trim(),
    description: input.description?.trim(),
    category: input.category?.trim(),
  };
}

export function sanitizeUpdateSupportTicketInput(input: UpdateSupportTicketInput): UpdateSupportTicketInput {
  return {
    ...input,
    subject: input.subject?.trim(),
    description: input.description?.trim(),
    category: input.category?.trim(),
    resolutionNotes: input.resolutionNotes?.trim(),
  };
}

export function sanitizeTicketReplyInput(input: CreateTicketReplyInput): CreateTicketReplyInput {
  return {
    ...input,
    body: input.body.trim(),
  };
}