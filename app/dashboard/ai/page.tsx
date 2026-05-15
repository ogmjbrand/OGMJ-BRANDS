'use client';

import React, { useState } from 'react';
import { Sparkles, Cpu, MessageSquare, Bolt, ArrowRight } from 'lucide-react';

const useCases = [
  {
    title: 'Campaign Messaging',
    description: 'Create high-converting launch copy for emails, socials, and ads.',
  },
  {
    title: 'Brand Voice',
    description: 'Generate consistent captions, brand statements, and microcopy.',
  },
  {
    title: 'Growth Strategy',
    description: 'Get AI-driven recommendations for funnels and customer journeys.',
  },
];

export default function AIPage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRunAI() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);

    await new Promise((resolve) => setTimeout(resolve, 700));
    setResult(
      `AI-generated recommendation for: "${prompt.trim()}"\n\n1. Capture attention with a strong hook.\n2. Keep the message simple and benefit-driven.\n3. Include a clear CTA that emphasizes the outcome.`
    );
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
            <Sparkles className="w-4 h-4" /> AI Growth Studio
          </div>
          <h1 className="text-4xl font-bold text-white mt-4">AI Assistant</h1>
          <p className="text-[#D4AF37]/70 mt-2 max-w-2xl">
            Amplify your marketing, content and campaign operations with AI insights built for founders.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {useCases.map((item) => (
          <div key={item.title} className="rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6">
            <div className="flex items-center justify-between mb-4">
              <Cpu className="w-6 h-6 text-[#D4AF37]" />
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-[#D4AF37]/70 text-sm">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6">
          <h2 className="text-xl font-semibold text-white mb-4">AI Prompt Builder</h2>
          <p className="text-[#D4AF37]/70 mb-6">Enter the goal you want the assistant to solve and get a polished output instantly.</p>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Write a launch email for an audience of busy e-commerce founders..."
            className="min-h-[180px] w-full rounded-3xl border border-[#D4AF37]/10 bg-[#07070A] p-4 text-white outline-none focus:border-[#D4AF37]"
          />
          <button
            onClick={handleRunAI}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Generating...' : 'Generate AI Insight'}
          </button>
        </div>

        <div className="space-y-6 rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6">
          <div className="rounded-3xl bg-[#11151E] p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
              <p className="text-sm font-medium text-white">Instant Prompt Templates</p>
            </div>
            <ul className="mt-4 space-y-3 text-[#D4AF37]/70 text-sm">
              <li>• Launch announcement</li>
              <li>• Customer nurture flow</li>
              <li>• Video script outline</li>
              <li>• Social post series</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-[#11151E] p-4">
            <div className="flex items-center gap-3">
              <Bolt className="w-5 h-5 text-[#D4AF37]" />
              <p className="text-sm font-medium text-white">Ready for execution</p>
            </div>
            <p className="mt-3 text-sm text-[#D4AF37]/70">
              Use the output to onboard campaigns, launch emails, or creative workflows instantly.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[#D4AF37]/10 bg-[#0E1116] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">AI Output</h2>
        {result ? (
          <div className="whitespace-pre-wrap rounded-3xl bg-[#07070A] p-6 text-sm leading-6 text-[#D4AF37]/70">
            {result}
          </div>
        ) : (
          <div className="rounded-3xl border border-[#D4AF37]/10 p-6 text-[#D4AF37]/60">
            <p>Run a prompt to preview AI recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
}

