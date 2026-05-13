import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, FolderOpen, CheckSquare, FileText, Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: business } = await supabase.from("businesses").select("*").eq("created_by", user.id).maybeSingle();
  if (!business) redirect("/onboarding");

  const [
    { count: contacts }, { count: deals },
    { count: subscriptions },  { count: transactions },
    { data: recentContacts }, { data: recentDeals },
  ] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("deals").select("*", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("business_id", business.id).eq("status", "active"),
    supabase.from("transactions").select("*", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("contacts").select("id,first_name,last_name,company_name,status").eq("business_id", business.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("deals").select("id,title,value,stage,status").eq("business_id", business.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = [
    { icon: Users,       label: "Contacts",     value: contacts ?? 0, color: "text-blue-400",   bg: "bg-blue-500/10",   href: "/crm/contacts"  },
    { icon: FolderOpen,  label: "Deals",        value: deals ?? 0, color: "text-purple-400", bg: "bg-purple-500/10", href: "/crm/deals" },
    { icon: CheckSquare, label: "Active Plans", value: subscriptions ?? 0, color: "text-green-400",  bg: "bg-green-500/10",  href: "/settings/billing"    },
    { icon: FileText,    label: "Transactions", value: transactions ?? 0, color: "text-yellow-400", bg: "bg-yellow-500/10", href: "/settings/billing" },
  ];

  const pc = (s: string) =>
    s === "high" || s === "urgent" ? "bg-red-500/20 text-red-400" :
    s === "medium"   ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400";

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-gray-400 text-sm mt-1">{business.name} · {business.country} · {business.currency}</p>
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
            <h2 className="text-sm font-semibold text-white">Recent Contacts</h2>
            <a href="/crm/contacts" className="flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400">
              <Plus className="w-3 h-3" /> Add
            </a>
          </div>
          {recentContacts?.length ? recentContacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
              <div>
                <p className="text-white text-sm">{c.first_name} {c.last_name}</p>
                <p className="text-gray-500 text-xs">{c.company_name ?? "—"}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>{c.status}</span>
            </div>
          )) : <p className="text-gray-500 text-sm">No contacts yet. <a href="/crm/contacts" className="text-yellow-500">Add one →</a></p>}
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Deals</h2>
            <a href="/crm/deals" className="flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400">
              <Plus className="w-3 h-3" /> Add
            </a>
          </div>
          {recentDeals?.length ? recentDeals.map((d) => (
            <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
              <div className="flex-1">
                <p className="text-white text-sm truncate max-w-[200px]">{d.title}</p>
                <p className="text-gray-500 text-xs">${d.value?.toLocaleString()}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${pc(d.stage)}`}>{d.stage}</span>
            </div>
          )) : <p className="text-gray-500 text-sm">No deals yet. <a href="/crm/deals" className="text-yellow-500">Create one →</a></p>}
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Business Details</h2>
        <div className="grid grid-cols-4 gap-4">
          {[["Name", business.name], ["Slug", business.slug || "—"], ["Industry", business.industry || "—"],
            ["Country", business.country || "—"], ["Currency", business.currency || "—"], ["Timezone", business.timezone || "—"],
            ["Team Size", business.team_size || "—"], ["Created", new Date(business.created_at).toLocaleDateString()],
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
