import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

// Canonical businesses columns -> the camelCase BusinessSettings shape the
// frontend service (lib/services/settings.service.ts) expects.
function transformBusiness(business: any) {
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    domain: business.domain,
    customDomain: business.custom_domain,
    logoUrl: business.logo_url,
    brandColor: business.brand_color,
    currency: business.currency,
    timezone: business.timezone,
    country: business.country,
    industry: business.industry,
    teamSize: business.team_size,
    phone: business.phone,
    metadata: business.metadata,
    createdAt: business.created_at,
    updatedAt: business.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Verify user has access to this business
    const { data: userAccess } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!userAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Business not found' },
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
        data: transformBusiness(data),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching business settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      industry,
      country,
      currency,
      timezone,
      teamSize,
      phone,
      brandColor,
      logoUrl,
      customDomain,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Business name required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Verify user has admin access to this business
    const { data: userRole } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!(userRole as any) || !['owner', 'admin'].includes((userRole as any).role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Slug stays stable across renames (generated once by the DB trigger);
    // undefined fields are dropped from the JSON payload, not clobbered.
    const { data, error } = await (supabase as any)
      .from('businesses')
      .update({
        name,
        industry,
        country,
        currency,
        timezone,
        team_size: teamSize,
        phone,
        brand_color: brandColor,
        logo_url: logoUrl,
        custom_domain: customDomain,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)
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
        data: transformBusiness(data),
        message: 'Business settings updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating business settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  // PATCH is same as PUT for business settings updates
  return PUT(request);
}

