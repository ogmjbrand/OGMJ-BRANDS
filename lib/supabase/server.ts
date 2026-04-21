import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Database } from "./database.types";
import type { NextRequest, NextResponse } from "next/server";

// ================================
// SERVER CLIENT (with cookie persistence)
// ================================

export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

// ================================
// MIDDLEWARE SERVER CLIENT (reads from request, writes to response)
// ================================

export async function createServerClientMiddleware(
  request: NextRequest,
  response: NextResponse
) {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Read from incoming request
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Write to response
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          // Remove from response
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );
}

// ================================
// SERVICE ROLE CLIENT (Admin - for API routes)
// ================================

export function createServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}
