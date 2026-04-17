'use client';

import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { listUserBusinesses } from '@/lib/services/business';
import type { Business } from '@/lib/types';

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getCurrentUser();
        if (user?.email) {
          setEmail(user.email);
        }

        const result = await listUserBusinesses();
        if (result.success) {
          setBusinesses(result.data || []);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
          <p className="text-[#D4AF37]/70">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Dashboard</h1>
        <p className="text-[#D4AF37]/70 mt-2">Welcome back, {email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Businesses"
          value={businesses.length}
          icon="🏢"
        />
        <StatCard
          label="Total Contacts"
          value="0"
          icon="👥"
        />
        <StatCard
          label="Revenue (MRR)"
          value="$0"
          icon="💰"
        />
        <StatCard
          label="Active Deals"
          value="0"
          icon="💼"
        />
      </div>

      {/* Businesses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Your Businesses</h2>
          <button className="px-4 py-2 bg-[#D4AF37] text-[#07070A] rounded-lg font-semibold hover:bg-[#D4AF37]/90 transition">
            + New Business
          </button>
        </div>

        {businesses.length === 0 ? (
          <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-12 text-center">
            <p className="text-[#D4AF37]/70 mb-4">No businesses yet</p>
            <button className="px-4 py-2 bg-[#D4AF37]/20 text-[#D4AF37] rounded-lg font-medium hover:bg-[#D4AF37]/30 transition">
              Create your first business
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard
          icon="📞"
          title="Add Contact"
          description="Grow your contact list"
        />
        <QuickActionCard
          icon="🎬"
          title="Upload Video"
          description="Create viral moments"
        />
        <QuickActionCard
          icon="🎨"
          title="Build Website"
          description="Create a website"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-6 hover:border-[#D4AF37]/30 transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#D4AF37]/70 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function BusinessCard({ business }: { business: Business }) {
  return (
    <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-6 hover:border-[#D4AF37]/30 transition cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition">
            {business.name}
          </h3>
          <p className="text-[#D4AF37]/50 text-sm mt-1">{business.slug}</p>
        </div>
        {business.logo_url && (
          <img
            src={business.logo_url}
            alt={business.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-1 rounded">
          {business.currency || 'USD'}
        </span>
        <p className="text-xs text-[#D4AF37]/50">
          Created {new Date(business.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function QuickActionCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <button className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-6 hover:border-[#D4AF37]/30 hover:bg-[#0E1116]/80 transition text-left group">
      <span className="text-4xl block mb-3">{icon}</span>
      <h3 className="font-bold text-white group-hover:text-[#D4AF37] transition">{title}</h3>
      <p className="text-sm text-[#D4AF37]/50 mt-1">{description}</p>
    </button>
  );
}
