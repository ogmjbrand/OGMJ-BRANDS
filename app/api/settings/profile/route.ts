import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Get user profile data from auth.users
    const { data: profile, error } = await supabase.auth.admin.getUserById(user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: profile.user?.id,
          email: profile.user?.email,
          fullName: profile.user?.user_metadata?.full_name,
          avatarUrl: profile.user?.user_metadata?.avatar_url,
          phone: profile.user?.phone,
          emailConfirmed: profile.user?.email_confirmed_at ? true : false,
          createdAt: profile.user?.created_at,
          updatedAt: profile.user?.updated_at,
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

    // Update user metadata
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        full_name: fullName,
        avatar_url: avatarUrl,
      },
      phone: phone,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: data.user?.id,
          email: data.user?.email,
          fullName: data.user?.user_metadata?.full_name,
          avatarUrl: data.user?.user_metadata?.avatar_url,
          phone: data.user?.phone,
          emailConfirmed: data.user?.email_confirmed_at ? true : false,
          updatedAt: data.user?.updated_at,
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