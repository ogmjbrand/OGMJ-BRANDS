'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Calendar,
  MoreHorizontal,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('30d');

  const metrics = [
    {
      label: 'Total Revenue',
      value: '$12,450',
      change: '+12.5%',
      positive: true,
      icon: DollarSign,
    },
    {
      label: 'Active Deals',
      value: '24',
      change: '+3 this month',
      positive: true,
      icon: Target,
    },
    {
      label: 'Total Contacts',
      value: '1,250',
      change: '+180 this month',
      positive: true,
      icon: Users,
    },
    {
      label: 'Conversion Rate',
      value: '32%',
      change: '+2.1%',
      positive: true,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Analytics</h1>
          <p className="text-[#D4AF37]/70 mt-2">Track your business performance</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeframe === period
                  ? 'bg-[#D4AF37] text-[#07070A]'
                  : 'bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className="p-6 bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl hover:border-[#D4AF37]/30 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <Icon className="w-5 h-5 text-[#D4AF37]" />
                <button className="text-[#D4AF37]/50 hover:text-[#D4AF37]">ODAY
                
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-[#D4AF37]/70 mb-1">{metric.label}</p>
              <h3 className="text-3xl font-bold text-white mb-2">{metric.value}</h3>
              <p
                className={`text-sm font-medium ${
                  metric.positive ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {metric.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="p-6 bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-6">Revenue Trend</h3>
          <div className="h-64 flex items-end gap-2">
            {[40, 55, 45, 75, 60, 80, 70].map((value, idx) => (
              <div
                key={idx}
                className="flex-1 bg-gradient-to-t from-[#D4AF37] to-[#D4AF37]/60 rounded-t hover:from-[#D4AF37]/80 hover:to-[#D4AF37]/40 transition cursor-pointer"
                style={{ height: `${(value / 100) * 100}%` }}
                title={`$${value * 100}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-[#D4AF37]/50">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Deal Status Distribution */}
        <div className="p-6 bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-6">Deal Pipeline</h3>
          <div className="space-y-4">
            {[
              { stage: 'Prospecting', count: 8, percent: 33 },
              { stage: 'Qualification', count: 6, percent: 25 },
              { stage: 'Proposal', count: 5, percent: 21 },
              { stage: 'Negotiation', count: 3, percent: 13 },
              { stage: 'Decision', count: 2, percent: 8 },
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white font-medium">{item.stage}</span>
                  <span className="text-[#D4AF37]">{item.count} deals</span>
                </div>
                <div className="w-full h-2 bg-[#07070A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]/60 rounded-full"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contacts */}
        <div className="p-6 bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-6">Top Contacts by Value</h3>
          <div className="space-y-3">
            {[
              { name: 'Acme Corp', value: '$45,000', status: 'Active' },
              { name: 'TechStart Inc', value: '$32,500', status: 'Active' },
              { name: 'GlobalTrade', value: '$28,750', status: 'Pending' },
            ].map((contact, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-[#07070A] rounded-lg border border-[#D4AF37]/10"
              >
                <div>
                  <p className="font-medium text-white">{contact.name}</p>
                  <p className="text-xs text-[#D4AF37]/50 mt-0.5">{contact.status}</p>
                </div>
                <p className="font-semibold text-[#D4AF37]">{contact.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="p-6 bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { action: 'New deal created', date: '2 hours ago', icon: '📝' },
              { action: 'Contact added', date: '5 hours ago', icon: '👤' },
              { action: 'Payment received', date: '1 day ago', icon: '💰' },
              { action: 'Website published', date: '2 days ago', icon: '🌐' },
            ].map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-[#07070A] rounded-lg border border-[#D4AF37]/10"
              >
                <span className="text-xl">{activity.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{activity.action}</p>
                  <p className="text-xs text-[#D4AF37]/50 mt-0.5">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
