import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, message, recipientFilter } = body;

    const supabase = await createServerClient();

    const { data: existing } = await supabase.from('whatsapp_campaigns').select('status, business_id').eq('id', id).single();
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    if ((existing as any).status !== 'draft') {
      return NextResponse.json({ error: 'Only draft campaigns can be edited' }, { status: 400 });
    }

    // RLS already scopes whatsapp_campaigns to is_business_member(), but
    // check explicitly too -- consistent with every other route here,
    // and it turns a silent RLS-filtered no-op into an honest 403
    // instead of a misleading "not found" for a campaign that does
    // exist, just not in a business this user belongs to.
    const { data: membership } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', (existing as any).business_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (message !== undefined) updates.message = message;
    if (recipientFilter !== undefined) updates.recipient_filter = recipientFilter;

    const { data, error } = await (supabase as any)
      .from('whatsapp_campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error updating WhatsApp campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createServerClient();

    const { data: existing } = await supabase.from('whatsapp_campaigns').select('status, business_id').eq('id', id).single();
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('business_users')
      .select('role')
      .eq('business_id', (existing as any).business_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if ((existing as any).status !== 'draft') {
      return NextResponse.json({ error: 'Only draft campaigns can be deleted' }, { status: 400 });
    }

    const { error } = await supabase.from('whatsapp_campaigns').delete().eq('id', id).eq('status', 'draft');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting WhatsApp campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
