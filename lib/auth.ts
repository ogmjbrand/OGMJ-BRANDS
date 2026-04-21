/**
 * OGMJ BRANDS — Authentication Service
 * Last Updated: April 17, 2026
 */

import { createBrowserClient } from "./supabase/client";
import type { AuthResponse, Session, User } from "@supabase/supabase-js";

// ================================
// SIGN UP
// ================================

export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<{
  user: User | null;
  session: Session | null;
  error: string | null;
}> {
  try {
    const supabase = createBrowserClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error.message : "Signup failed",
    };
  }
}

// ================================
// SIGN IN
// ================================

export async function signIn(
  email: string,
  password: string
): Promise<{
  user: User | null;
  session: Session | null;
  error: string | null;
}> {
  try {
    console.log("🔐 [AUTH] Starting Supabase signInWithPassword...", { email });

    const supabase = createBrowserClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("🔐 [AUTH] Supabase response:", { data, error });

    if (error) {
      console.error("🔐 [AUTH] Supabase error:", error);
      return { user: null, session: null, error: error.message };
    }

    console.log("🔐 [AUTH] Sign in successful, user:", data.user?.email);
    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (error) {
    console.error("🔐 [AUTH] Caught exception:", error);
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error.message : "Sign in failed",
    };
  }
}

// ================================
// SIGN IN WITH OAUTH
// ================================

export async function signInWithOAuth(provider: "github" | "google") {
  try {
    const supabase = createBrowserClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      return { url: null, error: error.message };
    }

    return { url: data?.url, error: null };
  } catch (error) {
    return {
      url: null,
      error: error instanceof Error ? error.message : "OAuth sign in failed",
    };
  }
}

// ================================
// SIGN OUT
// ================================

export async function signOut(): Promise<{
  error: string | null;
}> {
  try {
    const supabase = createBrowserClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Sign out failed",
    };
  }
}

// ================================
// GET CURRENT USER
// ================================

export async function getCurrentUser() {
  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// ================================
// GET CURRENT SESSION
// ================================

export async function getCurrentSession() {
  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return null;
    }

    return data.session;
  } catch (error) {
    console.error("Error getting current session:", error);
    return null;
  }
}

// ================================
// PASSWORD RESET
// ================================

export async function resetPassword(email: string): Promise<{
  error: string | null;
}> {
  try {
    const supabase = createBrowserClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Password reset failed",
    };
  }
}

// ================================
// UPDATE PASSWORD
// ================================

export async function updatePassword(newPassword: string): Promise<{
  error: string | null;
}> {
  try {
    const supabase = createBrowserClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Password update failed",
    };
  }
}

// ================================
// VERIFY EMAIL
// ================================

export async function verifyEmail(token: string, type: "signup" | "recovery") {
  try {
    const supabase = createBrowserClient();

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

// ================================
// EXPORTS
// ================================

export type { User, Session };
