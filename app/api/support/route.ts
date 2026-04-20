import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/utils/api';

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
      .select(`
        id,
        ticket_number,
        subject,
        description,
        priority,
        status,
        category,
        channel,
        assigned_to,
        resolve_sla,
        resolved_at,
        resolution_notes,
        created_at,
        updated_at,
        created_by,
        contact:contacts!support_tickets_contact_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
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

    // Transform data to match service interface
    const transformedTickets = tickets?.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      category: ticket.category,
      channel: ticket.channel,
      assignedTo: ticket.assigned_to,
      resolveSla: ticket.resolve_sla,
      resolvedAt: ticket.resolved_at,
      resolutionNotes: ticket.resolution_notes,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      createdBy: ticket.created_by,
      contact: ticket.contact ? {
        id: ticket.contact.id,
        firstName: ticket.contact.first_name,
        lastName: ticket.contact.last_name,
        email: ticket.contact.email,
      } : undefined,
    })) || [];

    return createSuccessResponse({
      items: transformedTickets,
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
    const { businessId, subject, description, priority, category, contactId } = body;

    if (!businessId || !subject) {
      return createErrorResponse('Business ID and subject are required', 400);
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

    // Generate ticket number
    const timestamp = Math.floor(Date.now() / 1000);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const ticketNumber = `TKT-${timestamp}-${random}`;

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        business_id: businessId,
        ticket_number: ticketNumber,
        subject,
        description,
        priority: priority || 'medium',
        status: 'open',
        category,
        channel: 'web',
        created_by: user.id,
        contact_id: contactId,
      })
      .select(`
        id,
        ticket_number,
        subject,
        description,
        priority,
        status,
        category,
        channel,
        assigned_to,
        resolve_sla,
        resolved_at,
        resolution_notes,
        created_at,
        updated_at,
        created_by,
        contact:contacts!support_tickets_contact_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return createErrorResponse('Failed to create support ticket', 500);
    }

    // Transform data to match service interface
    const transformedTicket = {
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      category: ticket.category,
      channel: ticket.channel,
      assignedTo: ticket.assigned_to,
      resolveSla: ticket.resolve_sla,
      resolvedAt: ticket.resolved_at,
      resolutionNotes: ticket.resolution_notes,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      createdBy: ticket.created_by,
      contact: ticket.contact ? {
        id: Array.isArray(ticket.contact) ? ticket.contact[0].id : ticket.contact.id,
        firstName: Array.isArray(ticket.contact) ? ticket.contact[0].first_name : ticket.contact.first_name,
        lastName: Array.isArray(ticket.contact) ? ticket.contact[0].last_name : ticket.contact.last_name,
        email: Array.isArray(ticket.contact) ? ticket.contact[0].email : ticket.contact.email,
      } : undefined,
    };

    return createSuccessResponse(transformedTicket, undefined, undefined, 201);

  } catch (error) {
    return handleApiError(error);
  }
}