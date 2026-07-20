import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { token, type } = await request.json();

    if (!token || !type) {
      return NextResponse.json(
        { error: 'Token and type are required' },
        { status: 400 }
      );
    }

    if (!['signup', 'recovery'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid verification type' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'signup' | 'recovery',
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


