'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Briefcase,
  Video,
  Layers,
  BarChart3,
  Cpu,
  MessageSquare,
  Sparkles,
  LifeBuoy,
  Settings2,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { BusinessProvider } from '@/lib/context/BusinessContext';

const dashboardNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/invoices', label: 'Invoices', icon: Receipt },
  { href: '/dashboard/crm/contacts', label: 'Contacts', icon: Users },
  { href: '/dashboard/crm/deals', label: 'Deals', icon: Briefcase },
  { href: '/dashboard/videos', label: 'Videos', icon: Video },
  { href: '/dashboard/builder', label: 'Builder', icon: Layers },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/ai', label: 'AI', icon: Cpu },
  { href: '/dashboard/social', label: 'Social', icon: MessageSquare },
  { href: '/dashboard/workflows', label: 'Workflows', icon: Sparkles },
  { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings2 },
];

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      console.log("🔐 [DASHBOARD] Checking authentication...");
      const currentUser = await getCurrentUser();
      console.log("🔐 [DASHBOARD] Current user result:", !!currentUser, currentUser?.email);
      
      if (!currentUser) {
        console.error("❌ [DASHBOARD] No user found, redirecting to login");
        router.push('/login');
        return;
      }
      
      console.log("🔐 [DASHBOARD] User authenticated, setting state");
      setUser(currentUser);
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#07070A] via-[#0E1116] to-[#07070A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
          <p className="text-[#D4AF37]/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07070A] via-[#0E1116] to-[#07070A]">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 w-72 h-screen bg-[#0E1116] border-r border-[#D4AF37]/10 overflow-y-auto">
        <div className="p-6 space-y-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gold/10 text-gold">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">OGMJ BRANDS</p>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Enterprise BOS</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {dashboardNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
                >
                  <Icon className="h-5 w-5 text-gold transition group-hover:text-white" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="rounded-[2rem] border border-white/10 bg-[#07070A] p-4 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4AF37]/15 text-gold">
                <span className="text-sm font-semibold">{user?.email?.[0].toUpperCase() || 'U'}</span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user?.email}</p>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Verified partner</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-[#11161E]/90 p-3 text-sm text-slate-300">
              <p className="font-medium text-white">Enterprise access</p>
              <p className="mt-1 text-xs text-slate-400">Control growth, automation, and analytics from one premium portal.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BusinessProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </BusinessProvider>
  );
}

