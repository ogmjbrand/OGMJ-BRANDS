import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: businessId, invitationId } = await params;
    if (!businessId || !invitationId) {
      return NextResponse.json({ error: 'Business ID and invitation ID required' }, { status: 400 });
    }

    const supabase = await createServerClient();

    const { data: userRole } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!(userRole as any) || !['owner', 'admin'].includes((userRole as any).role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { error } = await (supabase as any)
      .from('invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId)
      .eq('business_id', businessId)
      .eq('status', 'pending');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Invitation revoked' }, { status: 200 });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
