'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { BusinessProvider } from '@/lib/context/BusinessContext';

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
      <aside className="fixed left-0 top-0 w-64 h-screen bg-[#0E1116] border-r border-[#D4AF37]/10 overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Logo */}
          <div>
            <h2 className="text-2xl font-bold text-[#D4AF37]">OGMJ</h2>
            <p className="text-xs text-[#D4AF37]/50">BRANDS</p>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            <NavItem icon="📊" label="Dashboard" href="/dashboard" />
            <NavItem icon="👥" label="Contacts" href="/dashboard/crm/contacts" />
            <NavItem icon="💼" label="Deals" href="/dashboard/crm/deals" />
            <NavItem icon="🎬" label="Videos" href="/dashboard/videos" />
            <NavItem icon="🎨" label="Builder" href="/dashboard/builder" />
            <NavItem icon="📈" label="Analytics" href="/dashboard/analytics" />
            <NavItem icon="💬" label="Support" href="/dashboard/support" />
            <NavItem icon="⚙️" label="Settings" href="/dashboard/settings" />
          </nav>

          {/* User Section */}
          <div className="border-t border-[#D4AF37]/10 pt-6">
            <div className="flex items-center gap-3 p-3 bg-[#07070A] rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <span className="text-sm font-bold text-[#D4AF37]">
                  {user?.email?.[0].toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                <p className="text-xs text-[#D4AF37]/50">Account</p>
              </div>
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

function NavItem({
  icon,
  label,
  href,
}: {
  icon: string;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#07070A] transition"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </a>
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
