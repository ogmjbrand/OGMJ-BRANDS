import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    const { data: status } = await supabase.rpc('get_platform_admin_status');
    if (!(status as any)?.isCurrentUserAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // RLS also restricts payout_requests SELECT to admins for rows the
    // caller doesn't own, so this only ever returns everything for a
    // confirmed admin — the explicit check above is just a clean 403.
    const { data, error } = await supabase
      .from('payout_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error('Error listing admin payout requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
