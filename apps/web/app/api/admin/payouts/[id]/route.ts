import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

const ALLOWED_STATUSES = ['processing', 'paid', 'rejected'];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = await createServerClient();

    const { data: adminStatus } = await supabase.rpc('get_platform_admin_status');
    if (!(adminStatus as any)?.isCurrentUserAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data, error } = await (supabase as any)
      .from('payout_requests')
      .update({
        status,
        notes: notes || null,
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data, message: 'Payout updated' }, { status: 200 });
  } catch (error) {
    console.error('Error updating payout request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
