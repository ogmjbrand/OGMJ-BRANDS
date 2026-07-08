import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    // auth.admin requires the service-role key; use the session user plus
    // the canonical profiles row instead.
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url, phone, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullName: (profile as any)?.name ?? user.user_metadata?.full_name,
          avatarUrl: (profile as any)?.avatar_url ?? user.user_metadata?.avatar_url,
          phone: (profile as any)?.phone ?? user.phone,
          emailConfirmed: user.email_confirmed_at ? true : false,
          createdAt: user.created_at,
          updatedAt: (profile as any)?.updated_at ?? user.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user profile:', error);
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

    const body = await request.json();
    const { fullName, phone, avatarUrl } = body;

    const supabase = await createServerClient();

    // Update the user's own auth metadata (allowed with the session; the
    // admin API would require the service-role key).
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        avatar_url: avatarUrl,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Persist to the canonical profiles row (name/avatar/phone live there)
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .update({
        name: fullName,
        avatar_url: avatarUrl,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullName: profile?.name,
          avatarUrl: profile?.avatar_url,
          phone: profile?.phone,
          emailConfirmed: user.email_confirmed_at ? true : false,
          updatedAt: profile?.updated_at,
        },
        message: 'Profile updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  // PATCH is same as PUT for profile updates
  return PUT(request);
}

