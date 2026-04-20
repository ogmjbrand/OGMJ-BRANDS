import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/auth';

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

    const result = await verifyEmail(token, type as 'signup' | 'recovery');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
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