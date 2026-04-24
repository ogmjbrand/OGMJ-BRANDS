import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get:    (name) => req.cookies.get(name)?.value,
        set:    (name, value, options) => { res.cookies.set({ name, value, ...options }) },
        remove: (name, options)        => { res.cookies.set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = req.nextUrl.clone()
  const path = url.pathname

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
    url.pathname = '/auth'
    url.searchParams.set('redirectTo', path)
    return NextResponse.redirect(url)
  }

  // ── Onboarding gate: if user has no business, send to onboarding ─────────────
  // (only enforced when going to /dashboard, not /onboarding itself)
  if (user && path.startsWith('/dashboard')) {
    const { data: business } = await supabase
      .from('businesses')
      .select('id, onboarding_completed')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!business) {
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|css|js)$).*)'],
}
