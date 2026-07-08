import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: dealId } = await params;
    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        contacts (
          id,
          first_name,
          last_name,
          email,
          company_name
        )
      `)
      .eq('id', dealId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Deal not found' },
          { status: 404 }
        );
      }
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
    console.error('Error fetching deal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    const { id: dealId } = await params;
    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      value,
      currency,
      stage,
      probability,
      expectedCloseDate,
      closedAt,
    } = body;

    const supabase = await createServerClient();

    // Verify deal exists and belongs to user's business
    const { data: existingDeal } = await supabase
      .from('deals')
      .select('business_id')
      .eq('id', dealId)
      .single();

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    const { data, error } = await (supabase as any)
      .from('deals')
      .update({
        title,
        description,
        value,
        currency: currency || 'USD',
        stage,
        probability,
        expected_close_date: expectedCloseDate,
        closed_at: closedAt,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId)
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
    console.error('Error updating deal:', error);
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

    const { id: dealId } = await params;
    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // Only include fields that are provided
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.value !== undefined) updateData.value = body.value;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.stage !== undefined) updateData.stage = body.stage;
    if (body.probability !== undefined) updateData.probability = body.probability;
    if (body.expectedCloseDate !== undefined) updateData.expected_close_date = body.expectedCloseDate;
    if (body.closedAt !== undefined) updateData.closed_at = body.closedAt;

    updateData.updated_by = user.id;
    updateData.updated_at = new Date().toISOString();

    const supabase = await createServerClient();

    // Verify deal exists and belongs to user's business
    const { data: existingDeal } = await supabase
      .from('deals')
      .select('business_id')
      .eq('id', dealId)
      .single();

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    const { data, error } = await (supabase as any)
      .from('deals')
      .update(updateData)
      .eq('id', dealId)
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
    console.error('Error updating deal:', error);
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

    const { id: dealId } = await params;
    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Verify deal exists and belongs to user's business
    const { data: existingDeal } = await supabase
      .from('deals')
      .select('business_id')
      .eq('id', dealId)
      .single();

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', dealId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Deal deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}