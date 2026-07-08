'use client';

import React from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// HERO SECTION WITH ANIMATED BACKGROUND
// ─────────────────────────────────────────────────────────────

interface HeroSectionProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  backgroundGradient?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  children,
  backgroundGradient = 'radial-gradient(circle_at_top_left,rgba(212,175,55,0.15),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.1),transparent_40%)',
}) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{
          background: backgroundGradient,
        }}
        animate={{
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="max-w-6xl mx-auto text-center">
        {/* Title animation */}
        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {title.split(' ').map((word, idx) => (
            <motion.span
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: idx * 0.1,
                ease: 'easeOut',
              }}
            >
              {word}{' '}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle animation */}
        <motion.p
          className="text-lg md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        >
          {subtitle}
        </motion.p>

        {/* Children with staggered animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// ANIMATED SECTION WITH REVEAL
// ─────────────────────────────────────────────────────────────

interface AnimatedSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  noAnimation?: boolean;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  title,
  subtitle,
  children,
  className = '',
  noAnimation = false,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className={`relative py-20 md:py-32 px-6 ${className}`}>
      <motion.div
        className="max-w-6xl mx-auto"
        initial={noAnimation ? undefined : 'hidden'}
        whileInView={noAnimation ? undefined : 'visible'}
        variants={noAnimation ? {} : containerVariants}
        viewport={{ once: true, margin: '-100px' }}
      >
        {title && (
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4"
            variants={itemVariants}
          >
            {title}
          </motion.h2>
        )}

        {subtitle && (
          <motion.p
            className="text-lg text-gray-300 max-w-2xl mb-12"
            variants={itemVariants}
          >
            {subtitle}
          </motion.p>
        )}

        <motion.div variants={itemVariants}>{children}</motion.div>
      </motion.div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// SCROLL-TRIGGERED TEXT REVEAL
// ─────────────────────────────────────────────────────────────

interface ScrollTextRevealProps {
  text: string;
  className?: string;
}

export const ScrollTextReveal: React.FC<ScrollTextRevealProps> = ({
  text,
  className = 'text-3xl md:text-5xl font-bold text-white',
}) => {
  const words = text.split(' ');

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ staggerChildren: 0.05 }}
    >
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// PARALLAX SECTION
// ─────────────────────────────────────────────────────────────

interface ParallaxSectionProps {
  backgroundImage?: string;
  depth?: number;
  children: React.ReactNode;
  className?: string;
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  backgroundImage,
  depth = 0.5,
  children,
  className = '',
}) => {
  const { scrollY } = require('framer-motion').useScroll();
  const y = require('framer-motion').useTransform(scrollY, (latest: number) => latest * depth);

  return (
    <section className={`relative min-h-screen flex items-center overflow-hidden ${className}`}>
      {backgroundImage && (
        <motion.div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            y,
          }}
        />
      )}
      <div className="relative z-10 max-w-6xl mx-auto w-full px-6">{children}</div>
    </section>
  );
};

