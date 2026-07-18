/**
 * Motion Utilities - Scroll Effects, Parallax, Magnetic Effects
 * Built for Framer Motion + React integration
 */

import { useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────
// SCROLL PARALLAX HOOK
// ─────────────────────────────────────────────────────────────

/**
 * Creates parallax effect based on scroll position
 * Usage: const y = useParallax(0.5) // 0.5 = 50% of scroll movement
 */
export function useParallax(speed: number = 0.5) {
  const ref = useRef(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (latest) => latest * speed);
  return { ref, y };
}

// ─────────────────────────────────────────────────────────────
// SCROLL PROGRESS HOOK
// ─────────────────────────────────────────────────────────────

/**
 * Tracks scroll progress as a value between 0-1
 */
export function useScrollProgress() {
  const { scrollYProgress } = useScroll();
  return scrollYProgress;
}

// ─────────────────────────────────────────────────────────────
// REVEAL ON SCROLL HOOK
// ─────────────────────────────────────────────────────────────

/**
 * Reveals element when it enters viewport
 * Returns ref and motion values for animation
 */
export function useRevealOnScroll(options = {}) {
  const ref = useRef(null);
  const { scrollY } = useScroll();

  const initial = { opacity: 0, y: 20 };
  const animate = { opacity: 1, y: 0 };

  return { ref, initial, animate };
}

// ─────────────────────────────────────────────────────────────
// MAGNETIC CURSOR EFFECT
// ─────────────────────────────────────────────────────────────

/**
 * Makes element follow cursor with magnetic attraction
 */
export function useMagneticCursor(strength: number = 0.2) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      mouseX = (e.clientX - centerX) * strength;
      mouseY = (e.clientY - centerY) * strength;

      element.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    };

    const handleMouseLeave = () => {
      element.style.transform = 'translate(0, 0)';
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  return ref;
}

// ─────────────────────────────────────────────────────────────
// SCROLL VELOCITY HOOK
// ─────────────────────────────────────────────────────────────

/**
 * Calculates scroll velocity for dynamic effects
 */
export function useScrollVelocity() {
  const { scrollY } = useScroll();
  const lastY = useRef(0);
  const velocity = useRef(0);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    velocity.current = latest - lastY.current;
    lastY.current = latest;
  });

  return velocity;
}

// ─────────────────────────────────────────────────────────────
// STAGGER CHILDREN ANIMATION
// ─────────────────────────────────────────────────────────────

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// ─────────────────────────────────────────────────────────────
// ROTATION ANIMATION
// ─────────────────────────────────────────────────────────────

export const rotationVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ─────────────────────────────────────────────────────────────
// FLOATING ANIMATION (Y-axis bounce)
// ─────────────────────────────────────────────────────────────

export const floatVariants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ─────────────────────────────────────────────────────────────
// PULSE GLOW ANIMATION
// ─────────────────────────────────────────────────────────────

export const pulseGlowVariants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    boxShadow: [
      '0 0 20px rgba(200, 255, 0, 0.15)',
      '0 0 40px rgba(200, 255, 0, 0.3)',
      '0 0 20px rgba(200, 255, 0, 0.15)',
    ],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ─────────────────────────────────────────────────────────────
// SMOOTH SCROLL TO
// ─────────────────────────────────────────────────────────────

export function smoothScrollTo(elementId: string) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ─────────────────────────────────────────────────────────────
// TRIGGER ANIMATION ON VISIBLE
// ─────────────────────────────────────────────────────────────

export function useInView(ref: React.RefObject<HTMLElement>, once = false) {
  const isInView = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          isInView.current = true;
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, once]);

  return isInView.current;
}

