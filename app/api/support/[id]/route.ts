import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';

// Canonical support_tickets columns: id, business_id, subject, description,
// priority, status, created_by, created_at, updated_at. A display ticket
// number is derived from the row id.
function transformTicket(ticket: any) {
  return {
    id: ticket.id,
    ticketNumber: `TKT-${String(ticket.id).slice(0, 8).toUpperCase()}`,
    businessId: ticket.business_id,
    subject: ticket.subject,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    createdBy: ticket.created_by,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const supabase = await createServerClient();

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select('id, business_id, subject, description, priority, status, created_at, updated_at, created_by')
      .eq('id', id)
      .single();

    if (error || !ticket) {
      return createErrorResponse('Ticket not found', 404);
    }

    // Verify business access
    const { data: accessCheck } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', (ticket as any).business_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!accessCheck) {
      return createErrorResponse('Access denied', 403);
    }

    return createSuccessResponse(transformTicket(ticket));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = await createServerClient();

    const { data: currentTicket } = await supabase
      .from('support_tickets')
      .select('business_id')
      .eq('id', id)
      .single();

    if (!currentTicket) {
      return createErrorResponse('Ticket not found', 404);
    }

    // Verify business access
    const { data: accessCheck } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', (currentTicket as any).business_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!accessCheck) {
      return createErrorResponse('Access denied', 403);
    }

    // Whitelist canonical columns so unknown keys from the client can't
    // 400 the whole request
    const allowed = ['subject', 'description', 'priority', 'status'];
    const updateData: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }
    updateData.updated_at = new Date().toISOString();

    const { data: ticket, error } = await (supabase as any)
      .from('support_tickets')
      .update(updateData)
      .eq('id', id)
      .select('id, business_id, subject, description, priority, status, created_at, updated_at, created_by')
      .single();

    if (error) {
      return createErrorResponse('Failed to update ticket', 500);
    }

    return createSuccessResponse(transformTicket(ticket));
  } catch (error) {
    return handleApiError(error);
  }
}
