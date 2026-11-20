import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/utils/safe-redirect';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('🔐 [AUTH CALLBACK] Received callback:', { code: !!code, error, errorDescription });

    if (error) {
      console.error('🔐 [AUTH CALLBACK] Error in callback:', error, errorDescription);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (code) {
      const supabase = await createServerClient();
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('🔐 [AUTH CALLBACK] Failed to exchange code for session:', exchangeError);
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Failed to confirm email')}`);
      }

      console.log('🔐 [AUTH CALLBACK] Session exchanged successfully:', !!data.session);

      // Default: new users go to onboarding. A password-recovery link passes
      // next=/reset-password. Only same-origin relative paths are honoured,
      // so the callback can't be used as an open redirect.
      const destination = safeNextPath(searchParams.get('next')) ?? '/onboarding';
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${destination}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${destination}`);
      } else {
        return NextResponse.redirect(`${origin}${destination}`);
      }
    }

    // No code or error, redirect to login
    return NextResponse.redirect(`${origin}/login`);
  } catch (error) {
    console.error('🔐 [AUTH CALLBACK] Unexpected error:', error);
    return NextResponse.redirect(`${new URL(request.url).origin}/login?error=Unexpected error`);
  }
}


