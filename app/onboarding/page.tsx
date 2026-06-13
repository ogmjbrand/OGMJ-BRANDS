'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, ShoppingCart, Activity, AlertCircle, Sparkles, MessageCircle, Zap, BarChart3, Mail, Package } from 'lucide-react';
import { BusinessProvider, useBusinessContext } from '@/lib/context/BusinessContext';
import { listContacts, listDeals } from '@/lib/services/crm';
import { getVideos } from '@/lib/services/videos.service';
import { getWebsites } from '@/lib/services/builder.service';

interface DashboardMetrics {
  totalContacts: number;
  activeDeals: number;
  totalRevenue: number;
  conversionRate: number;
  revenueData: any[];
  pipelineData: any[];
  topDeals: any[];
  videoCount: number;
  websiteCount: number;
}

const COLORS = ['#D4AF37', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#D4AF37]/10 rounded-lg ${className}`} />
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: any;
  label: string;
  value: string | number;
  loading: boolean;
}) {
  return (
    <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-[#D4AF37]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#D4AF37]/60">{label}</p>
        {loading ? (
          <SkeletonBox className="h-7 w-24 mt-1" />
        ) : (
          <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        )}
      </div>
    </div>
  );
}

function DashboardPageContent() {
  const { currentBusiness } = useBusinessContext();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentBusiness) return;

    // Show page immediately, load data in background
    setLoading(true);

    async function loadMetrics() {
      if (!currentBusiness) return;
      const businessId = currentBusiness.id;

      try {
        // Load contacts and deals first (most important)
        const [contactsResult, dealsResult] = await Promise.all([
          listContacts(businessId, { pageSize: 10 }),
          listDeals(businessId, { pageSize: 10 }),
        ]);

        const contactsList = contactsResult.success && contactsResult.data ? contactsResult.data.items : [];
        const dealsList = dealsResult.success && dealsResult.data ? dealsResult.data.items : [];

        const totalContacts = contactsList.length;
        const activeDeals = dealsList.filter((d: any) => d.status !== 'won' && d.status !== 'lost').length;
        const totalRevenue = dealsList.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
        const wonDeals = dealsList.filter((d: any) => d.status === 'won').length;
        const conversionRate = dealsList.length > 0 ? Math.round((wonDeals / dealsList.length) * 100) : 0;

        const revenueData = [
          { month: 'Jan', revenue: 0 },
          { month: 'Feb', revenue: 0 },
          { month: 'Mar', revenue: 0 },
          { month: 'Apr', revenue: 0 },
          { month: 'May', revenue: 0 },
          { month: 'Jun', revenue: totalRevenue },
        ];

        const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'decision'];
        const pipelineData = stages.map(stage => ({
          name: stage.charAt(0).toUpperCase() + stage.slice(1),
          value: dealsList.filter((d: any) => d.stage === stage).length || 0,
          revenue: dealsList.filter((d: any) => d.stage === stage).reduce((sum: number, d: any) => sum + (d.value || 0), 0) || 0,
        }));

        const topDeals = [...dealsList]
          .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
          .slice(0, 5)
          .map((deal: any) => ({
            title: deal.title,
            value: deal.value,
            status: deal.status,
            stage: deal.stage,
          }));

        // Set main metrics immediately
        setMetrics({
          totalContacts,
          activeDeals,
          totalRevenue,
          conversionRate,
          revenueData,
          pipelineData,
          topDeals,
          videoCount: 0,
          websiteCount: 0,
        });
        setLoading(false);

        // Load secondary data in background (non-blocking)
        Promise.all([
          getVideos(businessId),
          getWebsites(businessId),
        ]).then(([videosResult, websitesResult]) => {
          const videoCount = videosResult.success && videosResult.data ? videosResult.data.videos.length : 0;
          const websiteCount = websitesResult.success && websitesResult.data ? websitesResult.data.length : 0;
          setMetrics(prev => prev ? { ...prev, videoCount, websiteCount } : prev);
        });

      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    }

    loadMetrics();
  }, [currentBusiness]);

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[#D4AF37]/50 mx-auto mb-3" />
          <p className="text-[#D4AF37]/70">No business selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#D4AF37]/60 text-sm mt-1">{currentBusiness.name}</p>
        </div>
        <div className="flex items-center gap-2 text-[#D4AF37]/50 text-sm">
          <Activity className="w-4 h-4" />
          <span>Live</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Metric Cards — show immediately */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          label="Total Contacts"
          value={metrics?.totalContacts ?? 0}
          loading={loading}
        />
        <MetricCard
          icon={ShoppingCart}
          label="Active Deals"
          value={metrics?.activeDeals ?? 0}
          loading={loading}
        />
        <MetricCard
          icon={DollarSign}
          label="Total Revenue"
          value={metrics ? `$${metrics.totalRevenue.toLocaleString()}` : '$0'}
          loading={loading}
        />
        <MetricCard
          icon={TrendingUp}
          label="Conversion Rate"
          value={metrics ? `${metrics.conversionRate}%` : '0%'}
          loading={loading}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Zap} label="Videos" value={metrics?.videoCount ?? '...'} loading={loading} />
        <MetricCard icon={Package} label="Websites" value={metrics?.websiteCount ?? '...'} loading={loading} />
        <MetricCard icon={Mail} label="Campaigns" value={0} loading={loading} />
        <MetricCard icon={MessageCircle} label="Messages" value={0} loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
            Revenue Trend
          </h2>
          {loading ? (
            <SkeletonBox className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metrics?.revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D4AF37/10" />
                <XAxis dataKey="month" stroke="#D4AF37" tick={{ fill: '#D4AF3799', fontSize: 12 }} />
                <YAxis stroke="#D4AF37" tick={{ fill: '#D4AF3799', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0E1116', border: '1px solid #D4AF3733', borderRadius: 8 }}
                  labelStyle={{ color: '#D4AF37' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} dot={{ fill: '#D4AF37' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pipeline Chart */}
        <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#D4AF37]" />
            Pipeline by Stage
          </h2>
          {loading ? (
            <SkeletonBox className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics?.pipelineData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D4AF3710" />
                <XAxis dataKey="name" stroke="#D4AF37" tick={{ fill: '#D4AF3799', fontSize: 11 }} />
                <YAxis stroke="#D4AF37" tick={{ fill: '#D4AF3799', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0E1116', border: '1px solid #D4AF3733', borderRadius: 8 }}
                  labelStyle={{ color: '#D4AF37' }}
                />
                <Bar dataKey="value" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Deals */}
      <div className="bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#D4AF37]" />
          Top Deals
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <SkeletonBox key={i} className="h-12" />)}
          </div>
        ) : metrics?.topDeals && metrics.topDeals.length > 0 ? (
          <div className="space-y-3">
            {metrics.topDeals.map((deal: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#07070A] rounded-lg border border-[#D4AF37]/10">
                <div>
                  <p className="text-white text-sm font-medium">{deal.title || 'Untitled Deal'}</p>
                  <p className="text-[#D4AF37]/50 text-xs mt-0.5 capitalize">{deal.stage || 'No stage'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#D4AF37] font-semibold">${(deal.value || 0).toLocaleString()}</p>
                  <p className="text-xs text-[#D4AF37]/50 capitalize mt-0.5">{deal.status || 'active'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#D4AF37]/40">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No deals yet. Add your first deal to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <BusinessProvider>
      <DashboardPageContent />
    </BusinessProvider>
  );
}
