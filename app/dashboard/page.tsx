'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, ShoppingCart, AlertCircle, Sparkles, MessageCircle, Zap, BarChart3, Mail, Package, Rocket, BrainCircuit, ShieldCheck, Workflow, Compass } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { useFeatureFlags } from '@/lib/hooks';
import { listContacts, listDeals } from '@/lib/services/crm';
import { getVideos } from '@/lib/services/videos.service';
import { getWebsites } from '@/lib/services/builder.service';
import { MetricCard, ModuleCard, SectionPanel } from '@/components/dashboard/EmpireCards';

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
          <div className="h-8 bg-[#C8FF00]/20 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-[#C8FF00]/20 rounded"></div>
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
      <div className="rounded-[2rem] border border-[#C8FF00]/10 bg-[radial-gradient(circle_at_top_left,_rgba(200, 255, 0,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/20 bg-[#C8FF00]/10 px-4 py-2 text-sm text-[#C8FF00]">
              <Rocket className="h-4 w-4" /> Executive Command Center
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Build your empire from one premium operating surface.</h1>
            <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Track revenue, orchestrate growth, move deals, launch campaigns and keep every team aligned in real time.</p>
          </div>
          <div className="rounded-[1.5rem] border border-[#C8FF00]/10 bg-[#11151E]/90 p-4 text-sm text-[#F8F9FA]/70">
            <p className="font-semibold text-white">Business health score</p>
            <p className="mt-2">Excellent momentum with strong conversion signals and rising automation coverage.</p>
          </div>
        </div>
      </div>

      <FeatureGatingSection businessId={currentBusiness?.id || ''} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total revenue" value={`₦${(metrics.totalRevenue / 1000000).toFixed(1)}M`} description={`From ${metrics.activeDeals} active deals`} icon={DollarSign} accent="gold" trend="+12%" />
        <MetricCard title="Active deals" value={metrics.activeDeals.toString()} description="In proposal, negotiation or decision" icon={ShoppingCart} accent="emerald" trend="Healthy" />
        <MetricCard title="Contacts in CRM" value={metrics.totalContacts.toString()} description="Tracked prospects and customers" icon={Users} accent="slate" trend="Live" />
        <MetricCard title="Conversion rate" value={`${metrics.conversionRate}%`} description="Deals won versus total opportunities" icon={TrendingUp} accent="gold" trend="Strong" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionPanel title="Revenue intelligence" subtitle="Growth signals and pipeline momentum" actionLabel="Open analytics" actionHref="/dashboard/analytics">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#C8FF00/20" />
              <XAxis stroke="#C8FF00/50" />
              <YAxis stroke="#C8FF00/50" />
              <Tooltip contentStyle={{ backgroundColor: '#0E1116', border: '1px solid rgba(200, 255, 0,0.3)' }} labelStyle={{ color: '#C8FF00' }} />
              <Line type="monotone" dataKey="revenue" stroke="#C8FF00" strokeWidth={2.8} dot={{ r: 3, fill: '#C8FF00' }} />
            </LineChart>
          </ResponsiveContainer>
        </SectionPanel>

        <SectionPanel title="Growth modules" subtitle="Every core operating layer at your fingertips">
          <div className="grid gap-3 sm:grid-cols-2">
            <ModuleCard title="AI assistant" description="Strategic prompts, campaigns and next steps" icon={BrainCircuit} href="/dashboard/ai" badge="AI" />
            <ModuleCard title="CRM" description="Leads, deals and customer relationships" icon={Users} href="/dashboard/crm/contacts" badge="Live" />
            <ModuleCard title="Builder" description="Launch pages, funnels and offers" icon={Compass} href="/dashboard/builder" badge="Launch" />
            <ModuleCard title="Automation" description="Workflows, reminders and actions" icon={Workflow} href="/dashboard/workflows" badge="Flow" />
          </div>
        </SectionPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionPanel title="Pipeline by stage" subtitle="Convert momentum into predictable growth" actionLabel="Open CRM" actionHref="/dashboard/crm/deals">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={metrics.pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#C8FF00/20" />
              <XAxis stroke="#C8FF00/50" />
              <YAxis stroke="#C8FF00/50" />
              <Tooltip contentStyle={{ backgroundColor: '#0E1116', border: '1px solid rgba(200, 255, 0,0.3)' }} labelStyle={{ color: '#C8FF00' }} />
              <Bar dataKey="value" fill="#C8FF00" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionPanel>

        <SectionPanel title="Next-best actions" subtitle="Launch faster with one-click operating moves">
          <div className="grid gap-3">
            <a href="/dashboard/crm/contacts" className="rounded-[1.2rem] border border-[#C8FF00]/10 bg-[#11151E] p-4 hover:border-[#C8FF00]/40">
              <p className="text-sm font-semibold text-white">Add a new contact</p>
              <p className="mt-1 text-sm text-[#F8F9FA]/60">Capture new demand and assign a follow-up sequence instantly.</p>
            </a>
            <a href="/dashboard/invoices" className="rounded-[1.2rem] border border-[#C8FF00]/10 bg-[#11151E] p-4 hover:border-[#C8FF00]/40">
              <p className="text-sm font-semibold text-white">Issue an invoice</p>
              <p className="mt-1 text-sm text-[#F8F9FA]/60">Keep revenue moving and automate your billing flow.</p>
            </a>
            <a href="/dashboard/videos" className="rounded-[1.2rem] border border-[#C8FF00]/10 bg-[#11151E] p-4 hover:border-[#C8FF00]/40">
              <p className="text-sm font-semibold text-white">Launch content</p>
              <p className="mt-1 text-sm text-[#F8F9FA]/60">Publish a new video or asset into your brand studio.</p>
            </a>
          </div>
        </SectionPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionPanel title="Top deals" subtitle="Your highest-value opportunities">
          <div className="space-y-3">
            {metrics.topDeals.map((deal, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-[1.2rem] border border-[#C8FF00]/10 bg-[#11151E] p-3">
                <div>
                  <p className="text-sm font-semibold text-white">{deal.title}</p>
                  <p className="text-xs text-[#C8FF00]/60">{deal.stage}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">₦{(deal.value / 1000000).toFixed(1)}M</p>
                  <p className={`text-xs ${deal.status === 'won' ? 'text-[#10B981]' : 'text-[#C8FF00]/60'}`}>{deal.status}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Operating pulse" subtitle="Key activity and momentum from your stack">
          <div className="space-y-3">
            {metrics.recentActivities.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-[1.2rem] border border-[#C8FF00]/10 bg-[#11151E] p-3">
                <span className="text-lg">{activity.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{activity.description}</p>
                  <p className="text-xs text-[#C8FF00]/60">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}

// Feature Gating Section Component
function FeatureGatingSection({ businessId }: { businessId: string }) {
  const router = useRouter();
  const { isFeatureEnabled, loading, planId } = useFeatureFlags(businessId);

  if (!businessId || loading) return null;

  const features = [
    {
      name: 'Leads Management',
      description: 'Track and manage sales leads',
      icon: Users,
      enabled: isFeatureEnabled('leads_management'),
      path: '/dashboard/leads',
      badge: 'Pro+',
    },
    {
      name: 'Appointment Booking',
      description: 'Calendar and meeting management',
      icon: BarChart3,
      enabled: isFeatureEnabled('appointment_booking'),
      path: '/dashboard/appointments',
      badge: 'Pro+',
    },
    {
      name: 'Email Sequences',
      description: 'Automate email campaigns',
      icon: Mail,
      enabled: isFeatureEnabled('email_sequences'),
      path: '/dashboard/sequences',
      badge: 'Pro+',
    },
    {
      name: 'Team Messaging',
      description: 'Collaborate with your team',
      icon: MessageCircle,
      enabled: isFeatureEnabled('team_messaging'),
      path: '/dashboard/inbox',
      badge: 'Business+',
    },
    {
      name: 'Product Catalog',
      description: 'Manage products and inventory',
      icon: Package,
      enabled: isFeatureEnabled('product_catalog'),
      path: '/dashboard/products',
      badge: 'Business+',
    },
  ];

  const enabledFeatures = features.filter(f => f.enabled);
  const disabledFeatures = features.filter(f => !f.enabled);

  return (
    <div className="space-y-6">
      {enabledFeatures.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Available Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enabledFeatures.map(feature => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.name}
                  onClick={() => router.push(feature.path)}
                  className="backdrop-blur-md bg-[#0E1116]/50 border border-[#C8FF00]/20 rounded-lg p-4 hover:border-[#C8FF00]/50 hover:bg-[#0E1116]/70 transition text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-[#C8FF00]/20 group-hover:bg-[#C8FF00]/30 rounded transition">
                      <Icon className="w-5 h-5 text-[#C8FF00]" />
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Active</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm">{feature.name}</h3>
                  <p className="text-xs text-[#C8FF00]/70 mt-1">{feature.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {disabledFeatures.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Unlock More Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {disabledFeatures.map(feature => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.name}
                  className="backdrop-blur-md bg-[#0E1116]/30 border border-[#C8FF00]/10 rounded-lg p-4 opacity-60"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-[#C8FF00]/10 rounded">
                      <Icon className="w-5 h-5 text-[#C8FF00]/50" />
                    </div>
                    <span className="text-xs px-2 py-1 bg-[#C8FF00]/10 text-[#C8FF00]/50 rounded">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white/50 text-sm">{feature.name}</h3>
                  <p className="text-xs text-[#C8FF00]/50 mt-1">{feature.description}</p>
                  <a
                    href="/dashboard/settings/billing"
                    className="mt-3 inline-block text-xs px-2 py-1 bg-[#C8FF00]/20 text-[#C8FF00]/70 rounded hover:bg-[#C8FF00]/30"
                  >
                    Upgrade Plan
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


