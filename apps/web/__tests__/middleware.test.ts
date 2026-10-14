import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Regression tests for two bugs in the root middleware:
 *
 * 1. Every redirect branch returned a brand-new NextResponse, which
 *    does not carry the session cookies Supabase's getUser() writes
 *    onto the `res` object when it refreshes a token. Right after
 *    login/signup, or whenever a refresh coincides with a redirect,
 *    the browser kept stale tokens.
 * 2. The onboarding gate's `my_businesses` query discarded its error,
 *    so a transient DB/RLS error looked identical to "user has no
 *    business" and sent a legitimate user into an onboarding loop.
 */

let currentUser: { id: string } | null = null;
let businessesResult: { data: any; error: any } = { data: [{ id: 'biz-1' }], error: null };
const rotatedCookie = { name: 'sb-access-token', value: 'rotated-token-value' };

vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, options: any) => ({
    auth: {
      getUser: async () => {
        // Simulate Supabase rotating the session cookie during getUser(),
        // exactly as the real SDK does on a token refresh.
        options.cookies.set(rotatedCookie.name, rotatedCookie.value, { path: '/' });
        return { data: { user: currentUser } };
      },
    },
    from: () => ({
      select: () => ({
        limit: async () => businessesResult,
      }),
    }),
  }),
}));

function makeRequest(path: string) {
  return new NextRequest(`https://ogmjbrands.com${path}`);
}

describe('middleware', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    currentUser = null;
    businessesResult = { data: [{ id: 'biz-1' }], error: null };
  });

  it('passes requests through untouched when Supabase env vars are unset', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { middleware } = await import('@/middleware');
    const res = await middleware(makeRequest('/dashboard'));
    expect(res.status).toBe(200);
  });

  it('REGRESSION FIX: a rotated session cookie survives the legacy /auth/login redirect', async () => {
    const { middleware } = await import('@/middleware');
    const res = await middleware(makeRequest('/auth/login'));
    expect(res.headers.get('location')).toContain('/login');
    expect(res.cookies.get(rotatedCookie.name)?.value).toBe(rotatedCookie.value);
  });

  it('REGRESSION FIX: a rotated session cookie survives the guest-redirect-to-login', async () => {
    currentUser = null;
    const { middleware } = await import('@/middleware');
    const res = await middleware(makeRequest('/dashboard'));
    expect(res.headers.get('location')).toContain('/login');
    expect(res.cookies.get(rotatedCookie.name)?.value).toBe(rotatedCookie.value);
  });

  it('REGRESSION FIX: a rotated session cookie survives the logged-in-user-hits-/login redirect', async () => {
    currentUser = { id: 'user-1' };
    const { middleware } = await import('@/middleware');
    const res = await middleware(makeRequest('/login'));
    expect(res.headers.get('location')).toContain('/dashboard');
    expect(res.cookies.get(rotatedCookie.name)?.value).toBe(rotatedCookie.value);
  });

  it('REGRESSION FIX: a rotated session cookie survives the onboarding redirect', async () => {
    currentUser = { id: 'user-1' };
    businessesResult = { data: [], error: null };
    const { middleware } = await import('@/middleware');
    const res = await middleware(makeRequest('/dashboard'));
    expect(res.headers.get('location')).toContain('/onboarding');
    expect(res.cookies.get(rotatedCookie.name)?.value).toBe(rotatedCookie.value);
  });

  it('REGRESSION FIX: a my_businesses query error does not force a legitimate user into onboarding', async () => {
    currentUser = { id: 'user-1' };
    businessesResult = { data: null, error: { message: 'connection reset' } };
    const { middleware } = await import('@/middleware');
    const res = await middleware(makeRequest('/dashboard'));
    // Must NOT redirect to /onboarding on a query error.
    expect(res.headers.get('location')).toBeNull();
    expect(res.status).toBe(200);
  });

  it('lets a logged-in user with a business through to /dashboard', async () => {
    currentUser = { id: 'user-1' };
    businessesResult = { data: [{ id: 'biz-1' }], error: null };
    const { middleware } = await import('@/middleware');
    const res = await middleware(makeRequest('/dashboard'));
    expect(res.headers.get('location')).toBeNull();
    expect(res.status).toBe(200);
  });
});
