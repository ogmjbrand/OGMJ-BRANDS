import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: businessId, userId: targetUserId } = await params;
    if (!businessId || !targetUserId) {
      return NextResponse.json(
        { error: 'Business ID and User ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role } = body;

    // Must match the business_role enum; owner is assigned only by the DB
    if (!role || !['admin', 'manager', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Valid role required (admin, manager or member)' },
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

    // The owner's role cannot be changed through this endpoint
    const { data: targetMember } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    if ((targetMember as any).role === 'owner') {
      return NextResponse.json(
        { error: 'The business owner role cannot be changed' },
        { status: 400 }
      );
    }

    // Update business_members — the canonical membership table that RLS
    // checks; a trigger syncs business_users from it.
    const { data, error } = await (supabase as any)
      .from('business_members')
      .update({ role })
      .eq('business_id', businessId)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    await (supabase as any).from('activity_logs').insert({
      business_id: businessId,
      user_id: user.id,
      action: 'role_changed',
      entity_type: 'team_member',
      entity_id: targetUserId,
      metadata: { role },
    });

    return NextResponse.json(
      {
        success: true,
        data,
        message: 'Member role updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: businessId, userId: targetUserId } = await params;
    if (!businessId || !targetUserId) {
      return NextResponse.json(
        { error: 'Business ID and User ID required' },
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

    // The owner cannot be removed from their own business
    const { data: targetMember } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    if ((targetMember as any).role === 'owner') {
      return NextResponse.json(
        { error: 'The business owner cannot be removed' },
        { status: 400 }
      );
    }

    // Delete from business_members — the canonical membership table that RLS
    // checks; the sync trigger marks business_users inactive.
    const { error } = await supabase
      .from('business_members')
      .delete()
      .eq('business_id', businessId)
      .eq('user_id', targetUserId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    await (supabase as any).from('activity_logs').insert({
      business_id: businessId,
      user_id: user.id,
      action: 'removed',
      entity_type: 'team_member',
      entity_id: targetUserId,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Member removed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}