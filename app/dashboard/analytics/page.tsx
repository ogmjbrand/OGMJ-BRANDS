'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Sparkles,
  AlertCircle,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import {
  getDashboardMetrics,
  getRevenueData,
  getDealPipelineData,
  getTopContacts,
  type DealPipelineData,
} from '@/lib/services/analytics.service';
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards';

const timeframes = ['7d', '30d', '90d', '1y'];

export default function AnalyticsPage() {
  const { currentBusiness } = useBusinessContext();
  const [timeframe, setTimeframe] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [pipelineData, setPipelineData] = useState<DealPipelineData | null>(null);
  const [topContacts, setTopContacts] = useState<any[]>([]);

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
        setRevenueData(Array.isArray(revenueResult.data) ? revenueResult.data : []);
      }

      if (pipelineResult.success && pipelineResult.data) {
        setPipelineData(pipelineResult.data);
      }

      if (contactsResult.success) {
        setTopContacts(Array.isArray(contactsResult.data) ? contactsResult.data : []);
      }

      const failedRequests = [metricsResult, revenueResult, pipelineResult, contactsResult].filter(
        (result) => !result.success
      );

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
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#D4AF37]/20 border-t-[#D4AF37]" />
          <p className="text-[#D4AF37]/70">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="space-y-4 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={loadAnalytics}
            className="rounded-full bg-[#D4AF37] px-4 py-2 font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const overview = metrics?.overview ?? {};
  const activeDeals = pipelineData
    ? Object.values(pipelineData).reduce((total: number, value: number) => total + value, 0)
    : 0;

  const chartData = revenueData.length
    ? revenueData.map((item: any, index: number) => ({
        name: item.name ?? item.period ?? item.label ?? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][index] ?? `P${index + 1}`,
        revenue: item.revenue ?? item.value ?? item.amount ?? 0,
      }))
    : [
        { name: 'Mon', revenue: 24 },
        { name: 'Tue', revenue: 38 },
        { name: 'Wed', revenue: 29 },
        { name: 'Thu', revenue: 50 },
        { name: 'Fri', revenue: 44 },
        { name: 'Sat', revenue: 62 },
        { name: 'Sun', revenue: 58 },
      ];

  const pipelineSeries = pipelineData
    ? [
        { stage: 'Prospecting', count: pipelineData.prospecting || 0 },
        { stage: 'Qualification', count: pipelineData.qualification || 0 },
        { stage: 'Proposal', count: pipelineData.proposal || 0 },
        { stage: 'Negotiation', count: pipelineData.negotiation || 0 },
        { stage: 'Decision', count: pipelineData.decision || 0 },
      ]
    : [];

  const metricsData = [
    {
      title: 'Total revenue',
      value: overview.totalRevenue ? `$${Number(overview.totalRevenue).toLocaleString()}` : '$0',
      description: 'Revenue generated across the current period',
      icon: DollarSign,
      accent: 'gold' as const,
      trend: '+12.5%',
    },
    {
      title: 'Active deals',
      value: `${activeDeals}`,
      description: 'Opportunities in active motion',
      icon: Target,
      accent: 'emerald' as const,
      trend: '+3 this month',
    },
    {
      title: 'New contacts',
      value: `${overview.newContacts ?? 0}`,
      description: 'Fresh prospects and customer touchpoints',
      icon: Users,
      accent: 'slate' as const,
      trend: '+180 this month',
    },
    {
      title: 'Conversion rate',
      value: '32%',
      description: 'Deals converted versus opportunities',
      icon: TrendingUp,
      accent: 'gold' as const,
      trend: '+2.1%',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#D4AF37]/10 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
              <Sparkles className="h-4 w-4" /> Intelligence overview
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Analytics that read like a boardroom briefing.</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#F8F9FA]/70">Track performance, monitor momentum and translate data into your next growth move.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {timeframes.map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricsData.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionPanel title="Revenue trend" subtitle="Momentum across the selected range" actionLabel="View reports" actionHref="/dashboard/analytics">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.16)" />
                <XAxis dataKey="name" stroke="#D4AF37/60" />
                <YAxis stroke="#D4AF37/60" />
                <Tooltip contentStyle={{ backgroundColor: '#0E1116', border: '1px solid rgba(212,175,55,0.3)' }} labelStyle={{ color: '#D4AF37' }} />
                <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} dot={{ r: 3, fill: '#D4AF37' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionPanel>

        <SectionPanel title="Pipeline distribution" subtitle="Where your next revenue is most likely to come from">
          <div className="space-y-4">
            {pipelineSeries.length > 0 ? pipelineSeries.map((item) => {
              const total = pipelineSeries.reduce((sum, entry) => sum + entry.count, 0);
              const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
              const widthClass =
                percent <= 0
                  ? 'w-0'
                  : percent <= 25
                    ? 'w-1/4'
                    : percent <= 50
                      ? 'w-2/4'
                      : percent <= 75
                        ? 'w-3/4'
                        : 'w-full';

              return (
                <div key={item.stage} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-white">{item.stage}</span>
                    <span className="text-[#D4AF37]">{item.count} deals</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#07070A]">
                    <div className={`h-full rounded-full bg-[#D4AF37] ${widthClass}`} />
                  </div>
                </div>
              );
            }) : <p className="text-sm text-[#D4AF37]/60">No pipeline data is available yet.</p>}
          </div>
        </SectionPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionPanel title="Recent contacts" subtitle="Who is moving through your funnel right now">
          <div className="space-y-3">
            {topContacts.length > 0 ? topContacts.map((contact: any, index: number) => (
              <div key={`${contact.email ?? 'contact'}-${index}`} className="flex items-center justify-between rounded-[1.2rem] border border-[#D4AF37]/10 bg-[#11151E] p-4">
                <div>
                  <p className="text-sm font-semibold text-white">{contact.first_name ?? 'New'} {contact.last_name ?? 'contact'}</p>
                  <p className="mt-1 text-xs text-[#D4AF37]/60">{contact.status ?? 'Active'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#D4AF37]">{contact.email ?? '—'}</p>
                  <p className="mt-1 text-xs text-[#F8F9FA]/50">Priority lead</p>
                </div>
              </div>
            )) : <p className="text-sm text-[#D4AF37]/60">No recent contacts have been captured yet.</p>}
          </div>
        </SectionPanel>

        <SectionPanel title="Operating pulse" subtitle="Key actions and momentum this week">
          <div className="space-y-3">
            {[
              { label: 'New offers launched', value: '3', detail: 'Premium offers are converting well' },
              { label: 'Automations active', value: '8', detail: 'Follow-ups and reminders are running' },
              { label: 'Content shipped', value: '12', detail: 'A strong publishing cadence is in motion' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-[1.2rem] border border-[#D4AF37]/10 bg-[#11151E] p-4">
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-sm text-[#F8F9FA]/60">{item.detail}</p>
                </div>
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm font-semibold">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}

