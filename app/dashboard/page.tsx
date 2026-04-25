import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, FolderOpen, CheckSquare, FileText, Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: business } = await supabase.from("businesses").select("*").eq("owner_id", user.id).maybeSingle();
  if (!business) redirect("/onboarding/step-2");

  const [
    { count: clients }, { count: projects },
    { count: tasks },  { count: invoices },
    { data: recentClients }, { data: recentTasks },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("business_id", business.id).eq("status", "todo"),
    supabase.from("client_invoices").select("*", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("clients").select("id,name,company,status").eq("business_id", business.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("tasks").select("id,title,priority,status").eq("business_id", business.id).neq("status", "completed").order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = [
    { icon: Users,       label: "Clients",    value: clients  ?? 0, color: "text-blue-400",   bg: "bg-blue-500/10",   href: "/dashboard/clients"  },
    { icon: FolderOpen,  label: "Projects",   value: projects ?? 0, color: "text-purple-400", bg: "bg-purple-500/10", href: "/dashboard/projects" },
    { icon: CheckSquare, label: "Open Tasks", value: tasks    ?? 0, color: "text-green-400",  bg: "bg-green-500/10",  href: "/dashboard/tasks"    },
    { icon: FileText,    label: "Invoices",   value: invoices ?? 0, color: "text-yellow-400", bg: "bg-yellow-500/10", href: "/dashboard/invoices" },
  ];

  const pc = (p: string) =>
    p === "urgent" ? "bg-red-500/20 text-red-400" :
    p === "high"   ? "bg-orange-500/20 text-orange-400" :
    p === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400";

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-gray-400 text-sm mt-1">{business.business_name} · {business.country} · {business.currency}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(({ icon: Icon, label, value, color, bg, href }) => (
          <a key={label} href={href} className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Clients</h2>
            <a href="/dashboard/clients/new" className="flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400">
              <Plus className="w-3 h-3" /> Add
            </a>
          </div>
          {recentClients?.length ? recentClients.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
              <div>
                <p className="text-white text-sm">{c.name}</p>
                <p className="text-gray-500 text-xs">{c.company ?? "—"}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>{c.status}</span>
            </div>
          )) : <p className="text-gray-500 text-sm">No clients yet. <a href="/dashboard/clients/new" className="text-yellow-500">Add one →</a></p>}
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Open Tasks</h2>
            <a href="/dashboard/tasks/new" className="flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400">
              <Plus className="w-3 h-3" /> Add
            </a>
          </div>
          {recentTasks?.length ? recentTasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
              <p className="text-white text-sm truncate max-w-[200px]">{t.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${pc(t.priority)}`}>{t.priority}</span>
            </div>
          )) : <p className="text-gray-500 text-sm">No tasks yet. <a href="/dashboard/tasks/new" className="text-yellow-500">Create one →</a></p>}
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Business Details</h2>
        <div className="grid grid-cols-4 gap-4">
          {[["Name", business.business_name], ["Industry", business.industry || "—"], ["Country", business.country || "—"],
            ["Currency", business.currency || "—"], ["Type", business.type?.replace("_", " ")], ["Status", business.status],
            ["Timezone", business.timezone || "—"], ["Onboarding", business.onboarding_completed ? "Complete" : "In Progress"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-gray-500 mb-0.5">{k}</p>
              <p className="text-white text-sm font-medium capitalize">{v ?? "—"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
