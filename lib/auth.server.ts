/**
 * OGMJ BRANDS — Server-Side Authentication Service
 * This file should only be imported in server-side code
 * Last Updated: April 20, 2026
 */

import { createServerClient } from "./supabase/server";
import type { User } from "@supabase/supabase-js";

// ================================
// GET CURRENT USER (SERVER SIDE)
// ================================

export async function getCurrentUserServer(): Promise<User | null> {
  try {
    const supabase = await createServerClient();
    
    console.log("🔐 [SERVER AUTH] Getting current user from server client...");
    
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("🔐 [SERVER AUTH] Error getting user:", error);
      return null;
    }

    if (!data.user) {
      console.warn("🔐 [SERVER AUTH] No user found in session");
      return null;
    }

    console.log("🔐 [SERVER AUTH] User found:", data.user.email);
    return data.user;
  } catch (error) {
    console.error("🔐 [SERVER AUTH] Unexpected error getting current user:", error);
    return null;
  }
}
