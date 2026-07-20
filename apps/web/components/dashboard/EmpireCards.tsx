import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles } from 'lucide-react';

const panelBase =
  'rounded-[1.75rem] border border-[#C8FF00]/10 bg-[#0E1116]/90 p-5 shadow-[0_0_0_1px_rgba(200, 255, 0,0.06),0_22px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl';

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  accent = 'gold',
  trend,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  accent?: 'gold' | 'emerald' | 'slate';
  trend?: string;
}) {
  const accentClass =
    accent === 'emerald'
      ? 'text-[#10B981] bg-[#10B981]/10'
      : accent === 'slate'
        ? 'text-[#F8F9FA]/70 bg-white/10'
        : 'text-[#C8FF00] bg-[#C8FF00]/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${panelBase} flex flex-col gap-4`}
    >
      <div className="flex items-center justify-between">
        <div className={`rounded-2xl p-3 ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend ? (
          <span className="rounded-full border border-[#10B981]/20 bg-[#10B981]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#10B981]">
            {trend}
          </span>
        ) : null}
      </div>
      <div>
        <p className="text-sm text-[#C8FF00]/70">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      </div>
      <p className="text-sm text-[#F8F9FA]/60">{description}</p>
    </motion.div>
  );
}

export function SectionPanel({
  title,
  subtitle,
  children,
  actionLabel,
  actionHref,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className={`${panelBase} space-y-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-[#C8FF00]/70">{subtitle}</p> : null}
        </div>
        {actionLabel && actionHref ? (
          <a href={actionHref} className="inline-flex items-center gap-2 text-sm font-medium text-[#C8FF00] hover:text-[#F8F9FA]">
            {actionLabel}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function ModuleCard({
  title,
  description,
  icon: Icon,
  href,
  badge,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-[1.35rem] border border-[#C8FF00]/10 bg-[#11151E] p-4 transition hover:-translate-y-1 hover:border-[#C8FF00]/40 hover:bg-[#161C27]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-[#C8FF00]/10 p-3 text-[#C8FF00]">
          <Icon className="h-5 w-5" />
        </div>
        {badge ? (
          <span className="rounded-full border border-[#10B981]/20 bg-[#10B981]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#10B981]">
            {badge}
          </span>
        ) : null}
      </div>
      <h4 className="mt-4 text-base font-semibold text-white">{title}</h4>
      <p className="mt-2 text-sm text-[#F8F9FA]/60">{description}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#C8FF00]">
        Open workspace
        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>
    </a>
  );
}

export function AgentCard({
  name,
  role,
  focus,
  confidence,
  status,
  icon: Icon,
}: {
  name: string;
  role: string;
  focus: string;
  confidence: string;
  status: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-[1.35rem] border border-[#C8FF00]/10 bg-[#11151E] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#C8FF00]/10 p-3 text-[#C8FF00]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{name}</h4>
            <p className="text-xs text-[#C8FF00]/70">{role}</p>
          </div>
        </div>
        <span className="rounded-full border border-[#10B981]/20 bg-[#10B981]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#10B981]">
          {status}
        </span>
      </div>
      <p className="mt-4 text-sm text-[#F8F9FA]/60">{focus}</p>
      <div className="mt-4 flex items-center gap-2 text-sm text-[#C8FF00]">
        <Sparkles className="h-4 w-4" />
        Confidence {confidence}
      </div>
    </div>
  );
}

