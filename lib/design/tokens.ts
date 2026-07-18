/**
 * OGMJ Brands Design System - Global Design Tokens
 * Dark Luxury + Premium Motion System
 */

// ─────────────────────────────────────────────────────────────
// COLOR TOKENS
// ─────────────────────────────────────────────────────────────

export const colors = {
  // Primary Brand
  gold: {
    50: '#F7FFE0',
    100: '#EDFFC2',
    200: '#DEFF94',
    300: '#D6FF66',
    400: '#D0FF33',
    500: '#C8FF00',
    600: '#A3D400',
    700: '#7FA800',
    800: '#5C7A00',
    900: '#3D5200',
  },

  // Neutrals - Dark Luxury
  neutral: {
    50: '#F9F9FA',
    100: '#F0F0F5',
    200: '#E5E5EB',
    300: '#D4D5DF',
    400: '#B0B1BF',
    500: '#8C8E9E',
    600: '#6B6D7F',
    700: '#4A4C5E',
    800: '#2F313F',
    900: '#1A1C24',
    950: '#0F1116',
  },

  // Accents
  emerald: {
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },

  // Backgrounds
  bg: {
    primary: '#07070A',
    surface: '#0E1116',
    surface2: '#161B22',
    overlay: 'rgba(0, 0, 0, 0.4)',
  },

  // Text
  text: {
    primary: '#E8EAF0',
    secondary: '#B0B1BF',
    muted: '#8C8E9E',
    inverse: '#07070A',
  },

  // Semantic
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
};

// ─────────────────────────────────────────────────────────────
// MOTION / ANIMATION TOKENS
// ─────────────────────────────────────────────────────────────

export const motion = {
  // Duration presets (in milliseconds)
  duration: {
    instant: 100,
    fast: 200,
    base: 300,
    moderate: 400,
    slow: 600,
    slower: 800,
    slowest: 1200,
  },

  // Easing functions (cubic-bezier)
  easing: {
    // Natural, smooth easing
    smooth: [0.25, 0.46, 0.45, 0.94],
    smoothIn: [0.4, 0.0, 1, 1],
    smoothOut: [0, 0, 0.2, 1],

    // Snappy, responsive
    snappy: [0.34, 1.56, 0.64, 1],
    snappyIn: [0.68, -0.55, 0.265, 1.55],
    snappyOut: [0.175, 0.885, 0.32, 1.275],

    // Luxury, premium feel
    luxe: [0.43, 0.13, 0.23, 0.96],
    luxeIn: [0.68, 0.02, 0.42, 0.65],
    luxeOut: [0.43, 0.7, 0.64, 1],

    // Bounce (playful)
    bounce: [0.68, -0.55, 0.265, 1.55],
    bounceIn: [0.33, 0.66, 0.66, 1],
    bounceOut: [0.34, 1.56, 0.64, 1],

    // Linear (utility)
    linear: [0, 0, 1, 1],

    // Spring-like
    spring: [0.34, 1.56, 0.64, 1],
  },

  // Preset animations
  presets: {
    // Fade
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },

    // Scale + Fade
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },

    // Slide up
    slideUpIn: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },

    // Slide right
    slideRightIn: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },

    // Blur in
    blurIn: {
      initial: { opacity: 0, filter: 'blur(10px)' },
      animate: { opacity: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, filter: 'blur(10px)' },
    },
  },
};

// ─────────────────────────────────────────────────────────────
// SPACING & SIZING
// ─────────────────────────────────────────────────────────────

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
  '4xl': '6rem',  // 96px
};

// ─────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────

export const typography = {
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1.2' }],
    '6xl': ['3.75rem', { lineHeight: '1.2' }],
    '7xl': ['4.5rem', { lineHeight: '1.1' }],
  },

  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
};

// ─────────────────────────────────────────────────────────────
// SHADOWS (Luxury, subtle)
// ─────────────────────────────────────────────────────────────

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Glow effects
  goldGlow: '0 0 20px rgba(200, 255, 0, 0.15)',
  goldGlowLg: '0 0 40px rgba(200, 255, 0, 0.25)',
  emeraldGlow: '0 0 20px rgba(16, 185, 129, 0.15)',
  blueGlow: '0 0 20px rgba(59, 130, 246, 0.15)',
};

// ─────────────────────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────────────────────

export const radius = {
  none: '0px',
  sm: '0.375rem',     // 6px
  base: '0.5rem',     // 8px
  md: '0.75rem',      // 12px
  lg: '1rem',         // 16px
  xl: '1.5rem',       // 24px
  '2xl': '2rem',      // 32px
  '3xl': '3rem',      // 48px
  full: '9999px',     // Pill
};

// ─────────────────────────────────────────────────────────────
// BREAKPOINTS
// ─────────────────────────────────────────────────────────────

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

