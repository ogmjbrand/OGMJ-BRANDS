'use client';

import React, { useState } from 'react';
import { Zap, GitBranch, Send, RefreshCcw, Sparkles, CheckCircle2, PlayCircle } from 'lucide-react';
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards';

const initialWorkflows = [
  {
    id: 'workflow-1',
    name: 'New Lead Nurture',
    trigger: 'Lead created',
    action: 'Send welcome email and assign score',
    status: 'Active',
  },
  {
    id: 'workflow-2',
    name: 'Invoice Reminder',
    trigger: 'Invoice overdue',
    action: 'Send payment reminder + CRM note',
    status: 'Paused',
  },
  {
    id: 'workflow-3',
    name: 'Launch Follow-up',
    trigger: 'Campaign published',
    action: 'Notify the team and schedule next touchpoint',
    status: 'Active',
  },
];

export default function WorkflowsPage() {
  const [workflows] = useState(initialWorkflows);

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#D4AF37]/10 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
            <Zap className="h-4 w-4" /> Automation layer
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Automations that keep your empire moving while you focus on growth.</h1>
          <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Turn customer moments into responsive workflows that feel polished, intelligent and easy to trust.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Active automations" value="12" description="High-value flows currently live" icon={PlayCircle} accent="gold" trend="Healthy" />
        <MetricCard title="Response coverage" value="82%" description="Core moments already connected" icon={Sparkles} accent="emerald" trend="Live" />
        <MetricCard title="Manual touchpoints" value="4" description="Human review moments remain in place" icon={CheckCircle2} accent="slate" trend="Balanced" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {workflows.map((workflow) => (
          <SectionPanel key={workflow.id} title={workflow.name} subtitle={`Trigger: ${workflow.trigger}`} actionLabel="Preview" actionHref="/dashboard/workflows">
            <div className="rounded-[1.35rem] border border-[#D4AF37]/10 bg-[#11151E] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">Next action</p>
                  <p className="mt-1 text-sm text-[#F8F9FA]/60">{workflow.action}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${workflow.status === 'Active' ? 'border border-[#10B981]/20 bg-[#10B981]/10 text-[#10B981]' : 'border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]'}`}>
                  {workflow.status}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90">
                  <Send className="h-4 w-4" /> Run now
                </button>
                <button className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 px-4 py-2 text-xs font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10">
                  <GitBranch className="h-4 w-4" /> Preview
                </button>
              </div>
            </div>
          </SectionPanel>
        ))}
      </div>

      <SectionPanel title="Workflow builder" subtitle="Create a new automation with the same clarity and precision as your operating system">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.35rem] border border-[#D4AF37]/10 bg-[#11151E] p-4">
            <p className="mb-3 text-sm font-semibold text-white">Trigger options</p>
            <ul className="space-y-2 text-sm text-[#F8F9FA]/60">
              <li>• Lead created</li>
              <li>• Invoice paid</li>
              <li>• Video uploaded</li>
              <li>• Manual start</li>
            </ul>
          </div>
          <div className="rounded-[1.35rem] border border-[#D4AF37]/10 bg-[#11151E] p-4">
            <p className="mb-3 text-sm font-semibold text-white">Action templates</p>
            <ul className="space-y-2 text-sm text-[#F8F9FA]/60">
              <li>• Send email</li>
              <li>• Add CRM note</li>
              <li>• Schedule social post</li>
              <li>• Generate report</li>
            </ul>
          </div>
        </div>
      </SectionPanel>
    </div>
  );
}


