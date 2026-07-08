'use client';

import React from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// GLASS CARD WITH HOVER EFFECTS
// ─────────────────────────────────────────────────────────────

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover-lift' | 'hover-glow' | 'bordered';
  children: React.ReactNode;
  hoverScale?: number;
  delay?: number;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = 'default',
      children,
      hoverScale = 1.02,
      delay = 0,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      relative rounded-2xl backdrop-blur-md border border-white/10 
      bg-white/[0.02] overflow-hidden transition-all duration-300
    `;

    const variants = {
      default: 'hover:border-white/20',
      'hover-lift': 'hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:-translate-y-1',
      'hover-glow': 'hover:border-[#D4AF37]/30 hover:shadow-lg hover:shadow-[#D4AF37]/15',
      bordered: 'border-[#D4AF37]/20 hover:border-[#D4AF37]/40',
    };

    return (
      <motion.div
        ref={ref as any}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ scale: hoverScale }}
        transition={{
          duration: 0.5,
          delay,
        }}
        viewport={{ once: true, margin: '-100px' }}
        className={`${baseStyles} ${variants[variant]} ${className}`}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

// ─────────────────────────────────────────────────────────────
// FEATURE CARD WITH ICON
// ─────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  delay = 0,
}) => {
  return (
    <GlassCard variant="hover-glow" delay={delay} className="p-6 group">
      <motion.div
        className="mb-4 w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors"
        whileHover={{ rotate: 10, scale: 1.1 }}
      >
        <div className="text-2xl text-[#D4AF37]">{icon}</div>
      </motion.div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </GlassCard>
  );
};

// ─────────────────────────────────────────────────────────────
// ANIMATED CARD WITH BORDER ANIMATION
// ─────────────────────────────────────────────────────────────

export const BorderAnimatedCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, delay = 0, className = '' }, ref) => {
    return (
      <motion.div
        ref={ref as any}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay }}
        viewport={{ once: true }}
        className={`relative rounded-2xl p-px overflow-hidden ${className}`}
      >
        {/* Animated gradient border */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#D4AF37]/30 via-transparent to-[#D4AF37]/30"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundSize: '200% 200%',
          }}
        />

        {/* Content */}
        <div className="relative bg-[#0E1116] rounded-2xl backdrop-blur-sm p-6">
          {children}
        </div>
      </motion.div>
    );
  }
);

BorderAnimatedCard.displayName = 'BorderAnimatedCard';

// ─────────────────────────────────────────────────────────────
// STAT CARD (For dashboards)
// ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
}) => {
  const changeColor = {
    positive: 'text-emerald-500',
    negative: 'text-red-500',
    neutral: 'text-gray-400',
  };

  return (
    <GlassCard variant="hover-lift" className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
          {change && (
            <p className={`text-xs font-semibold ${changeColor[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        {icon && <div className="text-3xl opacity-20">{icon}</div>}
      </div>
    </GlassCard>
  );
};

