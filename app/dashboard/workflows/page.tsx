'use client';

import React, { useState } from 'react';
import { Zap, GitBranch, Send, RefreshCcw, CheckCircle2 } from 'lucide-react';

const initialWorkflows = [
  {
    id: 'workflow-1',
    name: 'New Lead Nurture',
    trigger: 'Lead Created',
    action: 'Send Welcome Email',
    status: 'Active',
  },
  {
    id: 'workflow-2',
    name: 'Invoice Reminder',
    trigger: 'Invoice Overdue',
    action: 'Send Payment Reminder',
    status: 'Paused',
  },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState(initialWorkflows);

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
          <Zap className="w-4 h-4" /> Automation Flow
        </div>
        <h1 className="text-4xl font-bold text-white mt-4">Workflows</h1>
        <p className="text-[#D4AF37]/70 mt-2 max-w-2xl">
          Build automation flows that push your business further while you focus on growth.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">{workflow.name}</h2>
                <p className="text-[#D4AF37]/70 text-sm">Trigger: {workflow.trigger}</p>
              </div>
              <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                {workflow.status}
              </span>
            </div>
            <div className="mt-4 text-[#D4AF37]/70">
              <p className="text-sm">Action: {workflow.action}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#07070A] hover:bg-[#D4AF37]/90 transition">
                <Send className="w-4 h-4" /> Run Now
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 transition">
                <GitBranch className="w-4 h-4" /> Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Workflow Builder</h2>
            <p className="text-[#D4AF37]/70 text-sm">Add triggers and actions to automate your customer lifecycle.</p>
          </div>
          <RefreshCcw className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-[#11151E] p-4">
            <p className="text-sm font-semibold text-white mb-3">Trigger options</p>
            <ul className="space-y-2 text-[#D4AF37]/70 text-sm">
              <li>• Lead created</li>
              <li>• Invoice paid</li>
              <li>• Video uploaded</li>
              <li>• Manual start</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-[#11151E] p-4">
            <p className="text-sm font-semibold text-white mb-3">Action templates</p>
            <ul className="space-y-2 text-[#D4AF37]/70 text-sm">
              <li>• Send email</li>
              <li>• Add CRM note</li>
              <li>• Schedule social post</li>
              <li>• Generate report</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
