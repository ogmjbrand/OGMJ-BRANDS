'use client';

import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Cpu,
  BrainCircuit,
  MessageSquareText,
  ShieldCheck,
  TrendingUp,
  Wand2,
} from 'lucide-react';
import { AgentCard, MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards';

const agentCatalog = [
  { name: 'CEO Agent', role: 'Executive command', focus: 'Prioritizes growth, revenue health and board-ready insight.', confidence: '92%', status: 'Live', icon: BrainCircuit },
  { name: 'Brand Strategist', role: 'Identity systems', focus: 'Keeps messaging, voice and visual consistency sharp.', confidence: '90%', status: 'Live', icon: Sparkles },
  { name: 'Marketing Agent', role: 'Funnel growth', focus: 'Builds campaigns, offers and lifecycle journeys.', confidence: '94%', status: 'Live', icon: TrendingUp },
  { name: 'Content Agent', role: 'Asset production', focus: 'Generates briefs, scripts and content plans.', confidence: '91%', status: 'Live', icon: MessageSquareText },
  { name: 'Compliance Agent', role: 'Risk control', focus: 'Reviews documents, standards and operating guardrails.', confidence: '89%', status: 'Live', icon: ShieldCheck },
];

const prompts = [
  'Draft a launch plan for a premium service rollout.',
  'Create an investor update with KPI highlights.',
  'Suggest a 7-day CRM automation sequence.',
];

export default function AIPage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const quickStats = useMemo(() => [
    { title: 'Active agents', value: '10', description: 'Autonomous execution layers active', icon: Cpu, accent: 'gold' as const, trend: '+3 this week' },
    { title: 'Automation coverage', value: '82%', description: 'Key motions already orchestrated', icon: Sparkles, accent: 'emerald' as const, trend: 'Healthy' },
    { title: 'Decision confidence', value: '94%', description: 'Recommended actions with measurable intent', icon: BrainCircuit, accent: 'slate' as const, trend: 'Rising' },
  ], []);

  async function handleRunAI() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);

    await new Promise((resolve) => setTimeout(resolve, 700));
    setResult(`Empire AI output for: "${prompt.trim()}"

1. Start by sequencing the highest-converting offer.
2. Auto-generate the launch messaging and assets.
3. Assign the next best action to the right agent.
4. Track the impact in the executive command center.`);
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#D4AF37]/10 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
              <Sparkles className="h-4 w-4" /> AI Orchestration Layer
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">From idea to empire, with intelligence at every layer.</h1>
            <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Coordinate your CEO, strategy, growth, content, finance and compliance agents from one premium operating surface.</p>
          </div>
          <div className="rounded-[1.5rem] border border-[#D4AF37]/10 bg-[#11151E]/90 p-4 text-sm text-[#F8F9FA]/70">
            <p className="font-semibold text-white">Live orchestration</p>
            <p className="mt-2">Every decision is connected to your CRM, content, finance and growth stack.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickStats.map((item) => (
          <MetricCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <SectionPanel title="AI command prompt" subtitle="Direct your empire agents with one focused request" actionLabel="Launch studio" actionHref="/dashboard/ai">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask the empire layer to draft a launch, investor update, campaign plan or automation sequence..."
            className="min-h-[220px] w-full rounded-[1.4rem] border border-[#D4AF37]/10 bg-[#07070A] p-4 text-sm text-white outline-none ring-0 transition focus:border-[#D4AF37]"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            {prompts.map((item) => (
              <button key={item} onClick={() => setPrompt(item)} className="rounded-full border border-[#D4AF37]/10 bg-[#11151E] px-4 py-2 text-sm text-[#F8F9FA]/70 transition hover:border-[#D4AF37]/40 hover:text-white">
                {item}
              </button>
            ))}
            <button
              onClick={handleRunAI}
              disabled={loading}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Wand2 className="h-4 w-4" />
              {loading ? 'Generating...' : 'Generate plan'}
            </button>
          </div>
        </SectionPanel>

        <SectionPanel title="Agent network" subtitle="Autonomous execution with shared context">
          <div className="space-y-3">
            {agentCatalog.map((agent) => (
              <AgentCard key={agent.name} {...agent} />
            ))}
          </div>
        </SectionPanel>
      </div>

      <SectionPanel title="Orchestration output" subtitle="Every result is designed to be immediate, actionable and investor-grade">
        {result ? (
          <div className="whitespace-pre-wrap rounded-[1.4rem] border border-[#D4AF37]/10 bg-[#07070A] p-5 text-sm leading-7 text-[#F8F9FA]/80">
            {result}
          </div>
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-[#D4AF37]/20 bg-[#11151E]/70 p-5 text-sm text-[#F8F9FA]/60">
            Run a prompt to generate a strategic response that can flow directly into your content, CRM and growth systems.
          </div>
        )}
      </SectionPanel>
    </div>
  );
}

