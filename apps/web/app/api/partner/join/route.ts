import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer as getCurrentUser } from '@/lib/auth.server';
import crypto from 'crypto';

function generateCode() {
  return crypto.randomBytes(5).toString('hex').toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    const { data: program, error: programError } = await supabase
      .from('referral_programs')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    if (programError || !program) {
      return NextResponse.json({ error: 'No active partner program' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('referrals')
      .select('id, code')
      .eq('program_id', (program as any).id)
      .eq('referrer_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, data: existing, message: 'Already enrolled' }, { status: 200 });
    }

    // Retry a handful of times on the rare code collision (unique constraint).
    let lastError: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const { data, error } = await (supabase as any)
        .from('referrals')
        .insert({
          program_id: (program as any).id,
          referrer_id: user.id,
          code,
        })
        .select('id, code')
        .single();

      if (!error) {
        return NextResponse.json({ success: true, data, message: 'Joined the partner program' }, { status: 201 });
      }

      lastError = error;
      if (error.code !== '23505') break;
    }

    return NextResponse.json({ error: lastError?.message || 'Failed to join partner program' }, { status: 400 });
  } catch (error) {
    console.error('Error joining partner program:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
