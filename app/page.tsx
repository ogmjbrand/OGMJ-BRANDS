'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, Star, Zap, Globe, Users, TrendingUp, Sparkles } from 'lucide-react';

// Smooth scroll hook
function useSmoothScroll() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initSmoothScroll = async () => {
      try {
        const Lenis = (await import('lenis')).default;
        const lenis = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          smoothTouch: false,
        });

        function raf(time: number) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        setIsLoaded(true);
      } catch (error) {
        console.warn('Lenis not loaded, using native scroll');
        setIsLoaded(true);
      }
    };

    initSmoothScroll();
  }, []);

  return isLoaded;
}

// Magnetic button component
function MagneticButton({ children, className, ...props }: any) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      ref.current.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    };

    const handleMouseLeave = () => {
      if (!ref.current) return;
      ref.current.style.transform = 'translate(0px, 0px)';
    };

    const element = ref.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (element) {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <motion.div ref={ref} className={`inline-block ${className}`} {...props}>
      {children}
    </motion.div>
  );
}

// Animated counter
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// Floating elements
function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-[#D4AF37]/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const isLoaded = useSmoothScroll();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const features = [
    {
      icon: Globe,
      title: "Global Reach",
      description: "Connect with customers worldwide through integrated marketing tools",
      color: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: Zap,
      title: "AI-Powered",
      description: "Intelligent automation and content generation for modern businesses",
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: Users,
      title: "CRM Excellence",
      description: "Advanced customer relationship management with predictive analytics",
      color: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: TrendingUp,
      title: "Growth Engine",
      description: "Data-driven insights and automated marketing campaigns",
      color: "from-orange-500/20 to-red-500/20"
    }
  ];

  const stats = [
    { label: "Active Users", value: 50000, suffix: "+" },
    { label: "Businesses Launched", value: 12000, suffix: "+" },
    { label: "Revenue Generated", value: 250000000, suffix: "M" },
    { label: "Countries Served", value: 120, suffix: "+" }
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#07070A] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full"
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative bg-[#07070A] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#07070A] via-[#0E1116] to-[#07070A]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.1),transparent_50%)]" />
        <FloatingElements />
      </div>

      {/* Hero Section */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-screen flex items-center justify-center px-6"
      >
        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-6 py-3 mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-medium text-[#D4AF37]">Global Business Operating System</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-6xl md:text-8xl font-black tracking-tight mb-6"
          >
            <span className="bg-gradient-to-r from-white via-[#D4AF37] to-white bg-clip-text text-transparent">
              Build
            </span>
            <br />
            <span className="text-[#D4AF37]">Extraordinary</span>
            <br />
            <span className="text-white">Brands</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed"
          >
            Transform your business with the most advanced platform combining CRM, marketing automation,
            AI-powered content creation, and enterprise-grade tools in one seamless experience.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <MagneticButton>
              <Link
                href="/auth"
                className="group relative overflow-hidden rounded-full bg-[#D4AF37] px-8 py-4 text-black font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-[#D4AF37]/50"
              >
                <span className="relative z-10">Start Building Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </MagneticButton>

            <MagneticButton>
              <Link
                href="/dashboard"
                className="group relative overflow-hidden rounded-full border-2 border-white/20 bg-white/5 px-8 py-4 text-white font-bold text-lg backdrop-blur-sm transition-all duration-300 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10"
              >
                <span className="flex items-center gap-2">
                  View Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </MagneticButton>
          </motion.div>

          {/* Video Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/20 bg-[#0E1116]/50 backdrop-blur-sm">
              <div className="aspect-video bg-gradient-to-br from-[#0E1116] to-[#1A1F3A] flex items-center justify-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-20 h-20 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center group"
                >
                  <Play className="w-8 h-8 text-[#D4AF37] ml-1 group-hover:scale-110 transition-transform" />
                </motion.button>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Live Demo
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              Trusted by <span className="text-[#D4AF37]">Global Leaders</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Join thousands of businesses already transforming their operations
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-6xl font-black text-[#D4AF37] mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-gray-400 text-sm md:text-base">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              Everything You Need to <span className="text-[#D4AF37]">Scale</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              A complete business operating system designed for modern entrepreneurs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-8 rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br ${feature.color} backdrop-blur-sm hover:border-[#D4AF37]/40 transition-all duration-300 group`}
              >
                <div className="flex items-start gap-6">
                  <div className="p-3 rounded-xl bg-[#D4AF37]/20 group-hover:bg-[#D4AF37]/30 transition-colors">
                    <feature.icon className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Ready to Build Your <span className="text-[#D4AF37]">Legacy</span>?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join the revolution. Start building extraordinary brands today.
          </p>

          <MagneticButton>
            <Link
              href="/auth"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#D4AF37] text-black font-bold text-lg rounded-full hover:shadow-2xl hover:shadow-[#D4AF37]/50 transition-all duration-300"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </MagneticButton>
        </motion.div>
      </section>
    </div>
  );
}
