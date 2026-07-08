'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CreditCard, Users, Shield, Bell, Check, Sparkles, Settings2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { listUserBusinesses } from '@/lib/services/business';
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards';
import type { Business } from '@/lib/types';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'team' | 'security' | 'notifications'>('general');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({ fullName: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notificationsForm, setNotificationsForm] = useState({ emailNotifications: true, marketingUpdates: false, paymentReminders: true });

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        setProfileForm({ fullName: currentUser?.user_metadata?.full_name || '', email: currentUser?.email || '' });

        const userBusinesses = await listUserBusinesses();
        if (userBusinesses.success && userBusinesses.data) {
          setBusinesses(userBusinesses.data);
        }
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

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess('Notification preferences updated');
    } catch (err) {
      setError('Failed to update notifications');
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
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#D4AF37]/20 border-t-[#D4AF37]" />
          <p className="text-[#D4AF37]/70">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#D4AF37]/10 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
            <Sparkles className="h-4 w-4" /> Control center
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Keep your account, billing and team preferences tightly managed.</h1>
          <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Fine-tune the operating details of your empire with a calm, premium experience.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Account" value="Ready" description="Profile and access configured" icon={Settings2} accent="gold" trend="Live" />
        <MetricCard title="Billing" value="Professional" description="Active plan in place" icon={CreditCard} accent="emerald" trend="Secure" />
        <MetricCard title="Team" value={businesses.length.toString()} description="Businesses connected to your workspace" icon={Users} accent="slate" trend="Managed" />
      </div>

      <div className="flex flex-wrap gap-2 rounded-[1.4rem] border border-[#D4AF37]/10 bg-[#0E1116]/90 p-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? 'bg-[#D4AF37] text-[#07070A]' : 'text-[#D4AF37] hover:bg-[#D4AF37]/10'}`}>
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
                  <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-[#D4AF37]">Full name</label>
                  <input id="fullName" type="text" value={profileForm.fullName} onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))} className="w-full rounded-[1.1rem] border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#D4AF37]">Email</label>
                  <input id="email" type="email" value={profileForm.email} disabled className="w-full cursor-not-allowed rounded-[1.1rem] border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-[#D4AF37]/50" />
                  <p className="mt-1 text-xs text-[#D4AF37]/50">Email cannot be changed here.</p>
                </div>
              </div>
              <button type="submit" disabled={saving} className="rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90 disabled:bg-[#D4AF37]/50">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </SectionPanel>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <SectionPanel title="Current plan" subtitle="Your current subscription and payment setup">
              <div className="rounded-[1.35rem] border border-[#D4AF37]/10 bg-[#11151E] p-4">
                <p className="font-semibold text-white">Professional plan</p>
                <p className="mt-1 text-sm text-[#F8F9FA]/60">$99/month • Next billing: May 17, 2026</p>
                <button className="mt-4 rounded-full bg-[#D4AF37]/10 px-4 py-2 text-sm font-medium text-[#D4AF37] transition hover:bg-[#D4AF37]/20">Change plan</button>
              </div>
            </SectionPanel>
            <SectionPanel title="Payment method" subtitle="Your stored card and billing details">
              <div className="rounded-[1.35rem] border border-[#D4AF37]/10 bg-[#11151E] p-4">
                <p className="font-semibold text-white">Visa •••• 4242</p>
                <p className="mt-1 text-sm text-[#F8F9FA]/60">Expires 12/26</p>
                <button className="mt-4 rounded-full bg-[#D4AF37]/10 px-4 py-2 text-sm font-medium text-[#D4AF37] transition hover:bg-[#D4AF37]/20">Update payment method</button>
              </div>
            </SectionPanel>
          </div>
        )}

        {activeTab === 'team' && (
          <SectionPanel title="Team workspace" subtitle="The businesses linked to your account">
            <div className="space-y-3">
              {businesses.length > 0 ? businesses.map((business) => (
                <div key={business.id} className="rounded-[1.2rem] border border-[#D4AF37]/10 bg-[#11151E] p-4">
                  <p className="font-semibold text-white">{business.name}</p>
                  <p className="mt-1 text-sm text-[#F8F9FA]/60">You are an admin for this workspace.</p>
                </div>
              )) : <p className="text-sm text-[#D4AF37]/60">No connected businesses yet.</p>}
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
                  <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-[#D4AF37]">Current password</label>
                  <input id="currentPassword" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} className="w-full rounded-[1.1rem] border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]" required />
                </div>
                <div>
                  <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-[#D4AF37]">New password</label>
                  <input id="newPassword" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} className="w-full rounded-[1.1rem] border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]" required />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-[#D4AF37]">Confirm new password</label>
                  <input id="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} className="w-full rounded-[1.1rem] border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]" required />
                </div>
                <button type="submit" disabled={saving} className="rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90 disabled:bg-[#D4AF37]/50">{saving ? 'Changing...' : 'Change password'}</button>
              </form>
            </SectionPanel>
            <SectionPanel title="Two-factor authentication" subtitle="Add another layer of protection to your account">
              <button className="rounded-full bg-[#D4AF37]/10 px-4 py-2 text-sm font-medium text-[#D4AF37] transition hover:bg-[#D4AF37]/20">Enable 2FA</button>
            </SectionPanel>
          </div>
        )}

        {activeTab === 'notifications' && (
          <SectionPanel title="Notification preferences" subtitle="Choose what should reach you and when">
            <form onSubmit={handleNotificationsUpdate} className="space-y-4">
              {error && <div className="rounded-[1.1rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}
              {success && <div className="rounded-[1.1rem] border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">{success}</div>}
              <div className="rounded-[1.2rem] border border-[#D4AF37]/10 bg-[#11151E] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">Email notifications</p>
                    <p className="mt-1 text-sm text-[#F8F9FA]/60">Get updates about deals, contacts and account activity.</p>
                  </div>
                  <input id="emailNotifications" type="checkbox" checked={notificationsForm.emailNotifications} onChange={(e) => setNotificationsForm((prev) => ({ ...prev, emailNotifications: e.target.checked }))} className="h-5 w-5" aria-label="Enable email notifications" />
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-[#D4AF37]/10 bg-[#11151E] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">Marketing updates</p>
                    <p className="mt-1 text-sm text-[#F8F9FA]/60">Insights about new features and product tips.</p>
                  </div>
                  <input id="marketingUpdates" type="checkbox" checked={notificationsForm.marketingUpdates} onChange={(e) => setNotificationsForm((prev) => ({ ...prev, marketingUpdates: e.target.checked }))} className="h-5 w-5" aria-label="Enable marketing updates" />
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-[#D4AF37]/10 bg-[#11151E] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">Payment reminders</p>
                    <p className="mt-1 text-sm text-[#F8F9FA]/60">Alerts before payment dates and renewals.</p>
                  </div>
                  <input id="paymentReminders" type="checkbox" checked={notificationsForm.paymentReminders} onChange={(e) => setNotificationsForm((prev) => ({ ...prev, paymentReminders: e.target.checked }))} className="h-5 w-5" aria-label="Enable payment reminders" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90 disabled:bg-[#D4AF37]/50">{saving ? 'Saving...' : 'Save preferences'}</button>
            </form>
          </SectionPanel>
        )}
      </div>
    </div>
  );
}


