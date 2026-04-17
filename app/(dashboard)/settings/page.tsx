'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CreditCard, Users, Shield, Bell } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { listUserBusinesses } from '@/lib/services/business';
import type { Business, User } from '@/lib/types';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'team' | 'security' | 'notifications'>('general');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
          <div className="space-y-6">
            <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Profile Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#D4AF37] mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.user_metadata?.full_name || ''}
                    className="w-full px-4 py-2 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-white placeholder-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#D4AF37] mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2 bg-[#07070A] border border-[#D4AF37]/20 rounded-lg text-[#D4AF37]/50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
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
            <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Password</h3>
              <button className="px-4 py-2 bg-[#D4AF37]/20 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/30 transition font-medium">
                Change Password
              </button>
            </div>

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
          <div className="space-y-6">
            <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Email Notifications</p>
                  <p className="text-sm text-[#D4AF37]/50 mt-1">Get updates about your deals and contacts</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Marketing Updates</p>
                  <p className="text-sm text-[#D4AF37]/50 mt-1">Learn about new features and tips</p>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Payment Reminders</p>
                  <p className="text-sm text-[#D4AF37]/50 mt-1">Alerts before payment date</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
