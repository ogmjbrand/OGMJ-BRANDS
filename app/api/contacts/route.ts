import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

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
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId);

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    if (status) {
      query = query.eq('status', status);
    }

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
    console.error('Error fetching contacts:', error);
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
      firstName,
      lastName,
      email,
      phone,
      companyName,
      jobTitle,
      source,
      tags,
    } = body;

    if (!businessId || !email) {
      return NextResponse.json(
        { error: 'Business ID and email required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const { data, error } = await (supabase as any)
      .from('contacts')
      .insert({
        business_id: businessId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        company_name: companyName,
        job_title: jobTitle,
        source: source || 'manual',
        tags: tags || [],
        status: 'lead',
        lead_score: 0,
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
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
