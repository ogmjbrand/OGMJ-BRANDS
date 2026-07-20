import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const category = request.nextUrl.searchParams.get('category');

    let query = supabase
      .from('marketplace_listings')
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error('Error listing marketplace listings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
