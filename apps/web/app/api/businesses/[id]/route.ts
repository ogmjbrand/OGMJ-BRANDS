import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: businessId } = await params;
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

    // business_users FKs auth.users, which PostgREST cannot embed;
    // fetch profiles separately for member emails/names.
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        business_users (
          id,
          user_id,
          role,
          status,
          joined_at
        )
      `)
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

    const memberIds = ((data as any)?.business_users ?? [])
      .map((m: any) => m.user_id)
      .filter(Boolean);
    if (memberIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, name, avatar_url')
        .in('id', memberIds);
      const profilesById = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
      (data as any).business_users = (data as any).business_users.map((m: any) => ({
        ...m,
        profile: profilesById[m.user_id] ?? null,
      }));
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching business:', error);
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

    const { id: businessId } = await params;
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
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating business:', error);
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

    const { id: businessId } = await params;
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // Only include fields that are provided. Slug is not regenerated on
    // rename — it was made unique by the DB trigger and links depend on it.
    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.industry !== undefined) updateData.industry = body.industry;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.teamSize !== undefined) updateData.team_size = body.teamSize;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.brandColor !== undefined) updateData.brand_color = body.brandColor;
    if (body.logoUrl !== undefined) updateData.logo_url = body.logoUrl;
    if (body.customDomain !== undefined) updateData.custom_domain = body.customDomain;

    updateData.updated_at = new Date().toISOString();

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

    const { data, error } = await (supabase as any)
      .from('businesses')
      .update(updateData)
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
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating business:', error);
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

    const { id: businessId } = await params;
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
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

    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', businessId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Business deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting business:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}