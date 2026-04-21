import { createServerClientMiddleware } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log(`🔐 [MIDDLEWARE] Request to ${pathname}`);

  // Create a response object to mutate
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client configured to use cookies from REQUEST and write to RESPONSE
  const supabase = await createServerClientMiddleware(request, response);

  // Refresh session if expired - required for Server Components
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error(`🔐 [MIDDLEWARE] Error getting session:`, error);
  }

  console.log(`🔐 [MIDDLEWARE] Session found:`, !!session, session?.user?.email || 'no-email');

  // If no session, try to refresh from URL params (for OAuth/callback)
  if (!session) {
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.getSession();
    if (refreshedSession) {
      console.log("🔐 [MIDDLEWARE] Session refreshed from URL");
    } else if (refreshError) {
      console.error("🔐 [MIDDLEWARE] Error refreshing session:", refreshError);
    }
  }

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/crm') ||
      request.nextUrl.pathname.startsWith('/builder') ||
      request.nextUrl.pathname.startsWith('/settings') ||
      request.nextUrl.pathname.startsWith('/videos') ||
      request.nextUrl.pathname.startsWith('/support')) {

    if (!session) {
      console.warn(`🔐 [MIDDLEWARE] No session for protected route ${pathname}, redirecting to login`);
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    console.log(`🔐 [MIDDLEWARE] Allowing authenticated user to ${pathname}`);
  }

  // Redirect authenticated users away from auth pages
  if ((request.nextUrl.pathname.startsWith('/login') ||
       request.nextUrl.pathname.startsWith('/signup') ||
       request.nextUrl.pathname.startsWith('/forgot-password')) &&
      session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect root to dashboard if authenticated, otherwise to login
  if (request.nextUrl.pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};