'use client';

import React from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// ANIMATED BUTTON VARIANTS
// ─────────────────────────────────────────────────────────────

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      isLoading = false,
      icon,
      children,
      className = '',
    },
    ref
  ) => {
    const baseStyles = 'relative font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer';

    const variants = {
      primary: 'bg-[#C8FF00] text-black hover:bg-[#E8CC6A] shadow-lg shadow-[#C8FF00]/20 focus:ring-[#C8FF00]/50',
      secondary: 'bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:border-white/30',
      ghost: 'bg-transparent text-[#C8FF00] hover:bg-[#C8FF00]/10 border border-[#C8FF00]/30 hover:border-[#C8FF00]/50',
      gradient: 'bg-gradient-to-r from-[#C8FF00] to-[#E8CC6A] text-black hover:shadow-lg hover:shadow-[#C8FF00]/30',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const disabledStyles = disabled || isLoading ? 'opacity-60 cursor-not-allowed' : '';

    return (
      <motion.button
        ref={ref as any}
        disabled={disabled || isLoading}
        whileHover={!disabled && !isLoading ? { scale: 1.05 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
      >
        <span className="flex items-center justify-center gap-2">
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            />
          ) : (
            icon
          )}
          {children}
        </span>
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

// ─────────────────────────────────────────────────────────────
// GLOSSY BUTTON
// ─────────────────────────────────────────────────────────────

export const GlossyButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ variant = 'primary', size = 'md', children, disabled }, ref) => {
    return (
      <motion.button
        ref={ref as any}
        disabled={disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative overflow-hidden rounded-full font-semibold transition-all duration-300 ${
          variant === 'primary'
            ? 'bg-[#C8FF00] text-black px-8 py-4 shadow-lg shadow-[#C8FF00]/20'
            : 'bg-white/10 text-white px-8 py-4 border border-white/20'
        }`}
      >
        {/* Glossy shine effect */}
        <motion.div
          className="absolute inset-0 opacity-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{
            x: '100%',
            transition: { duration: 0.6, ease: 'easeInOut' },
            opacity: [0, 1, 0],
          }}
        />
        {children}
      </motion.button>
    );
  }
);

GlossyButton.displayName = 'GlossyButton';

// ─────────────────────────────────────────────────────────────
// MAGNETIC BUTTON
// ─────────────────────────────────────────────────────────────

export const MagneticButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, size = 'md', disabled }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
      <motion.div
        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <motion.button
          ref={ref as any}
          disabled={disabled}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative px-8 py-4 font-semibold rounded-full bg-gradient-to-r from-[#C8FF00] to-[#E8CC6A] text-black shadow-lg shadow-[#C8FF00]/20 overflow-hidden"
        >
          {/* Animated background particle */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#C8FF00]/0 via-white/20 to-[#C8FF00]/0"
            animate={isHovered ? { x: 200 } : { x: -200 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
          <span className="relative">{children}</span>
        </motion.button>
      </motion.div>
    );
  }
);

MagneticButton.displayName = 'MagneticButton';

