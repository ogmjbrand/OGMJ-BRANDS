/**
 * OGMJ BRANDS — Supabase Client Configuration
 * Last Updated: April 17, 2026
 */

import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// ================================
// BROWSER CLIENT
// ================================

export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          "x-client": "web",
        },
      },
    }
  );
}

// ================================
// SERVER CLIENT
// ================================

// Moved to server.ts to avoid next/headers import issues in client components

// ================================
// SERVICE ROLE CLIENT (Admin)
// ================================

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          "x-client": "admin",
        },
      },
    }
  );
}

// ================================
// EDGE FUNCTION CLIENT (Vercel Edge)
// ================================

export function createEdgeClient(authHeader?: string) {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          ...(authHeader && { Authorization: authHeader }),
          "x-client": "edge",
        },
      },
    }
  );
}

// ================================
// EXPORTS
// ================================

export type { Database };
