'use client'

import { BarChart3, DollarSign, Users, Zap } from 'lucide-react'

const PREVIEWS = [
  {
    title: 'Executive Dashboard',
    description: 'Revenue, contacts, deals, and activity in one view.',
    icon: BarChart3,
    stats: [
      { label: 'Revenue', value: '$124,500' },
      { label: 'Contacts', value: '1,247' },
      { label: 'Active Deals', value: '38' },
      { label: 'Conversion', value: '24%' },
    ],
  },
  {
    title: 'CRM Pipeline',
    description: 'Drag-and-drop deal stages with real-time values.',
    icon: DollarSign,
    stages: [
      { name: 'Prospecting', count: 12, value: '$45K' },
      { name: 'Proposal', count: 8, value: '$82K' },
      { name: 'Negotiation', count: 5, value: '$120K' },
      { name: 'Closed Won', count: 3, value: '$67K' },
    ],
  },
  {
    title: 'Workflow Automation',
    description: 'AI-powered sequences running across your ops.',
    icon: Zap,
    workflows: [
      { name: 'New lead welcome', status: 'Active', runs: 142 },
      { name: 'Deal follow-up', status: 'Active', runs: 89 },
      { name: 'Invoice reminder', status: 'Active', runs: 56 },
    ],
  },
  {
    title: 'Contact Management',
    description: 'Full contact profiles with interaction history.',
    icon: Users,
    contacts: [
      { name: 'Sarah Mitchell', company: 'NovaBridge', status: 'Customer' },
      { name: 'James Chen', company: 'Meridian Labs', status: 'Prospect' },
      { name: 'Elena Rodriguez', company: 'Crestline', status: 'Lead' },
    ],
  },
]

export default function ProductPreview() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {PREVIEWS.map((preview) => {
        const Icon = preview.icon
        return (
          <div
            key={preview.title}
            className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0B1119]/95 shadow-2xl shadow-black/30"
          >
            <div className="border-b border-white/10 bg-[#06090F] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <span className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-slate-500">ogmj-brands.com/dashboard</span>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-white">{preview.title}</p>
                  <p className="text-xs text-slate-400">{preview.description}</p>
                </div>
              </div>

              {'stats' in preview && preview.stats && (
                <div className="grid grid-cols-2 gap-3">
                  {preview.stats.map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-white/5 bg-white/5 p-3">
                      <p className="text-xs text-slate-400">{stat.label}</p>
                      <p className="mt-1 text-lg font-semibold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {'stages' in preview && preview.stages && (
                <div className="space-y-2">
                  {preview.stages.map((stage) => (
                    <div key={stage.name} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-2.5">
                      <div>
                        <p className="text-sm text-white">{stage.name}</p>
                        <p className="text-xs text-slate-400">{stage.count} deals</p>
                      </div>
                      <p className="text-sm font-semibold text-gold">{stage.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {'workflows' in preview && preview.workflows && (
                <div className="space-y-2">
                  {preview.workflows.map((wf) => (
                    <div key={wf.name} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-2.5">
                      <div>
                        <p className="text-sm text-white">{wf.name}</p>
                        <p className="text-xs text-emerald-400">{wf.status}</p>
                      </div>
                      <p className="text-xs text-slate-400">{wf.runs} runs</p>
                    </div>
                  ))}
                </div>
              )}

              {'contacts' in preview && preview.contacts && (
                <div className="space-y-2">
                  {preview.contacts.map((contact) => (
                    <div key={contact.name} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-2.5">
                      <div>
                        <p className="text-sm text-white">{contact.name}</p>
                        <p className="text-xs text-slate-400">{contact.company}</p>
                      </div>
                      <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">{contact.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

