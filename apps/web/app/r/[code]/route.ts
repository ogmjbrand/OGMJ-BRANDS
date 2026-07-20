import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';

const REFERRAL_COOKIE = 'ogmj_ref';
const DEFAULT_COOKIE_DAYS = 30;

function hashIp(ip: string | null) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex');
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  const response = NextResponse.redirect(new URL('/', appUrl));

  try {
    const supabase = await createServerClient();

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip');

    const { data, error } = await supabase.rpc('record_referral_click', {
      p_code: code,
      p_referrer_url: request.headers.get('referer') || null,
      p_landing_url: `${appUrl}/`,
      p_ip_hash: hashIp(ip),
      p_user_agent: request.headers.get('user-agent') || null,
    });

    if (!error && (data as any)?.success && (data as any)?.click_id) {
      response.cookies.set(REFERRAL_COOKIE, (data as any).click_id, {
        maxAge: DEFAULT_COOKIE_DAYS * 24 * 60 * 60,
        path: '/',
        sameSite: 'lax',
      });
    }
  } catch (error) {
    console.error('Referral click tracking failed:', error);
  }

  return response;
}
