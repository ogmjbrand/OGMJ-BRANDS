'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = params.token as string;

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            type: 'signup', // Default to signup verification
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [params.token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-[#D4AF37]/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center space-y-6">
            {/* Status Icon */}
            <div className="flex justify-center">
              {status === 'loading' && (
                <div className="w-16 h-16 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
              )}
              {status === 'success' && (
                <CheckCircle className="w-16 h-16 text-green-500" />
              )}
              {status === 'error' && (
                <XCircle className="w-16 h-16 text-red-500" />
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {status === 'loading' && 'Verifying Email'}
                {status === 'success' && 'Email Verified!'}
                {status === 'error' && 'Verification Failed'}
              </h1>
              <p className="text-[#D4AF37]/70">
                {status === 'loading' && 'Please wait while we verify your email address...'}
                {status === 'success' && 'Your email has been successfully verified.'}
                {status === 'error' && 'We could not verify your email address.'}
              </p>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                status === 'success'
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : status === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37]'
              }`}>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{message}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            {status === 'error' && (
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Back to Login
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  className="w-full bg-transparent border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#D4AF37] font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Sign Up Again
                </button>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center">
                <p className="text-sm text-[#D4AF37]/70">
                  You will be redirected to the dashboard in a few seconds...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}