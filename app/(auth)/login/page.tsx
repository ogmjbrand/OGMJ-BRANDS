'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { signIn, signInWithOAuth } from '@/lib/auth';
import { createBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🎯 Form submitted");

    const supabase = createBrowserClient();

    // Validate inputs
    if (!email || !password) {
      console.warn("⚠️ Email or password is empty");
      setError("Email and password are required");
      alert("Please enter both email and password");
      return;
    }

    try {
      console.log("🔍 Starting sign in...", { email });

      setError(null);
      setLoading(true);

      const result = await signIn(email, password);

      console.log("✅ SIGN IN RESULT:", result);

      if (result.error) {
        console.error("❌ SIGN IN ERROR:", result.error);
        setError(result.error);
        alert("Sign-in failed: " + result.error);
        return;
      }

      console.log("🎉 Sign in successful");
      alert("Sign in successful! Redirecting to dashboard...");

      // Small delay to allow session to be established
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verify session is set
      const { data: { session } } = await supabase.auth.getSession();
      console.log("🔐 [LOGIN] Session after sign in:", !!session, session?.user?.email);

      if (!session) {
        console.error("❌ [LOGIN] No session found after sign in!");
        setError("Sign in failed - no session created");
        alert("Sign in failed - please try again");
        setLoading(false);
        return;
      }

      console.log("🔐 [LOGIN] Redirecting to dashboard with valid session");
      // Use router.push instead of window.location to preserve session state
      router.push("/dashboard");
    } catch (err) {
      console.error("❌ UNEXPECTED ERROR:", err);
      const errorMsg = err instanceof Error ? err.message : "Login failed";
      setError(errorMsg);
      alert("Unexpected sign-in error: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    setOauthLoading(provider);
    setError(null);

    try {
      const result = await signInWithOAuth(provider);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth sign in failed');
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
        <p className="text-[#D4AF37]/70">Sign in to your OGMJ BRANDS account</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-[#D4AF37]/50" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]/60 transition"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-white">Password</label>
            <Link href="/forgot-password" className="text-xs text-[#D4AF37] hover:text-[#D4AF37]/80">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-[#D4AF37]/50" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]/60 transition"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 disabled:bg-[#D4AF37]/50 text-[#07070A] font-semibold py-2.5 rounded-lg transition disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#D4AF37]/10"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-[#0E1116] text-[#D4AF37]/50">or continue with</span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuthSignIn('google')}
          disabled={!!oauthLoading}
          className="bg-[#07070A] hover:bg-[#07070A]/80 disabled:bg-[#07070A]/50 border border-[#D4AF37]/20 text-white py-2.5 rounded-lg transition font-medium text-sm disabled:cursor-not-allowed flex items-center justify-center"
        >
          {oauthLoading === 'google' ? 'Connecting...' : 'Google'}
        </button>
        <button
          type="button"
          onClick={() => handleOAuthSignIn('github')}
          disabled={!!oauthLoading}
          className="bg-[#07070A] hover:bg-[#07070A]/80 disabled:bg-[#07070A]/50 border border-[#D4AF37]/20 text-white py-2.5 rounded-lg transition font-medium text-sm disabled:cursor-not-allowed flex items-center justify-center"
        >
          {oauthLoading === 'github' ? 'Connecting...' : 'GitHub'}
        </button>
      </div>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-[#D4AF37]/70">
        Don't have an account?{' '}
        <Link href="/signup" className="text-[#D4AF37] hover:text-[#D4AF37]/80 font-semibold">
          Sign up
        </Link>
      </p>
    </div>
  );
}
