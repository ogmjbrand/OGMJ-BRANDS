import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// A session refresh (supabase.auth.getUser()) writes its rotated cookies
// only onto `res`. Every redirect below returns a brand-new NextResponse,
// so those cookies must be copied over explicitly or they're silently
// dropped -- leaving the browser holding stale tokens.
function redirectWithSessionCookies(url: URL, sessionResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url)
  for (const cookie of sessionResponse.cookies.getAll()) {
    redirectResponse.cookies.set(cookie)
  }
  return redirectResponse
}

export async function middleware(req: NextRequest) {
  let res = NextResponse.next()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Allow local preview and build without Supabase config.
    return res
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get:    (name: string) => req.cookies.get(name)?.value,
        set:    (name: string, value: string, options: any) => { res.cookies.set({ name, value, ...options }) },
        remove: (name: string, options: any)        => { res.cookies.set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = req.nextUrl.clone()
  const path = url.pathname

  // ── Legacy auth redirects: support /auth/login and /auth/signup ─────────────
  if (path === '/auth/login') {
    url.pathname = '/login'
    return redirectWithSessionCookies(url, res)
  }

  if (path === '/auth/signup') {
    url.pathname = '/signup'
    return redirectWithSessionCookies(url, res)
  }

  // ── Auth routes: redirect logged-in users away ──────────────────────────────
  const authRoutes = ['/login', '/signup', '/auth']
  if (user && authRoutes.some(r => path.startsWith(r))) {
    url.pathname = '/dashboard'
    return redirectWithSessionCookies(url, res)
  }

  // ── Protected routes: redirect guests to login ───────────────────────────────
  const protectedRoutes = ['/dashboard', '/onboarding', '/app']
  const isProtected = protectedRoutes.some(r => path.startsWith(r))

  if (!user && isProtected) {
    url.pathname = '/login'
    url.searchParams.set('redirectTo', path)
    return redirectWithSessionCookies(url, res)
  }

  // ── Onboarding gate: if user has no business, send to onboarding ─────────────
  // (only enforced when going to /dashboard, not /onboarding itself)
  // my_businesses covers both owned businesses and team memberships.
  if (user && path.startsWith('/dashboard')) {
    const { data: businesses, error: businessesError } = await supabase
      .from('my_businesses')
      .select('id')
      .limit(1)

    // A query/RLS error is not proof the user has no business -- on the
    // real happy path they do. Treating it as "no business" would throw a
    // legitimate user into an onboarding redirect loop. This gate is a UX
    // nudge, not a security boundary (protected routes above already
    // reject unauthenticated requests), so fail open: let the request
    // through rather than guess wrong.
    if (businessesError) {
      console.error('middleware: my_businesses lookup failed, skipping onboarding gate', businessesError.message)
      return res
    }

    if (!businesses || businesses.length === 0) {
      url.pathname = '/onboarding'
      return redirectWithSessionCookies(url, res)
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|css|js)$).*)'],
}
