import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer } from '@/lib/auth.server';

export async function GET() {
  try {
    const user = await getCurrentUserServer();

    if (!user) {
      console.warn("🔐 [API] GET /businesses - Unauthorized: No user");
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('created_by', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error listing businesses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 [API] POST /businesses - Creating business...");
    
    const user = await getCurrentUserServer();

    if (!user) {
      console.warn("🔐 [API] POST /businesses - Unauthorized: No user found");
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`🔐 [API] POST /businesses - User authenticated: ${user.email} (${user.id})`);

    const body = await request.json();
    const { name, industry, country, currency = 'USD', timezone = 'UTC' } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Business name required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);

    console.log(`🔐 [API] Inserting business: ${name} (slug: ${slug}, user_id: ${user.id})`);

    const { data, error } = await (supabase as any)
      .from('businesses')
      .insert({
        name,
        slug,
        industry,
        country,
        currency,
        timezone,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ [API] Business insert error:`, error);
      return NextResponse.json(
        { error: error.message || 'Failed to create business' },
        { status: 400 }
      );
    }

    console.log(`✅ [API] Business created: ${data.id}`);

    // Add creator as admin to business_users
    const { error: buError } = await (supabase as any)
      .from('business_users')
      .insert({
        business_id: data.id,
        user_id: user.id,
        role: 'admin',
        status: 'active',
      });

    if (buError) {
      console.error(`❌ [API] Error adding user to business:`, buError);
      // This error is not critical - the business was created
    }

    console.log(`✅ [API] POST /businesses successful`);
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [API] Unexpected error creating business:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}