'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Calendar,
  MoreHorizontal,
  AlertCircle,
} from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import {
  getDashboardMetrics,
  getRevenueData,
  getDealPipelineData,
  getTopContacts,
  type DealPipelineData,
} from '@/lib/services/analytics.service';

export default function AnalyticsPage() {
  const { currentBusiness } = useBusinessContext();
  const [timeframe, setTimeframe] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [pipelineData, setPipelineData] = useState<DealPipelineData | null>(null);
  const [topContacts, setTopContacts] = useState<any>(null);

  async function loadAnalytics() {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [metricsResult, revenueResult, pipelineResult, contactsResult] = await Promise.all([
        getDashboardMetrics(currentBusiness.id, timeframe),
        getRevenueData(currentBusiness.id, timeframe),
        getDealPipelineData(currentBusiness.id),
        getTopContacts(currentBusiness.id, 5),
      ]);

      if (metricsResult.success) {
        setMetrics(metricsResult.data);
      }

      if (revenueResult.success) {
        setRevenueData(revenueResult.data);
      }

      if (pipelineResult.success && pipelineResult.data) {
        setPipelineData(pipelineResult.data);
      }

      if (contactsResult.success) {
        setTopContacts(contactsResult.data);
      }

      // Check if any request failed
      const failedRequests = [metricsResult, revenueResult, pipelineResult, contactsResult]
        .filter(result => !result.success);

      if (failedRequests.length > 0) {
        setError('Some data could not be loaded. Please try again.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, [currentBusiness, timeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
          <p className="text-[#D4AF37]/70">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-[#D4AF37] text-[#07070A] rounded-lg font-semibold hover:bg-[#D4AF37]/90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const metricsData = [
    {
      label: 'Total Revenue',
      value: metrics ? `$${metrics.overview.totalRevenue.toLocaleString()}` : '$0',
      change: '+12.5%',
      positive: true,
      icon: DollarSign,
    },
    {
      label: 'Active Deals',
      value: pipelineData ? Object.values(pipelineData).reduce((a: number, b: number) => a + b, 0).toString() : '0',
      change: '+3 this month',
      positive: true,
      icon: Target,
    },
    {
      label: 'Total Contacts',
      value: metrics ? metrics.overview.newContacts.toString() : '0',
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
        {metricsData.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className="p-6 bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl hover:border-[#D4AF37]/30 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <Icon className="w-5 h-5 text-[#D4AF37]" />
                <button className="text-[#D4AF37]/50 hover:text-[#D4AF37]">
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
            {pipelineData ? [
              { stage: 'Prospecting', count: pipelineData.prospecting || 0 },
              { stage: 'Qualification', count: pipelineData.qualification || 0 },
              { stage: 'Proposal', count: pipelineData.proposal || 0 },
              { stage: 'Negotiation', count: pipelineData.negotiation || 0 },
              { stage: 'Decision', count: pipelineData.decision || 0 },
            ].map((item, idx) => {
              const total = Object.values(pipelineData).reduce((a: number, b: number) => a + b, 0);
              const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium">{item.stage}</span>
                    <span className="text-[#D4AF37]">{item.count} deals</span>
                  </div>
                  <div className="w-full h-2 bg-[#07070A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]/60 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            }) : (
              <p className="text-[#D4AF37]/50">No deal data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contacts */}
        <div className="p-6 bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-6">Recent Contacts</h3>
          <div className="space-y-3">
            {topContacts?.length > 0 ? topContacts.map((contact: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-[#07070A] rounded-lg border border-[#D4AF37]/10"
              >
                <div>
                  <p className="font-medium text-white">{contact.first_name} {contact.last_name}</p>
                  <p className="text-xs text-[#D4AF37]/50 mt-0.5">{contact.status}</p>
                </div>
                <p className="font-semibold text-[#D4AF37]">{contact.email}</p>
              </div>
            )) : (
              <p className="text-[#D4AF37]/50">No recent contacts</p>
            )}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="p-6 bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
          <div className="space-y-3">
            <p className="text-[#D4AF37]/50">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
}
