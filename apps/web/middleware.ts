import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
    return NextResponse.redirect(url)
  }

  if (path === '/auth/signup') {
    url.pathname = '/signup'
    return NextResponse.redirect(url)
  }

  // ── Auth routes: redirect logged-in users away ──────────────────────────────
  const authRoutes = ['/login', '/signup', '/auth']
  if (user && authRoutes.some(r => path.startsWith(r))) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // ── Protected routes: redirect guests to login ───────────────────────────────
  const protectedRoutes = ['/dashboard', '/onboarding', '/app']
  const isProtected = protectedRoutes.some(r => path.startsWith(r))

  if (!user && isProtected) {
    url.pathname = '/login'
    url.searchParams.set('redirectTo', path)
    return NextResponse.redirect(url)
  }

  // ── Onboarding gate: if user has no business, send to onboarding ─────────────
  // (only enforced when going to /dashboard, not /onboarding itself)
  // my_businesses covers both owned businesses and team memberships.
  if (user && path.startsWith('/dashboard')) {
    const { data: businesses } = await supabase
      .from('my_businesses')
      .select('id')
      .limit(1)

    if (!businesses || businesses.length === 0) {
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|css|js)$).*)'],
}




