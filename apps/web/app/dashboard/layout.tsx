'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
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
  Menu,
  X,
  Plug,
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
  { href: '/dashboard/integrations', label: 'Integrations', icon: Plug },
  { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings2 },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#07070A] via-[#0E1116] to-[#07070A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-[#C8FF00]/20 border-t-[#C8FF00] rounded-full animate-spin"></div>
          <p className="text-[#C8FF00]/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07070A] via-[#0E1116] to-[#07070A]">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#C8FF00]/10 bg-[#0E1116]/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-[#C8FF00]/10">
            <Image src="/brand/ogmj-mark.png" alt="OGMJ Brands" width={36} height={36} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">OGMJ BRANDS</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Enterprise BOS</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#C8FF00]/15 bg-white/5 text-white transition hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Overlay for mobile drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 transform overflow-y-auto border-r border-[#C8FF00]/10 bg-[#0E1116] transition-transform duration-200 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 space-y-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-3xl bg-gold/10">
                  <Image src="/brand/ogmj-mark.png" alt="OGMJ Brands" width={48} height={48} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">OGMJ BRANDS</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Enterprise BOS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation"
                className="flex h-9 w-9 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="space-y-2">
            {dashboardNav.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? 'bg-[#C8FF00]/10 text-white ring-1 ring-inset ring-[#C8FF00]/30'
                      : 'text-slate-200 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition ${active ? 'text-[#C8FF00]' : 'text-gold group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="rounded-[2rem] border border-white/10 bg-[#07070A] p-4 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C8FF00]/15 text-gold">
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
      <main className="p-4 sm:p-6 lg:ml-72 lg:p-8">
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

