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
    subject: ticket.subject,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    createdBy: ticket.created_by,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!businessId) {
      return createErrorResponse('Business ID required', 400);
    }

    const supabase = await createServerClient();

    // Verify business access
    const { data: accessCheck } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!accessCheck) {
      return createErrorResponse('Access denied', 403);
    }

    let query = supabase
      .from('support_tickets')
      .select('id, subject, description, priority, status, created_at, updated_at, created_by', { count: 'exact' })
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: tickets, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return createErrorResponse('Failed to fetch support tickets', 500);
    }

    return createSuccessResponse({
      tickets: (tickets ?? []).map(transformTicket),
      total: count || 0,
      limit,
      offset,
    });

  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { businessId, subject, description, priority } = body;

    // description is NOT NULL in the canonical schema
    if (!businessId || !subject || !description) {
      return createErrorResponse('Business ID, subject and description are required', 400);
    }

    const supabase = await createServerClient();

    // Verify business access
    const { data: accessCheck } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!accessCheck) {
      return createErrorResponse('Access denied', 403);
    }

    const { data: ticket, error } = await (supabase as any)
      .from('support_tickets')
      .insert({
        business_id: businessId,
        subject,
        description,
        priority: priority || 'medium',
        status: 'open',
        created_by: user.id,
      })
      .select('id, subject, description, priority, status, created_at, updated_at, created_by')
      .single();

    if (error) {
      console.error('Database error:', error);
      return createErrorResponse('Failed to create support ticket', 500);
    }

    return createSuccessResponse(transformTicket(ticket), undefined, undefined, 201);

  } catch (error) {
    return handleApiError(error);
  }
}
