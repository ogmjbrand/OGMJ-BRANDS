import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

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

    if (!role || !['admin', 'editor', 'manager', 'viewer', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Valid role required' },
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

    if (!(userRole as any) || (userRole as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Cannot change your own role if you're the only admin
    if (targetUserId === user.id) {
      const { count: adminCount } = await supabase
        .from('business_users')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('role', 'admin')
        .eq('status', 'active');

      if (adminCount && adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot change role. You are the only admin.' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await (supabase as any)
      .from('business_users')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
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

    if (!(userRole as any) || (userRole as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Cannot remove yourself if you're the only admin
    if (targetUserId === user.id) {
      const { count: adminCount } = await supabase
        .from('business_users')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('role', 'admin')
        .eq('status', 'active');

      if (adminCount && adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove yourself. You are the only admin.' },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase
      .from('business_users')
      .delete()
      .eq('business_id', businessId)
      .eq('user_id', targetUserId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

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