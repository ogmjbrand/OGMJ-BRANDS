import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse, handleApiError, validateUUID } from '@/lib/utils/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { id: contactId } = await params;
    validateUUID(contactId, 'Contact ID');

    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Contact not found', 404);
      }
      return createErrorResponse(error.message, 400);
    }

    return createSuccessResponse(data);
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contactId } = await params;
    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      companyName,
      jobTitle,
      status,
      leadScore,
      source,
      tags,
      lastContactAt,
      nextFollowupAt,
    } = body;

    const supabase = await createServerClient();

    // Verify contact exists and belongs to user's business
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('business_id')
      .eq('id', contactId)
      .single();

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    const { data, error } = await (supabase as any)
      .from('contacts')
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        company_name: companyName,
        job_title: jobTitle,
        status,
        lead_score: leadScore,
        source,
        tags,
        last_contact_at: lastContactAt,
        next_followup_at: nextFollowupAt,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contactId } = await params;
    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // Only include fields that are provided
    if (body.firstName !== undefined) updateData.first_name = body.firstName;
    if (body.lastName !== undefined) updateData.last_name = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.companyName !== undefined) updateData.company_name = body.companyName;
    if (body.jobTitle !== undefined) updateData.job_title = body.jobTitle;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.leadScore !== undefined) updateData.lead_score = body.leadScore;
    if (body.source !== undefined) updateData.source = body.source;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.lastContactAt !== undefined) updateData.last_contact_at = body.lastContactAt;
    if (body.nextFollowupAt !== undefined) updateData.next_followup_at = body.nextFollowupAt;

    updateData.updated_by = user.id;
    updateData.updated_at = new Date().toISOString();

    const supabase = await createServerClient();

    // Verify contact exists and belongs to user's business
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('business_id')
      .eq('id', contactId)
      .single();

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    const { data, error } = await (supabase as any)
      .from('contacts')
      .update(updateData)
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contactId } = await params;
    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Verify contact exists and belongs to user's business
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('business_id')
      .eq('id', contactId)
      .single();

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Contact deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}