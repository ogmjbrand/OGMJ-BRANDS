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
  type RecentContact,
  type RevenueData,
} from '@/lib/services/analytics.service';
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards';

const timeframes = ['7d', '30d', '90d', '1y'];

export default function AnalyticsPage() {
  const { currentBusiness } = useBusinessContext();
  const [timeframe, setTimeframe] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [pipelineData, setPipelineData] = useState<DealPipelineData | null>(null);
  const [topContacts, setTopContacts] = useState<RecentContact[]>([]);

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

      if (revenueResult.success && revenueResult.data) {
        setRevenueData(revenueResult.data);
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
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#C8FF00]/20 border-t-[#C8FF00]" />
          <p className="text-[#C8FF00]/70">Loading analytics...</p>
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
            className="rounded-full bg-[#C8FF00] px-4 py-2 font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90"
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

  const chartData = (revenueData?.monthlyBreakdown || []).map((item) => {
    const [year, month] = item.month.split('-');
    const label = year && month
      ? new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'short' })
      : item.month;
    return { name: label, revenue: item.amount };
  });

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
      trend: 'Live',
    },
    {
      title: 'Active deals',
      value: `${activeDeals}`,
      description: 'Opportunities in active motion',
      icon: Target,
      accent: 'emerald' as const,
      trend: 'Live',
    },
    {
      title: 'New contacts',
      value: `${overview.newContacts ?? 0}`,
      description: 'Fresh prospects and customer touchpoints',
      icon: Users,
      accent: 'slate' as const,
      trend: 'Live',
    },
    {
      title: 'Conversion rate',
      value: `${Math.round((pipelineData?.conversionRate ?? 0) * 100)}%`,
      description: 'Won deals versus total opportunities',
      icon: TrendingUp,
      accent: 'gold' as const,
      trend: 'Live',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#C8FF00]/10 bg-[radial-gradient(circle_at_top_left,_rgba(200, 255, 0,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/20 bg-[#C8FF00]/10 px-4 py-2 text-sm text-[#C8FF00]">
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
                    ? 'bg-[#C8FF00] text-[#07070A]'
                    : 'bg-[#C8FF00]/10 text-[#C8FF00] hover:bg-[#C8FF00]/20'
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
          {chartData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 255, 0,0.16)" />
                  <XAxis dataKey="name" stroke="#C8FF00/60" />
                  <YAxis stroke="#C8FF00/60" />
                  <Tooltip contentStyle={{ backgroundColor: '#0E1116', border: '1px solid rgba(200, 255, 0,0.3)' }} labelStyle={{ color: '#C8FF00' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#C8FF00" strokeWidth={3} dot={{ r: 3, fill: '#C8FF00' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[280px] items-center justify-center">
              <p className="text-sm text-[#C8FF00]/60">No revenue data for this period yet.</p>
            </div>
          )}
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
                    <span className="text-[#C8FF00]">{item.count} deals</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#07070A]">
                    <div className={`h-full rounded-full bg-[#C8FF00] ${widthClass}`} />
                  </div>
                </div>
              );
            }) : <p className="text-sm text-[#C8FF00]/60">No pipeline data is available yet.</p>}
          </div>
        </SectionPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionPanel title="Recent contacts" subtitle="Who is moving through your funnel right now">
          <div className="space-y-3">
            {topContacts.length > 0 ? topContacts.map((contact: any, index: number) => (
              <div key={`${contact.email ?? 'contact'}-${index}`} className="flex items-center justify-between rounded-[1.2rem] border border-[#C8FF00]/10 bg-[#11151E] p-4">
                <div>
                  <p className="text-sm font-semibold text-white">{contact.first_name ?? 'New'} {contact.last_name ?? 'contact'}</p>
                  <p className="mt-1 text-xs text-[#C8FF00]/60">{contact.status ?? 'Active'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#C8FF00]">{contact.email ?? '—'}</p>
                  <p className="mt-1 text-xs text-[#F8F9FA]/50">Priority lead</p>
                </div>
              </div>
            )) : <p className="text-sm text-[#C8FF00]/60">No recent contacts have been captured yet.</p>}
          </div>
        </SectionPanel>

        <SectionPanel title="Revenue by source" subtitle="Where this period's revenue actually came from">
          <div className="space-y-3">
            {revenueData && (revenueData.bySource.transactions > 0 || revenueData.bySource.deals > 0) ? (
              <>
                <div className="flex items-center justify-between rounded-[1.2rem] border border-[#C8FF00]/10 bg-[#11151E] p-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Payments &amp; subscriptions</p>
                    <p className="mt-1 text-sm text-[#F8F9FA]/60">Completed transactions this period</p>
                  </div>
                  <div className="flex items-center gap-2 text-[#C8FF00]">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm font-semibold">${Number(revenueData.bySource.transactions).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-[1.2rem] border border-[#C8FF00]/10 bg-[#11151E] p-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Won deals</p>
                    <p className="mt-1 text-sm text-[#F8F9FA]/60">Closed CRM opportunities this period</p>
                  </div>
                  <div className="flex items-center gap-2 text-[#C8FF00]">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm font-semibold">${Number(revenueData.bySource.deals).toLocaleString()}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-[#C8FF00]/60">No revenue recorded for this period yet.</p>
            )}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}


