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
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    const supabase = await createServerClient();

    const { data: userAccess } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!userAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const limitParam = Number(request.nextUrl.searchParams.get('limit')) || 30;
    const limit = Math.min(Math.max(limitParam, 1), 100);

    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, user_id, action, entity_type, entity_id, entity_name, metadata, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // activity_logs FKs auth.users, which PostgREST cannot embed; fetch
    // actor profiles separately, same pattern as the members endpoint.
    const actorIds = Array.from(new Set((data ?? []).map((entry: any) => entry.user_id).filter(Boolean)));
    let profilesById: Record<string, any> = {};
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, name, avatar_url')
        .in('id', actorIds);
      profilesById = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
    }

    const activity = (data ?? []).map((entry: any) => ({
      ...entry,
      actor: profilesById[entry.user_id] ?? null,
    }));

    return NextResponse.json({ success: true, data: activity }, { status: 200 });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
