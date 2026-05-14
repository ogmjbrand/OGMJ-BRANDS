'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, ShoppingCart, Activity, AlertCircle, Sparkles, MessageCircle, Zap } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
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
  recentActivities: any[];
}

export default function DashboardPage() {
  const { currentBusiness } = useBusinessContext();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentBusiness) return;

    async function loadDashboardMetrics() {
      if (!currentBusiness) return;

      const businessId = currentBusiness.id;
      try {
        setLoading(true);
        setError(null);

        const [contactsResult, dealsResult, videosResult, websitesResult] = await Promise.all([
          listContacts(businessId, { pageSize: 100 }),
          listDeals(businessId, { pageSize: 100 }),
          getVideos(businessId),
          getWebsites(businessId),
        ]);

        const contactsList = contactsResult.success && contactsResult.data ? contactsResult.data.items : [];
        const dealsList = dealsResult.success && dealsResult.data ? dealsResult.data.items : [];
        const videoCount = videosResult.success && videosResult.data ? videosResult.data.videos.length : 0;
        const websiteCount = websitesResult.success && websitesResult.data ? websitesResult.data.length : 0;

        // Calculate metrics
        const totalContacts = contactsList.length;
        const activeDeals = dealsList.filter((d: any) => d.status !== 'won' && d.status !== 'lost').length;
        const totalRevenue = dealsList.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
        const wonDeals = dealsList.filter((d: any) => d.status === 'won').length;
        const conversionRate = dealsList.length > 0 ? Math.round((wonDeals / dealsList.length) * 100) : 0;

        // Revenue trend (mock data - in production would come from transactions table)
        const revenueData = [
          { month: 'Jan', revenue: 0 },
          { month: 'Feb', revenue: 0 },
          { month: 'Mar', revenue: 0 },
          { month: 'Apr', revenue: 0 },
          { month: 'May', revenue: 0 },
          { month: 'Jun', revenue: totalRevenue },
        ];

        // Pipeline by stage
        const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'decision'];
        const pipelineData = stages.map(stage => ({
          name: stage.charAt(0).toUpperCase() + stage.slice(1),
          value: dealsList.filter((d: any) => d.stage === stage).length || 0,
          revenue: dealsList.filter((d: any) => d.stage === stage).reduce((sum: number, d: any) => sum + (d.value || 0), 0) || 0,
        }));

        // Top deals
        const topDeals = (dealsList || [])
          .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
          .slice(0, 5)
          .map((deal: any) => ({
            title: deal.title,
            value: deal.value,
            status: deal.status,
            stage: deal.stage,
          }));

        // Recent activities (mock - would come from interactions table)
        const recentActivities = [
          {
            type: 'deal_created',
            description: 'New deal created',
            time: '2 hours ago',
            icon: '💼',
          },
          {
            type: 'contact_added',
            description: 'New contact added',
            time: '4 hours ago',
            icon: '👤',
          },
          {
            type: 'video_uploaded',
            description: `${videoCount} videos in library`,
            time: 'Today',
            icon: '🎬',
          },
          {
            type: 'website_updated',
            description: `${websiteCount} websites active`,
            time: 'Today',
            icon: '🌐',
          },
        ];

        setMetrics({
          totalContacts,
          activeDeals,
          totalRevenue,
          conversionRate,
          revenueData,
          pipelineData,
          topDeals,
          recentActivities,
        });
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardMetrics();
  }, [currentBusiness]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[#D4AF37]/20 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-[#D4AF37]/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-300 flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        {error}
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-[#D4AF37]/70">Welcome back to your business hub</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Invoices',
            description: 'Create, view, and manage billing in one place.',
            href: '/dashboard/invoices',
            icon: <Sparkles className="w-5 h-5" />,
          },
          {
            title: 'AI Assistant',
            description: 'Generate growth copy, campaigns, and messaging fast.',
            href: '/dashboard/ai',
            icon: <Zap className="w-5 h-5" />,
          },
          {
            title: 'Social Planner',
            description: 'Schedule posts for socials and keep your calendar full.',
            href: '/dashboard/social',
            icon: <MessageCircle className="w-5 h-5" />,
          },
          {
            title: 'Workflows',
            description: 'Automate follow-ups, reminders, and revenue triggers.',
            href: '/dashboard/workflows',
            icon: <ShoppingCart className="w-5 h-5" />,
          },
        ].map((card) => (
          <a
            key={card.title}
            href={card.href}
            className="group rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6 transition hover:border-[#D4AF37]/40 hover:bg-[#11151E]"
          >
            <div className="inline-flex items-center justify-center rounded-2xl bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
              {card.icon}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">{card.title}</h2>
            <p className="mt-2 text-sm text-[#D4AF37]/70">{card.description}</p>
          </a>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-[#D4AF37]/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#D4AF37]/70 text-sm font-medium">Total Revenue</h3>
            <DollarSign className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            ₦{(metrics.totalRevenue / 1000000).toFixed(1)}M
          </div>
          <p className="text-[#D4AF37]/50 text-sm">From {metrics.activeDeals} active deals</p>
        </div>

        {/* Active Deals */}
        <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-[#D4AF37]/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#D4AF37]/70 text-sm font-medium">Active Deals</h3>
            <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{metrics.activeDeals}</div>
          <p className="text-[#D4AF37]/50 text-sm">In negotiation or proposal</p>
        </div>

        {/* Total Contacts */}
        <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-[#D4AF37]/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#D4AF37]/70 text-sm font-medium">Total Contacts</h3>
            <Users className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{metrics.totalContacts}</div>
          <p className="text-[#D4AF37]/50 text-sm">In your CRM</p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-[#D4AF37]/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#D4AF37]/70 text-sm font-medium">Conversion Rate</h3>
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{metrics.conversionRate}%</div>
          <p className="text-[#D4AF37]/50 text-sm">Deals won vs total</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-[#D4AF37]/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D4AF37/20" />
              <XAxis stroke="#D4AF37/50" />
              <YAxis stroke="#D4AF37/50" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0E1116', border: '1px solid #D4AF37/30' }}
                labelStyle={{ color: '#D4AF37' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline by Stage */}
        <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-[#D4AF37]/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Pipeline by Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D4AF37/20" />
              <XAxis stroke="#D4AF37/50" />
              <YAxis stroke="#D4AF37/50" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0E1116', border: '1px solid #D4AF37/30' }}
                labelStyle={{ color: '#D4AF37' }}
              />
              <Bar dataKey="value" fill="#D4AF37" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Deals & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Deals */}
        <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-[#D4AF37]/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Deals</h3>
          <div className="space-y-3">
            {metrics.topDeals.map((deal, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[#0E1116] rounded-lg">
                <div>
                  <p className="text-white text-sm font-medium">{deal.title}</p>
                  <p className="text-[#D4AF37]/50 text-xs">{deal.stage}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">₦{(deal.value / 1000000).toFixed(1)}M</p>
                  <p className={`text-xs ${deal.status === 'won' ? 'text-green-400' : 'text-[#D4AF37]/50'}`}>
                    {deal.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-[#D4AF37]/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {metrics.recentActivities.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-[#0E1116] rounded-lg">
                <span className="text-xl">{activity.icon}</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{activity.description}</p>
                  <p className="text-[#D4AF37]/50 text-xs">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0E1116] border border-[#D4AF37]/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/dashboard/crm/contacts"
            className="p-4 rounded-lg bg-[#0E1116] hover:bg-[#D4AF37]/10 transition text-center"
          >
            <p className="text-2xl mb-2">👥</p>
            <p className="text-white text-sm font-medium">Add Contact</p>
          </a>
          <a
            href="/dashboard/crm/deals"
            className="p-4 rounded-lg bg-[#0E1116] hover:bg-[#D4AF37]/10 transition text-center"
          >
            <p className="text-2xl mb-2">💼</p>
            <p className="text-white text-sm font-medium">Create Deal</p>
          </a>
          <a
            href="/dashboard/invoices"
            className="p-4 rounded-lg bg-[#0E1116] hover:bg-[#D4AF37]/10 transition text-center"
          >
            <p className="text-2xl mb-2">📄</p>
            <p className="text-white text-sm font-medium">New Invoice</p>
          </a>
          <a
            href="/dashboard/videos"
            className="p-4 rounded-lg bg-[#0E1116] hover:bg-[#D4AF37]/10 transition text-center"
          >
            <p className="text-2xl mb-2">🎬</p>
            <p className="text-white text-sm font-medium">Upload Video</p>
          </a>
        </div>
      </div>
    </div>
  );
}
