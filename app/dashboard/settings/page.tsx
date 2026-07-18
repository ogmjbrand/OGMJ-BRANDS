'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, CreditCard, Users, Shield, Bell, Check, Sparkles, Settings2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { listUserBusinesses } from '@/lib/services/business';
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards';
import type { Business } from '@/lib/types';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'team' | 'security' | 'notifications'>('general');
  const [businesses, setBusinesses] = useState<(Business & { role?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({ fullName: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notificationsForm, setNotificationsForm] = useState({ emailNotifications: true, marketingUpdates: false, paymentReminders: true });

  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaEnrollment, setMfaEnrollment] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);

  async function loadMfaStatus() {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    const verifiedTotp = data?.totp?.find((f) => f.status === 'verified');
    setMfaFactorId(verifiedTotp?.id ?? null);
  }

  async function handleStartEnrollMfa() {
    setMfaError(null);
    setMfaLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setMfaEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Failed to start 2FA enrollment');
    } finally {
      setMfaLoading(false);
    }
  }

  async function handleVerifyMfa() {
    if (!mfaEnrollment || !mfaCode.trim()) return;
    setMfaError(null);
    setMfaLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaEnrollment.factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaEnrollment.factorId,
        challengeId: challenge.id,
        code: mfaCode.trim(),
      });
      if (verifyError) throw verifyError;

      setMfaFactorId(mfaEnrollment.factorId);
      setMfaEnrollment(null);
      setMfaCode('');
      setSuccess('Two-factor authentication enabled');
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Invalid code — try again');
    } finally {
      setMfaLoading(false);
    }
  }

  async function handleDisableMfa() {
    if (!mfaFactorId) return;
    if (!confirm('Disable two-factor authentication?')) return;
    setMfaError(null);
    setMfaLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
      if (error) throw error;
      setMfaFactorId(null);
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setMfaLoading(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        setProfileForm({ fullName: currentUser?.user_metadata?.full_name || '', email: currentUser?.email || '' });
        const savedNotifications = currentUser?.user_metadata?.notification_preferences;
        if (savedNotifications) {
          setNotificationsForm((prev) => ({ ...prev, ...savedNotifications }));
        }

        const userBusinesses = await listUserBusinesses();
        if (userBusinesses.success && userBusinesses.data) {
          setBusinesses(userBusinesses.data);
        }

        await loadMfaStatus();
      } catch (error) {
        console.error('Failed to load settings:', error);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({ data: { full_name: profileForm.fullName } });

      if (error) throw error;

      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      setSaving(false);
      return;
    }

    if (!passwordForm.currentPassword) {
      setError('Enter your current password');
      setSaving(false);
      return;
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Verify the current password before changing it — updateUser() only
      // needs an active session and does not check the old password itself.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: profileForm.email,
        password: passwordForm.currentPassword,
      });

      if (verifyError) {
        throw new Error('Current password is incorrect');
      }

      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });

      if (error) throw error;

      setSuccess('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({ data: { notification_preferences: notificationsForm } });

      if (error) throw error;

      setSuccess('Notification preferences updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notifications');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings2 className="h-4 w-4" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'team', label: 'Team', icon: <Users className="h-4 w-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#C8FF00]/20 border-t-[#C8FF00]" />
          <p className="text-[#C8FF00]/70">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#C8FF00]/10 bg-[radial-gradient(circle_at_top_left,_rgba(200, 255, 0,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/20 bg-[#C8FF00]/10 px-4 py-2 text-sm text-[#C8FF00]">
            <Sparkles className="h-4 w-4" /> Control center
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Keep your account, billing and team preferences tightly managed.</h1>
          <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Fine-tune the operating details of your empire with a calm, premium experience.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Account" value="Ready" description="Profile and access configured" icon={Settings2} accent="gold" trend="Live" />
        <MetricCard title="Billing" value="Manage" description="View plan and payment details" icon={CreditCard} accent="emerald" trend="Secure" />
        <MetricCard title="Team" value={businesses.length.toString()} description="Businesses connected to your workspace" icon={Users} accent="slate" trend="Managed" />
      </div>

      <div className="flex flex-wrap gap-2 rounded-[1.4rem] border border-[#C8FF00]/10 bg-[#0E1116]/90 p-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? 'bg-[#C8FF00] text-[#07070A]' : 'text-[#C8FF00] hover:bg-[#C8FF00]/10'}`}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl">
        {activeTab === 'general' && (
          <SectionPanel title="Profile information" subtitle="Keep your identity and account details current">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {error && <div className="rounded-[1.1rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}
              {success && <div className="rounded-[1.1rem] border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">{success}</div>}
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-[#C8FF00]">Full name</label>
                  <input id="fullName" type="text" value={profileForm.fullName} onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))} className="w-full rounded-[1.1rem] border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-none transition focus:border-[#C8FF00]" />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#C8FF00]">Email</label>
                  <input id="email" type="email" value={profileForm.email} disabled className="w-full cursor-not-allowed rounded-[1.1rem] border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-[#C8FF00]/50" />
                  <p className="mt-1 text-xs text-[#C8FF00]/50">Email cannot be changed here.</p>
                </div>
              </div>
              <button type="submit" disabled={saving} className="rounded-full bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90 disabled:bg-[#C8FF00]/50">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </SectionPanel>
        )}

        {activeTab === 'billing' && (
          <SectionPanel title="Plan and payment" subtitle="Manage your subscription and billing details">
            <div className="rounded-[1.35rem] border border-[#C8FF00]/10 bg-[#11151E] p-4">
              <p className="font-semibold text-white">Full billing management</p>
              <p className="mt-1 text-sm text-[#F8F9FA]/60">View your current plan, upgrade or downgrade, and manage payments through Paystack.</p>
              <Link
                href="/dashboard/settings/billing"
                className="mt-4 inline-block rounded-full bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90"
              >
                Open billing settings
              </Link>
            </div>
          </SectionPanel>
        )}

        {activeTab === 'team' && (
          <SectionPanel title="Team workspace" subtitle="The businesses linked to your account">
            <div className="space-y-3">
              {businesses.length > 0 ? businesses.map((business) => (
                <div key={business.id} className="rounded-[1.2rem] border border-[#C8FF00]/10 bg-[#11151E] p-4">
                  <p className="font-semibold text-white">{business.name}</p>
                  <p className="mt-1 text-sm text-[#F8F9FA]/60 capitalize">
                    You are {business.role ? `a${business.role === 'owner' ? 'n' : ''} ${business.role}` : 'a member'} of this workspace.
                  </p>
                </div>
              )) : <p className="text-sm text-[#C8FF00]/60">No connected businesses yet.</p>}
            </div>
          </SectionPanel>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <SectionPanel title="Change password" subtitle="Keep your account access secure and current">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {error && <div className="rounded-[1.1rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}
                {success && <div className="rounded-[1.1rem] border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">{success}</div>}
                <div>
                  <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-[#C8FF00]">Current password</label>
                  <input id="currentPassword" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} className="w-full rounded-[1.1rem] border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-none transition focus:border-[#C8FF00]" required />
                </div>
                <div>
                  <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-[#C8FF00]">New password</label>
                  <input id="newPassword" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} className="w-full rounded-[1.1rem] border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-none transition focus:border-[#C8FF00]" required />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-[#C8FF00]">Confirm new password</label>
                  <input id="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} className="w-full rounded-[1.1rem] border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-none transition focus:border-[#C8FF00]" required />
                </div>
                <button type="submit" disabled={saving} className="rounded-full bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90 disabled:bg-[#C8FF00]/50">{saving ? 'Changing...' : 'Change password'}</button>
              </form>
            </SectionPanel>
            <SectionPanel title="Two-factor authentication" subtitle="Add another layer of protection to your account">
              {mfaError && <div className="mb-4 rounded-[1.1rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{mfaError}</div>}

              {mfaEnrollment ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#F8F9FA]/70">Scan this QR code with your authenticator app, then enter the 6-digit code it generates.</p>
                  <img src={mfaEnrollment.qrCode} alt="2FA QR code" className="h-40 w-40 rounded-lg bg-white p-2" />
                  <p className="text-xs text-[#C8FF00]/60">Can&apos;t scan? Enter this code manually: <span className="font-mono">{mfaEnrollment.secret}</span></p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="123456"
                      className="w-40 rounded-full border border-[#C8FF00]/10 bg-[#07070A] px-4 py-2 text-white outline-none focus:border-[#C8FF00]"
                    />
                    <button
                      onClick={handleVerifyMfa}
                      disabled={mfaLoading || !mfaCode.trim()}
                      className="rounded-full bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90 disabled:opacity-60"
                    >
                      {mfaLoading ? 'Verifying...' : 'Verify & enable'}
                    </button>
                    <button
                      onClick={() => { setMfaEnrollment(null); setMfaCode(''); setMfaError(null); }}
                      className="rounded-full border border-[#C8FF00]/10 px-4 py-2 text-sm text-[#F8F9FA]/60 transition hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : mfaFactorId ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm text-green-400"><Check className="h-4 w-4" /> Two-factor authentication is enabled</p>
                  <button
                    onClick={handleDisableMfa}
                    disabled={mfaLoading}
                    className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-60"
                  >
                    Disable 2FA
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartEnrollMfa}
                  disabled={mfaLoading}
                  className="rounded-full bg-[#C8FF00]/10 px-4 py-2 text-sm font-medium text-[#C8FF00] transition hover:bg-[#C8FF00]/20 disabled:opacity-60"
                >
                  {mfaLoading ? 'Starting...' : 'Enable 2FA'}
                </button>
              )}
            </SectionPanel>
          </div>
        )}

        {activeTab === 'notifications' && (
          <SectionPanel title="Notification preferences" subtitle="Choose what should reach you and when">
            <form onSubmit={handleNotificationsUpdate} className="space-y-4">
              {error && <div className="rounded-[1.1rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}
              {success && <div className="rounded-[1.1rem] border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">{success}</div>}
              <div className="rounded-[1.2rem] border border-[#C8FF00]/10 bg-[#11151E] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">Email notifications</p>
                    <p className="mt-1 text-sm text-[#F8F9FA]/60">Get updates about deals, contacts and account activity.</p>
                  </div>
                  <input id="emailNotifications" type="checkbox" checked={notificationsForm.emailNotifications} onChange={(e) => setNotificationsForm((prev) => ({ ...prev, emailNotifications: e.target.checked }))} className="h-5 w-5" aria-label="Enable email notifications" />
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-[#C8FF00]/10 bg-[#11151E] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">Marketing updates</p>
                    <p className="mt-1 text-sm text-[#F8F9FA]/60">Insights about new features and product tips.</p>
                  </div>
                  <input id="marketingUpdates" type="checkbox" checked={notificationsForm.marketingUpdates} onChange={(e) => setNotificationsForm((prev) => ({ ...prev, marketingUpdates: e.target.checked }))} className="h-5 w-5" aria-label="Enable marketing updates" />
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-[#C8FF00]/10 bg-[#11151E] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">Payment reminders</p>
                    <p className="mt-1 text-sm text-[#F8F9FA]/60">Alerts before payment dates and renewals.</p>
                  </div>
                  <input id="paymentReminders" type="checkbox" checked={notificationsForm.paymentReminders} onChange={(e) => setNotificationsForm((prev) => ({ ...prev, paymentReminders: e.target.checked }))} className="h-5 w-5" aria-label="Enable payment reminders" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full rounded-full bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90 disabled:bg-[#C8FF00]/50">{saving ? 'Saving...' : 'Save preferences'}</button>
            </form>
          </SectionPanel>
        )}
      </div>
    </div>
  );
}


