'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
      });
      // Rate limits are worth telling the user about; every other outcome
      // gets the same message so the form can't reveal whether an account exists.
      if (resetError && resetError.status === 429) {
        setError('Too many reset requests. Please wait a few minutes and try again.');
        return;
      }
      if (resetError) console.error('Password reset request failed:', resetError.message);
      setSent(true);
    } catch (err) {
      console.error('Password reset request error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <Image src="/brand/ogmj-mark.png" alt="OGMJ Brands" width={56} height={56} className="mx-auto h-14 w-14 rounded-2xl object-cover" priority />
        <h1 className="text-3xl font-bold text-white">Reset your password</h1>
        <p className="text-[#C8FF00]/70">We&apos;ll email you a secure link to choose a new one</p>
      </div>

      {sent ? (
        <div role="status" className="space-y-4 rounded-lg border border-[#C8FF00]/20 bg-[#C8FF00]/5 p-5 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-[#C8FF00]" />
          <p className="text-sm text-white">
            If an account exists for <span className="font-semibold">{email.trim()}</span>, a reset link is on its way. Check your inbox and spam folder.
          </p>
          <p className="text-xs text-white/60">Open the link on this same device and browser. It expires after a short time.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <div>
            <label htmlFor="reset-email" className="mb-2 block text-sm font-medium text-white">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-[#C8FF00]/50" />
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#C8FF00]/20 bg-[#07070A] py-2.5 pl-10 pr-4 text-white placeholder-[#C8FF00]/30 transition focus:border-[#C8FF00]/60 focus:outline-hidden"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#C8FF00] py-2.5 font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90 disabled:cursor-not-allowed disabled:bg-[#C8FF00]/50"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-[#C8FF00]/70">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-[#C8FF00] hover:text-[#C8FF00]/80">Back to sign in</Link>
      </p>
    </div>
  );
}
