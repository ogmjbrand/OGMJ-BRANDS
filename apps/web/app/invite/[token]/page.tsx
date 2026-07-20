'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getInvitationPreview, acceptInvitation, type InvitationPreview } from '@/lib/services/team.service';

type Status = 'loading' | 'needs-auth' | 'ready' | 'accepting' | 'accepted' | 'invalid' | 'error';

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;

  const [status, setStatus] = useState<Status>('loading');
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser();
      if (!user) {
        setStatus('needs-auth');
        return;
      }

      const preview = await getInvitationPreview(token);
      setInvitation(preview);

      if (preview && preview.status !== 'pending') {
        setStatus('invalid');
        return;
      }

      setStatus('ready');
    }
    init();
  }, [token]);

  async function handleAccept() {
    setStatus('accepting');
    setError(null);
    const result = await acceptInvitation(token);
    if (result.success) {
      setStatus('accepted');
      setTimeout(() => router.push('/dashboard'), 1500);
    } else {
      setError(result.error || 'This invitation could not be accepted');
      setStatus('invalid');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070A] px-4">
      <div className="w-full max-w-md space-y-6 rounded-[2rem] border border-[#C8FF00]/10 bg-[#0E1116]/90 p-8 text-center shadow-2xl shadow-black/40">
        <Image
          src="/brand/ogmj-mark.png"
          alt="OGMJ Brands"
          width={56}
          height={56}
          className="mx-auto h-14 w-14 rounded-2xl object-cover"
          priority
        />

        {status === 'loading' && (
          <div className="space-y-3">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#C8FF00]" />
            <p className="text-sm text-[#F8F9FA]/60">Checking your invitation…</p>
          </div>
        )}

        {status === 'needs-auth' && (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-white">You've been invited to OGMJ BRANDS</h1>
            <p className="text-sm text-[#F8F9FA]/60">Sign in or create an account to accept this invitation.</p>
            <div className="flex flex-col gap-3">
              <Link
                href={`/login?redirectTo=${encodeURIComponent(`/invite/${token}`)}`}
                className="rounded-xl bg-[#C8FF00] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#B8EF00]"
              >
                Sign in
              </Link>
              <Link
                href={`/signup?redirectTo=${encodeURIComponent(`/invite/${token}`)}`}
                className="rounded-xl border border-[#C8FF00]/20 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Create an account
              </Link>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-white">You've been invited to join a team</h1>
            {invitation ? (
              <p className="text-sm text-[#F8F9FA]/60">
                Join as <span className="font-medium capitalize text-[#C8FF00]">{invitation.role}</span>
              </p>
            ) : (
              <p className="text-sm text-[#F8F9FA]/60">Accept below to join the team.</p>
            )}
            <button
              type="button"
              onClick={handleAccept}
              className="w-full rounded-xl bg-[#C8FF00] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#B8EF00]"
            >
              Accept invitation
            </button>
          </div>
        )}

        {status === 'accepting' && (
          <div className="space-y-3">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#C8FF00]" />
            <p className="text-sm text-[#F8F9FA]/60">Joining the team…</p>
          </div>
        )}

        {status === 'accepted' && (
          <div className="space-y-3">
            <CheckCircle2 className="mx-auto h-8 w-8 text-[#10B981]" />
            <p className="text-sm text-white">You're in. Redirecting to your dashboard…</p>
          </div>
        )}

        {status === 'invalid' && (
          <div className="space-y-3">
            <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
            <p className="text-sm text-white">This invitation is no longer valid.</p>
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
            <Link href="/dashboard" className="inline-block text-sm font-medium text-[#C8FF00] hover:text-[#C8FF00]/80">
              Go to dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
