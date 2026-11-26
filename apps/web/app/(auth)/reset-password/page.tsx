'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { validateNewPassword } from '@/lib/utils/password';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The recovery link signs the user in via /api/auth/callback before landing here.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user);
      setChecking(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateNewPassword(password, confirm);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || 'Could not update your password. Please request a new link.');
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      console.error('Password update error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <Image src="/brand/ogmj-mark.png" alt="OGMJ Brands" width={56} height={56} className="mx-auto h-14 w-14 rounded-2xl object-cover" priority />
        <h1 className="text-3xl font-bold text-white">Choose a new password</h1>
      </div>

      {checking ? (
        <p className="text-center text-sm text-white/60">Checking your reset link…</p>
      ) : !hasSession ? (
        <div role="alert" className="space-y-4 text-center">
          <p className="text-sm text-white/80">
            This reset link is invalid or has expired. Links work only once, and only in the browser where you requested them.
          </p>
          <Link href="/forgot-password" className="inline-block rounded-lg bg-[#C8FF00] px-5 py-2.5 font-semibold text-[#07070A] hover:bg-[#C8FF00]/90">
            Request a new link
          </Link>
        </div>
      ) : done ? (
        <div role="status" className="space-y-3 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-[#C8FF00]" />
          <p className="text-sm text-white">Your password has been updated. Taking you to your dashboard…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {[
            { id: 'new-password', label: 'New password', value: password, set: setPassword },
            { id: 'confirm-password', label: 'Confirm new password', value: confirm, set: setConfirm },
          ].map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className="mb-2 block text-sm font-medium text-white">{field.label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-[#C8FF00]/50" />
                <input
                  id={field.id}
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  className="w-full rounded-lg border border-[#C8FF00]/20 bg-[#07070A] py-2.5 pl-10 pr-4 text-white placeholder-[#C8FF00]/30 transition focus:border-[#C8FF00]/60 focus:outline-hidden"
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-white/50">At least 8 characters, including a letter and a number.</p>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#C8FF00] py-2.5 font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90 disabled:cursor-not-allowed disabled:bg-[#C8FF00]/50"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  );
}
