'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Cpu,
  BrainCircuit,
  MessageSquareText,
  ShieldCheck,
  TrendingUp,
  Send,
  Square,
  Trash2,
  KeyRound,
  User,
} from 'lucide-react';
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

const agents = [
  { id: 'ceo', label: 'CEO Agent', role: 'Executive command', focus: 'Prioritizes growth, revenue health and board-ready insight.', icon: BrainCircuit },
  { id: 'strategist', label: 'Brand Strategist', role: 'Identity systems', focus: 'Keeps messaging, voice and visual consistency sharp.', icon: Sparkles },
  { id: 'marketing', label: 'Marketing Agent', role: 'Funnel growth', focus: 'Builds campaigns, offers and lifecycle journeys.', icon: TrendingUp },
  { id: 'content', label: 'Content Agent', role: 'Asset production', focus: 'Generates briefs, scripts and content plans.', icon: MessageSquareText },
  { id: 'compliance', label: 'Compliance Agent', role: 'Risk control', focus: 'Reviews documents, standards and operating guardrails.', icon: ShieldCheck },
];

const quickPrompts = [
  'Draft a launch plan for a premium service rollout.',
  'Create an investor update with KPI highlights.',
  'Suggest a 7-day CRM automation sequence.',
  'Write a payment reminder email that keeps the relationship warm.',
];

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('ceo');
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const activeAgent = agents.find((a) => a.id === selectedAgent) ?? agents[0];

  const quickStats = useMemo(() => [
    { title: 'Empire agents', value: String(agents.length), description: 'Specialist perspectives on one shared context', icon: Cpu, accent: 'gold' as const, trend: 'Live' },
    { title: 'Model', value: 'Claude Opus', description: 'Frontier intelligence behind every answer', icon: Sparkles, accent: 'emerald' as const, trend: 'Streaming' },
    { title: 'Turnaround', value: 'Seconds', description: 'From question to shippable output', icon: BrainCircuit, accent: 'slate' as const, trend: 'Real-time' },
  ], []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function stopStreaming() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const history: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(history);
    setInput('');
    setError(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, agent: selectedAgent }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError({
          message: body?.error ?? `Request failed (${res.status})`,
          hint: body?.hint,
        });
        setMessages(history.slice(0, -1));
        setInput(content);
        return;
      }

      setMessages([...history, { role: 'assistant', content: '' }]);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        const snapshot = assistantText;
        setMessages([...history, { role: 'assistant', content: snapshot }]);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError({ message: 'Connection lost while generating — please try again.' });
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#D4AF37]/10 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
              <Sparkles className="h-4 w-4" /> Empire AI — your unfair advantage
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Every empire starts as a conversation.
            </h1>
            <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">
              Ask once, and your CEO, brand, growth, content and compliance agents answer
              with work you can ship — plans, campaigns, emails and sequences wired into
              the rest of your operating system.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[#D4AF37]/10 bg-[#11151E]/90 p-4 text-sm text-[#F8F9FA]/70">
            <p className="font-semibold text-white">Speaking with: {activeAgent.label}</p>
            <p className="mt-2">{activeAgent.focus}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {quickStats.map((item) => (
          <MetricCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <SectionPanel
          title="AI command room"
          subtitle={`Direct ${activeAgent.label.toLowerCase()} with one focused request`}
        >
          <div
            ref={scrollRef}
            className="max-h-[480px] min-h-[260px] space-y-4 overflow-y-auto rounded-[1.4rem] border border-[#D4AF37]/10 bg-[#07070A] p-4"
          >
            {messages.length === 0 && (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-4 text-center">
                <p className="max-w-md text-sm text-[#F8F9FA]/60">
                  This is a live line to your empire agents. Start with one of these, or
                  ask anything about your business:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickPrompts.map((item) => (
                    <button
                      key={item}
                      onClick={() => sendMessage(item)}
                      className="rounded-full border border-[#D4AF37]/10 bg-[#11151E] px-4 py-2 text-xs text-[#F8F9FA]/70 transition hover:border-[#D4AF37]/40 hover:text-white sm:text-sm"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-[1.2rem] px-4 py-3 text-sm leading-7 ${
                    message.role === 'user'
                      ? 'bg-[#D4AF37]/15 text-white'
                      : 'border border-[#D4AF37]/10 bg-[#11151E] text-[#F8F9FA]/85'
                  }`}
                >
                  {message.content || (
                    <span className="inline-flex items-center gap-2 text-[#F8F9FA]/50">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#D4AF37]" />
                      Thinking…
                    </span>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-[1.2rem] border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              <p className="flex items-center gap-2 font-semibold">
                <KeyRound className="h-4 w-4" /> {error.message}
              </p>
              {error.hint && <p className="mt-1 text-amber-200/80">{error.hint}</p>}
            </div>
          )}

          <div className="mt-4">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask the ${activeAgent.label.toLowerCase()} to draft a launch, investor update, campaign plan or automation sequence…`}
              rows={3}
              className="w-full rounded-[1.4rem] border border-[#D4AF37]/10 bg-[#07070A] p-4 text-sm text-white outline-none ring-0 transition focus:border-[#D4AF37]"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    stopStreaming();
                    setMessages([]);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/10 bg-[#11151E] px-4 py-2 text-xs text-[#F8F9FA]/60 transition hover:border-[#D4AF37]/40 hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" /> New conversation
                </button>
              )}
              <span className="text-xs text-[#F8F9FA]/40">Enter to send · Shift+Enter for a new line</span>
              {streaming ? (
                <button
                  onClick={stopStreaming}
                  className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#11151E] px-5 py-2.5 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
                >
                  <Square className="h-4 w-4" /> Stop
                </button>
              ) : (
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" /> Send
                </button>
              )}
            </div>
          </div>
        </SectionPanel>

        <SectionPanel title="Agent network" subtitle="Choose who takes the brief — each agent thinks differently">
          <div className="space-y-3">
            {agents.map((agent) => {
              const Icon = agent.icon;
              const selected = agent.id === selectedAgent;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`w-full rounded-[1.4rem] border p-4 text-left transition ${
                    selected
                      ? 'border-[#D4AF37]/60 bg-[#D4AF37]/10'
                      : 'border-[#D4AF37]/10 bg-[#11151E] hover:border-[#D4AF37]/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                        selected ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-[#F8F9FA]/60'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{agent.label}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#F8F9FA]/40">{agent.role}</p>
                    </div>
                    {selected && (
                      <span className="ml-auto rounded-full bg-[#D4AF37]/20 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#F8F9FA]/60">{agent.focus}</p>
                </button>
              );
            })}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}

