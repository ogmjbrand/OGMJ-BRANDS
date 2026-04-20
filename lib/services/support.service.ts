/**
 * OGMJ BRANDS — Support Service
 * Last Updated: April 19, 2026
 */

import type { APIResponse } from "../types";

// ================================
// SUPPORT TICKET TYPES
// ================================

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
  category?: string;
  channel: 'web' | 'email' | 'chat' | 'phone';
  assignedTo?: string;
  resolveSla?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  contact?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface CreateSupportTicketInput {
  subject: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  contactId?: string;
}

export interface UpdateSupportTicketInput {
  subject?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
  category?: string;
  assignedTo?: string;
  resolutionNotes?: string;
}

// ================================
// TICKET REPLY TYPES
// ================================

export interface TicketReply {
  id: string;
  ticketId: string;
  body: string;
  isInternal: boolean;
  attachments: any[];
  aiSuggestedReply: boolean;
  createdAt: string;
  createdBy: string;
}

export interface CreateTicketReplyInput {
  body: string;
  isInternal?: boolean;
  attachments?: any[];
}

// ================================
// SUPPORT TICKET FUNCTIONS
// ================================

export async function getSupportTickets(
  businessId: string,
  filters?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }
): Promise<APIResponse<{ tickets: SupportTicket[]; total: number }>> {
  try {
    const queryParams = new URLSearchParams({
      businessId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.assignedTo && { assignedTo: filters.assignedTo }),
      ...(filters?.limit && { limit: filters.limit.toString() }),
      ...(filters?.offset && { offset: filters.offset.toString() }),
    });

    const response = await fetch(`/api/support?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'FETCH_SUPPORT_TICKETS_ERROR', 'Failed to fetch support tickets'),
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
    const message = error instanceof Error ? error.message : 'Support tickets fetch failed';
    return {
      success: false,
      error: { code: 'FETCH_SUPPORT_TICKETS_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getSupportTicket(
  ticketId: string
): Promise<APIResponse<SupportTicket>> {
  try {
    const response = await fetch(`/api/support/${ticketId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'FETCH_SUPPORT_TICKET_ERROR', 'Failed to fetch support ticket'),
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
    const message = error instanceof Error ? error.message : 'Support ticket fetch failed';
    return {
      success: false,
      error: { code: 'FETCH_SUPPORT_TICKET_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function createSupportTicket(
  businessId: string,
  input: CreateSupportTicketInput
): Promise<APIResponse<SupportTicket>> {
  try {
    const response = await fetch('/api/support', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ businessId, ...input }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'CREATE_SUPPORT_TICKET_ERROR', 'Failed to create support ticket'),
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
    const message = error instanceof Error ? error.message : 'Support ticket creation failed';
    return {
      success: false,
      error: { code: 'CREATE_SUPPORT_TICKET_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function updateSupportTicket(
  ticketId: string,
  input: UpdateSupportTicketInput
): Promise<APIResponse<SupportTicket>> {
  try {
    const response = await fetch(`/api/support/${ticketId}`, {
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
        error: normalizeServiceError(errorData, 'UPDATE_SUPPORT_TICKET_ERROR', 'Failed to update support ticket'),
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
    const message = error instanceof Error ? error.message : 'Support ticket update failed';
    return {
      success: false,
      error: { code: 'UPDATE_SUPPORT_TICKET_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// TICKET REPLY FUNCTIONS
// ================================

export async function getTicketReplies(
  ticketId: string
): Promise<APIResponse<TicketReply[]>> {
  try {
    const response = await fetch(`/api/support/${ticketId}/replies`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'FETCH_TICKET_REPLIES_ERROR', 'Failed to fetch ticket replies'),
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
    const message = error instanceof Error ? error.message : 'Ticket replies fetch failed';
    return {
      success: false,
      error: { code: 'FETCH_TICKET_REPLIES_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function createTicketReply(
  ticketId: string,
  input: CreateTicketReplyInput
): Promise<APIResponse<TicketReply>> {
  try {
    const response = await fetch(`/api/support/${ticketId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: normalizeServiceError(errorData, 'CREATE_TICKET_REPLY_ERROR', 'Failed to create ticket reply'),
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
    const message = error instanceof Error ? error.message : 'Ticket reply creation failed';
    return {
      success: false,
      error: { code: 'CREATE_TICKET_REPLY_ERROR', message },
      timestamp: new Date().toISOString(),
    };
  }
}

// ================================
// UTILITY FUNCTIONS
// ================================

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
// VALIDATION FUNCTIONS
// ================================

export function validateSupportTicketInput(input: CreateSupportTicketInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.subject || input.subject.trim().length === 0) {
    errors.push('Subject is required');
  }

  if (input.subject && input.subject.length > 255) {
    errors.push('Subject must be less than 255 characters');
  }

  if (input.priority && !['low', 'medium', 'high', 'urgent'].includes(input.priority)) {
    errors.push('Invalid priority level');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateTicketReplyInput(input: CreateTicketReplyInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.body || input.body.trim().length === 0) {
    errors.push('Reply body is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}