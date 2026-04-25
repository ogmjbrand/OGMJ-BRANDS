import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Building2, Users, FolderOpen, CheckSquare,
  TrendingUp, LogOut, FileText, Briefcase, Settings, UserCheck,
} from "lucide-react";

const navItems = [
  { icon: TrendingUp,  label: "Overview",  href: "/dashboard" },
  { icon: Users,       label: "Clients",   href: "/dashboard/clients" },
  { icon: FolderOpen,  label: "Projects",  href: "/dashboard/projects" },
  { icon: CheckSquare, label: "Tasks",     href: "/dashboard/tasks" },
  { icon: FileText,    label: "Invoices",  href: "/dashboard/invoices" },
  { icon: Briefcase,   label: "Services",  href: "/dashboard/services" },
  { icon: UserCheck,   label: "Team",      href: "/dashboard/team" },
  { icon: Settings,    label: "Settings",  href: "/dashboard/settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, business_name, type")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) redirect("/onboarding/step-2");

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-56 bg-[#161616] border-r border-gray-800 flex flex-col z-40">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-black" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {business.business_name}
              </p>
              <p className="text-gray-500 text-xs capitalize">
                {business.type?.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, href }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                text-gray-400 hover:bg-gray-800 hover:text-white transition-colors group"
            >
              <Icon className="w-4 h-4 flex-shrink-0 group-hover:text-yellow-500 transition-colors" />
              {label}
            </a>
          ))}
        </nav>

        {/* User + signout */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
            <div className="w-7 h-7 bg-yellow-500/20 rounded-full flex items-center justify-center text-xs font-bold text-yellow-500 flex-shrink-0">
              {user.email?.[0]?.toUpperCase()}
            </div>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                text-gray-500 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 min-h-screen">{children}</main>
    </div>
  );
}
