'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CreditCard, Users, Shield, Bell, Check } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { listUserBusinesses } from '@/lib/services/business';
import type { Business, User } from '@/lib/types';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'team' | 'security' | 'notifications'>('general');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notificationsForm, setNotificationsForm] = useState({
    emailNotifications: true,
    marketingUpdates: false,
    paymentReminders: true,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setProfileForm({
          fullName: currentUser?.user_metadata?.full_name || '',
          email: currentUser?.email || '',
        });

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
      // Update user metadata
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        data: { full_name: profileForm.fullName }
      });

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

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

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
      // Here you would save notification preferences to your database
      // For now, just show success
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSuccess('Notification preferences updated');
    } catch (err) {
      setError('Failed to update notifications');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        const userBusinesses = await listUserBusinesses();
        if (userBusinesses.success && userBusinesses.data) {
          setBusinesses(userBusinesses.data);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'team', label: 'Team', icon: <Users className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
          <p className="text-[#D4AF37]/70">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Settings</h1>
        <p className="text-[#D4AF37]/70 mt-2">Manage your account and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-[#D4AF37]/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium transition flex items-center gap-2 ${
              activeTab === tab.id
                ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                : 'text-[#D4AF37]/50 hover:text-[#D4AF37]/70'
            }`}
          >
            {typeof tab.icon === 'string' ? tab.icon : tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-2xl">
        {activeTab === 'general' && (
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Profile Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-[#D4AF37] mb-2">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#D4AF37] mb-2">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="w-full px-4 py-2 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-[#D4AF37]/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-[#D4AF37]/50 mt-1">Email cannot be changed</p>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-4 px-4 py-2 bg-[#D4AF37] text-[#07070A] rounded-lg font-medium hover:bg-[#D4AF37]/90 disabled:bg-[#D4AF37]/50 transition"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Current Plan</h3>
              <div className="space-y-4">
                <div className="p-4 bg-[#07070A] rounded-lg border border-[#D4AF37]/20">
                  <p className="text-[#D4AF37] font-semibold">Professional Plan</p>
                  <p className="text-sm text-[#D4AF37]/70 mt-1">$99/month • Next billing: May 17, 2026</p>
                </div>
                <button className="px-4 py-2 bg-[#D4AF37]/20 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/30 transition font-medium">
                  Change Plan
                </button>
              </div>
            </div>

            <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Payment Method</h3>
              <div className="p-4 bg-[#07070A] rounded-lg border border-[#D4AF37]/20">
                <p className="text-white font-medium">Visa •••• 4242</p>
                <p className="text-sm text-[#D4AF37]/70 mt-1">Expires 12/26</p>
              </div>
              <button className="mt-4 px-4 py-2 bg-[#D4AF37]/20 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/30 transition font-medium">
                Update Payment Method
              </button>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Team Members</h3>
                <button className="px-4 py-2 bg-[#D4AF37] text-[#07070A] rounded-lg font-medium hover:bg-[#D4AF37]/90 transition">
                  Invite Member
                </button>
              </div>
              <div className="space-y-3">
                {businesses.length > 0 ? (
                  businesses.map((business) => (
                    <div key={business.id} className="p-3 bg-[#07070A] rounded-lg border border-[#D4AF37]/10">
                      <p className="font-medium text-white">{business.name}</p>
                      <p className="text-sm text-[#D4AF37]/50 mt-1">You are an admin</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[#D4AF37]/50">No team members yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-[#D4AF37] mb-2">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-[#D4AF37] mb-2">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#D4AF37] mb-2">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-2 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-4 px-4 py-2 bg-[#D4AF37] text-[#07070A] rounded-lg font-medium hover:bg-[#D4AF37]/90 disabled:bg-[#D4AF37]/50 transition"
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>

            <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Two-Factor Authentication</h3>
              <p className="text-sm text-[#D4AF37]/70 mb-4">Add an extra layer of security to your account</p>
              <button className="px-4 py-2 bg-[#D4AF37]/20 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/30 transition font-medium">
                Enable 2FA
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <form onSubmit={handleNotificationsUpdate} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="emailNotifications" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium text-white">Email Notifications</p>
                    <p className="text-sm text-[#D4AF37]/50 mt-1">Get updates about your deals and contacts</p>
                  </div>
                </label>
                <input
                  id="emailNotifications"
                  type="checkbox"
                  checked={notificationsForm.emailNotifications}
                  onChange={(e) => setNotificationsForm(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                  className="w-5 h-5 flex-shrink-0"
                  aria-label="Enable email notifications"
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="marketingUpdates" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium text-white">Marketing Updates</p>
                    <p className="text-sm text-[#D4AF37]/50 mt-1">Learn about new features and tips</p>
                  </div>
                </label>
                <input
                  id="marketingUpdates"
                  type="checkbox"
                  checked={notificationsForm.marketingUpdates}
                  onChange={(e) => setNotificationsForm(prev => ({ ...prev, marketingUpdates: e.target.checked }))}
                  className="w-5 h-5 flex-shrink-0"
                  aria-label="Enable marketing updates"
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="paymentReminders" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium text-white">Payment Reminders</p>
                    <p className="text-sm text-[#D4AF37]/50 mt-1">Alerts before payment date</p>
                  </div>
                </label>
                <input
                  id="paymentReminders"
                  type="checkbox"
                  checked={notificationsForm.paymentReminders}
                  onChange={(e) => setNotificationsForm(prev => ({ ...prev, paymentReminders: e.target.checked }))}
                  className="w-5 h-5 flex-shrink-0"
                  aria-label="Enable payment reminders"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full mt-4 px-4 py-2 bg-[#D4AF37] text-[#07070A] rounded-lg font-medium hover:bg-[#D4AF37]/90 disabled:bg-[#D4AF37]/50 transition"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
