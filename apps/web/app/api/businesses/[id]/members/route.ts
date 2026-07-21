import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import { getResendClient, isResendConfigured, RESEND_FROM_EMAIL } from '@/lib/email/resend';

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
      .from('business_users')
      .select('id, user_id, role, status, invited_at, joined_at, invited_by')
      .eq('business_id', businessId)
      .order('joined_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const memberIds = (data ?? []).map((m: any) => m.user_id).filter(Boolean);
    let profilesById: Record<string, any> = {};
    if (memberIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, name, avatar_url')
        .in('id', memberIds);
      profilesById = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
    }

    const members = (data ?? []).map((m: any) => ({
      ...m,
      profile: profilesById[m.user_id] ?? null,
    }));

    return NextResponse.json(
      {
        success: true,
        data: members,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { email, role = 'member' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    // Must match the business_role enum (owner is never invited)
    if (!['admin', 'manager', 'member'].includes(role)) {
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

    // Check if there's already a pending invitation for this email
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id, status')
      .eq('business_id', businessId)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      );
    }

    // Create invitation (we'll handle user registration separately)
    const token = crypto.randomUUID();

    const { data, error } = await (supabase as any)
      .from('invitations')
      .insert({
        business_id: businessId,
        email,
        role,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        invited_by: user.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (isResendConfigured()) {
      try {
        const { data: business } = await supabase.from('businesses').select('name').eq('id', businessId).single();
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '');
        const inviteUrl = `${appUrl}/invite/${token}`;
        const businessName = (business as any)?.name || 'a business on OGMJ BRANDS';

        await getResendClient().emails.send({
          from: RESEND_FROM_EMAIL,
          to: email,
          subject: `You've been invited to join ${businessName} on OGMJ BRANDS`,
          html: `<p>You've been invited to join <strong>${businessName}</strong> as a ${role} on OGMJ BRANDS.</p><p><a href="${inviteUrl}">Accept invitation</a></p><p>This link expires in 7 days.</p>`,
        });
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
      }
    }

    await (supabase as any).from('activity_logs').insert({
      business_id: businessId,
      user_id: user.id,
      action: 'invited',
      entity_type: 'team_member',
      entity_id: (data as any)?.id ?? null,
      entity_name: email,
      metadata: { role },
    });

    return NextResponse.json(
      {
        success: true,
        data,
        message: 'Invitation sent successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error inviting member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}