import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = req.nextUrl.clone();

  // 🔒 Protected routes
  const protectedRoutes = ["/onboarding", "/dashboard", "/app"];

  const isProtected = protectedRoutes.some((route) =>
    url.pathname.startsWith(route)
  );

  // ❌ Not logged in → go to login
  if (!user && isProtected) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ✅ Logged in → prevent going back to login/signup
  if (user && (url.pathname === "/login" || url.pathname === "/signup")) {
    url.pathname = "/"; // 🔥 CHANGE THIS (safe route that exists)
    return NextResponse.redirect(url);
  }

  return res;
}

// ✅ VERY IMPORTANT (ensures middleware runs properly)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};