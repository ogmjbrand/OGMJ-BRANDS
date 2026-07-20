import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';

// Canonical support_ticket_messages columns: id, ticket_id, sender_id,
// message, created_at. There is no isInternal/attachments/aiSuggestedReply
// column — this is a plain message thread.
function transformMessage(message: any) {
  return {
    id: message.id,
    ticketId: message.ticket_id,
    body: message.message,
    createdAt: message.created_at,
    createdBy: message.sender_id,
  };
}

async function verifyTicketAccess(supabase: any, ticketId: string, userId: string) {
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('business_id')
    .eq('id', ticketId)
    .single();

  if (!ticket) return null;

  const { data: accessCheck } = await supabase
    .from('business_users')
    .select('role')
    .eq('business_id', ticket.business_id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  return accessCheck ? ticket : null;
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

    const { id: ticketId } = await params;
    const supabase = await createServerClient();

    const ticket = await verifyTicketAccess(supabase, ticketId, user.id);
    if (!ticket) {
      return createErrorResponse('Access denied', 403);
    }

    const { data: messages, error } = await supabase
      .from('support_ticket_messages')
      .select('id, ticket_id, sender_id, message, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      return createErrorResponse('Failed to fetch replies', 500);
    }

    return createSuccessResponse((messages || []).map(transformMessage));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { id: ticketId } = await params;
    const body = await request.json();
    const { body: messageBody } = body;

    if (!messageBody || typeof messageBody !== 'string' || !messageBody.trim()) {
      return createErrorResponse('Message body is required', 400);
    }

    const supabase = await createServerClient();

    const ticket = await verifyTicketAccess(supabase, ticketId, user.id);
    if (!ticket) {
      return createErrorResponse('Access denied', 403);
    }

    const { data: message, error } = await (supabase as any)
      .from('support_ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        message: messageBody.trim(),
      })
      .select('id, ticket_id, sender_id, message, created_at')
      .single();

    if (error) {
      return createErrorResponse('Failed to post reply', 500);
    }

    return createSuccessResponse(transformMessage(message), undefined, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
