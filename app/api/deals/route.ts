import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const stage = searchParams.get('stage');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    let query = supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId);

    if (status) query = query.eq('status', status);
    if (stage) query = query.eq('stage', stage);

    const offset = (page - 1) * pageSize;
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        data: {
          items: data,
          total: count,
          page,
          pageSize,
          hasNextPage: (count || 0) > offset + pageSize,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessId,
      contactId,
      title,
      value,
      currency,
      stage = 'prospecting',
      expectedCloseDate,
      description,
    } = body;

    if (!businessId || !contactId || !title || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // pipeline_id and stage_id are NOT NULL in the canonical schema;
    // resolve the business's default pipeline and its first stage.
    const { data: pipeline } = await supabase
      .from('pipelines')
      .select('id')
      .eq('business_id', businessId)
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!pipeline) {
      return NextResponse.json(
        { error: 'No pipeline exists for this business' },
        { status: 400 }
      );
    }

    const { data: firstStage } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('pipeline_id', (pipeline as any).id)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!firstStage) {
      return NextResponse.json(
        { error: 'The pipeline has no stages' },
        { status: 400 }
      );
    }

    const { data, error } = await (supabase as any)
      .from('deals')
      .insert({
        business_id: businessId,
        contact_id: contactId,
        title,
        value,
        currency: currency || 'USD',
        stage,
        pipeline_id: (pipeline as any).id,
        stage_id: (firstStage as any).id,
        status: 'open',
        probability: 25,
        expected_close_date: expectedCloseDate,
        created_by: user.id,
      })
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
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



