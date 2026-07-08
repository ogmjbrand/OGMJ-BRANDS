import {
  Briefcase,
  Rocket,
  Sparkles,
  LayoutDashboard,
  Cpu,
  TrendingUp,
  Users,
  MessageSquare,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'

export const SITE = {
  name: 'OGMJ BRANDS',
  tagline: 'Global Business Operating System',
  email: 'hello@ogmj-brands.com',
  phone: '+1 (888) 464-5625',
  phoneTel: '+18884645625',
  address: '1200 Brickell Bay Dr, Suite 400',
  city: 'Miami, FL 33131',
  hours: 'Mon–Fri, 9am–6pm EST',
  linkedin: 'https://linkedin.com/company/ogmj-brands',
  twitter: 'https://twitter.com/ogmjbrands',
}

export const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For solo founders getting started',
    price: 29,
    period: 'month',
    annualPrice: 278,
    startingFrom: '$29/mo',
    features: [
      'Up to 1,000 contacts',
      '5 team members',
      'Basic CRM & invoicing',
      'Email support',
      '1 website',
      'Business registration guidance',
    ],
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing teams scaling fast',
    price: 99,
    period: 'month',
    annualPrice: 950,
    startingFrom: '$99/mo',
    features: [
      'Up to 50,000 contacts',
      '25 team members',
      'Advanced CRM + Analytics',
      'Priority support',
      'Unlimited websites',
      'Video processing & AI features',
      'Workflow automation',
      'Branding starter package',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For organizations needing white-glove ops',
    price: 299,
    period: 'month',
    annualPrice: 2870,
    startingFrom: 'From $299/mo',
    features: [
      'Unlimited contacts & team members',
      'All platform features included',
      '24/7 phone & dedicated account manager',
      'Custom integrations & SLA guarantee',
      'Executive assistant hours',
      'Full branding & launch ops',
      'Custom onboarding (2–4 weeks)',
    ],
    popular: false,
  },
]

export const SERVICE_PACKAGES = [
  {
    slug: 'business-registration',
    title: 'Business Registration',
    description: 'From entity setup to compliant expansion, launch with legal clarity and global readiness.',
    icon: Briefcase,
    startingPrice: '$499',
    timeline: '1–2 weeks',
    deliverables: [
      'Entity type recommendation (LLC, C-Corp, etc.)',
      'State/federal filing preparation',
      'EIN registration support',
      'Operating agreement templates',
      'Compliance checklist for your jurisdiction',
    ],
  },
  {
    slug: 'business-launch',
    title: 'Business Launch',
    description: 'High-impact launches powered by platform operations, positioning, and launch engines.',
    icon: Rocket,
    startingPrice: '$2,500',
    timeline: '3–6 weeks',
    deliverables: [
      'Go-to-market strategy document',
      'Launch timeline & milestone tracker',
      'Press kit & announcement templates',
      'Landing page setup on OGMJ platform',
      'Post-launch analytics dashboard',
    ],
  },
  {
    slug: 'branding',
    title: 'Branding',
    description: 'Premium identity systems that connect brand story, digital product, and growth.',
    icon: Sparkles,
    startingPrice: '$3,500',
    timeline: '4–8 weeks',
    deliverables: [
      'Brand strategy & positioning workshop',
      'Logo suite (primary, secondary, icon)',
      'Color palette, typography & brand guidelines',
      'Social media kit (10+ templates)',
      'Business card & letterhead designs',
    ],
  },
  {
    slug: 'website-development',
    title: 'Website Development',
    description: 'Conversion-first websites designed for speed, scale, and cinematic storytelling.',
    icon: LayoutDashboard,
    startingPrice: '$4,000',
    timeline: '4–10 weeks',
    deliverables: [
      'UX wireframes & responsive design',
      'Custom website built on OGMJ builder',
      'SEO setup & analytics integration',
      'Contact forms & CRM connection',
      '30-day post-launch support',
    ],
  },
  {
    slug: 'app-development',
    title: 'App Development',
    description: 'Enterprise-ready mobile and web products with polished UX and automation.',
    icon: Cpu,
    startingPrice: '$15,000',
    timeline: '8–16 weeks',
    deliverables: [
      'Product requirements document',
      'UI/UX design for web and/or mobile',
      'MVP development with core features',
      'API integrations & authentication',
      'App store submission support',
    ],
  },
  {
    slug: 'ai-automation',
    title: 'AI Automation',
    description: 'Smart workflows that unify CRM, follow-up, and executive operations.',
    icon: TrendingUp,
    startingPrice: '$1,500',
    timeline: '2–4 weeks',
    deliverables: [
      'Workflow audit & automation roadmap',
      'CRM auto-follow-up sequences',
      'AI assistant configuration',
      'Lead scoring & pipeline automation',
      'Training session for your team',
    ],
  },
  {
    slug: 'executive-assistant',
    title: 'Executive Assistant',
    description: 'White-glove support for founders, operators, and growth leadership.',
    icon: Users,
    startingPrice: '$1,200/mo',
    timeline: 'Ongoing',
    deliverables: [
      'Dedicated EA (20–40 hrs/month)',
      'Calendar & inbox management',
      'Meeting prep & follow-up notes',
      'Travel & vendor coordination',
      'Weekly executive summary report',
    ],
  },
  {
    slug: 'marketing',
    title: 'Marketing',
    description: 'Creative campaigns and analytics built for premium momentum.',
    icon: MessageSquare,
    startingPrice: '$2,000/mo',
    timeline: 'Ongoing',
    deliverables: [
      'Marketing strategy & channel plan',
      'Content calendar (monthly)',
      'Ad creative & copy (4 campaigns/mo)',
      'Performance reporting dashboard',
      'A/B testing & optimization',
    ],
  },
  {
    slug: 'video-editing',
    title: 'Video Editing',
    description: 'Cinematic content production that amplifies launch and brand storytelling.',
    icon: BookOpen,
    startingPrice: '$800/video',
    timeline: '1–2 weeks per video',
    deliverables: [
      'Script review & storyboard',
      'Professional editing & color grading',
      'Motion graphics & captions',
      'Multi-format exports (16:9, 9:16, 1:1)',
      '2 revision rounds included',
    ],
  },
] as const

export type ServicePackage = (typeof SERVICE_PACKAGES)[number]

export const TESTIMONIALS = [
  {
    quote:
      'OGMJ BRANDS transformed our business into a premium global operator with speed and confidence. Their CRM and automation stack alone paid for itself in the first quarter.',
    name: 'Marcelo Santos',
    role: 'Founder',
    company: 'Luma Ventures',
    linkedin: 'https://linkedin.com/in/marcelosantos',
    caseStudy: '/blog/luma-ventures-case-study',
    initials: 'MS',
    metric: '42% revenue lift in 90 days',
  },
  {
    quote:
      'The strategy, dashboard, and automation stack made our launch feel effortless and elite. We went from idea to live product in 6 weeks — something our previous agency quoted at 6 months.',
    name: 'Ava Morgan',
    role: 'CEO',
    company: 'Verge Collective',
    linkedin: 'https://linkedin.com/in/avamorgan',
    caseStudy: '/blog/verge-collective-launch',
    initials: 'AM',
    metric: '3x faster go-to-market',
  },
  {
    quote:
      'Having registration, branding, website, and CRM in one platform eliminated the chaos of juggling five vendors. OGMJ is the operating system we wish we had from day one.',
    name: 'James Okonkwo',
    role: 'COO',
    company: 'Atlas Digital Group',
    linkedin: 'https://linkedin.com/in/jamesokonkwo',
    caseStudy: '/blog/atlas-digital-ops',
    initials: 'JO',
    metric: '96% team adoption rate',
  },
]

export const CLIENT_LOGOS = [
  'Luma Ventures',
  'Verge Collective',
  'Atlas Digital',
  'NovaBridge',
  'Meridian Labs',
  'Crestline Capital',
]

export const TEAM = [
  {
    name: 'Oluwasegun Michael Johnson',
    role: 'Founder & CEO',
    bio: 'Serial entrepreneur with 12+ years building premium brands and business systems across Africa, Europe, and the Americas.',
    initials: 'OMJ',
    linkedin: 'https://linkedin.com/in/ogmj-founder',
  },
  {
    name: 'Sarah Chen',
    role: 'Chief Technology Officer',
    bio: 'Former engineering lead at two fintech unicorns. Architect of the OGMJ platform infrastructure and AI automation layer.',
    initials: 'SC',
    linkedin: 'https://linkedin.com/in/sarahchen',
  },
  {
    name: 'David Martinez',
    role: 'Head of Client Success',
    bio: '15 years in enterprise client relations. Ensures every founder gets white-glove onboarding and measurable outcomes.',
    initials: 'DM',
    linkedin: 'https://linkedin.com/in/davidmartinez',
  },
  {
    name: 'Amara Okafor',
    role: 'Creative Director',
    bio: 'Award-winning brand strategist who has shaped identities for 40+ premium startups and growth-stage companies.',
    initials: 'AO',
    linkedin: 'https://linkedin.com/in/amaraokafor',
  },
]

export const FAQ_ITEMS = [
  {
    q: 'What countries do you operate in?',
    a: 'OGMJ BRANDS serves founders globally. We support business registration in the US, UK, Canada, Nigeria, Ghana, Kenya, and South Africa, with platform access available worldwide.',
  },
  {
    q: 'How long does onboarding take?',
    a: 'Platform onboarding takes 1–3 business days. Full-service packages (branding, website, launch) typically run 4–10 weeks depending on scope. Enterprise clients receive a dedicated onboarding plan.',
  },
  {
    q: 'What is included in each service package?',
    a: 'Every service includes a defined scope of deliverables, timeline, and revision rounds. Visit our Services page for full details on each offering, or contact us for a custom proposal.',
  },
  {
    q: 'Can I change my plan anytime?',
    a: 'Yes. Upgrade or downgrade your platform plan at any time. Changes take effect immediately and billing is prorated.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards via Paystack and Flutterwave, plus wire transfer for Enterprise contracts over $10,000.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Platform subscriptions include a 14-day money-back guarantee. Service packages include milestone-based payments with satisfaction checkpoints.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes — start a 14-day free trial of the Professional plan with full access to CRM, analytics, AI features, and the website builder.',
  },
  {
    q: 'Do you offer dedicated support?',
    a: 'Starter plans include email support. Professional gets priority support. Enterprise includes 24/7 phone support and a dedicated account manager.',
  },
]

export const BLOG_POSTS = [
  {
    slug: 'luma-ventures-case-study',
    title: 'How Luma Ventures Achieved 42% Revenue Lift in 90 Days',
    excerpt:
      'A deep dive into how Luma Ventures unified their CRM, automation, and launch operations on the OGMJ platform.',
    date: '2026-03-15',
    category: 'Case Study',
    readTime: '6 min read',
    author: 'David Martinez',
  },
  {
    slug: 'verge-collective-launch',
    title: 'Verge Collective: From Idea to Live Product in 6 Weeks',
    excerpt:
      'How Verge Collective used OGMJ branding, website, and automation services to launch 3x faster than industry average.',
    date: '2026-02-28',
    category: 'Case Study',
    readTime: '5 min read',
    author: 'Amara Okafor',
  },
  {
    slug: 'atlas-digital-ops',
    title: 'Why Atlas Digital Replaced 5 Vendors with One Business OS',
    excerpt:
      'Atlas Digital Group consolidated registration, branding, CRM, and marketing into a single platform — and what changed.',
    date: '2026-02-10',
    category: 'Case Study',
    readTime: '7 min read',
    author: 'Sarah Chen',
  },
  {
    slug: 'ai-automation-for-founders',
    title: 'AI Automation for Founders: A Practical Guide',
    excerpt:
      'The workflows that deliver the highest ROI for early-stage companies — and how to implement them in under a week.',
    date: '2026-01-22',
    category: 'Insights',
    readTime: '8 min read',
    author: 'Oluwasegun Michael Johnson',
  },
  {
    slug: 'premium-brand-launch-checklist',
    title: 'The Premium Brand Launch Checklist for 2026',
    excerpt:
      'Everything ambitious founders need before going live — from entity setup to conversion-ready digital presence.',
    date: '2026-01-08',
    category: 'Guide',
    readTime: '10 min read',
    author: 'Amara Okafor',
  },
  {
    slug: 'crm-best-practices',
    title: 'CRM Best Practices for High-Growth Startups',
    excerpt:
      'How to structure your pipeline, automate follow-ups, and turn contacts into revenue without hiring a sales team.',
    date: '2025-12-18',
    category: 'Insights',
    readTime: '6 min read',
    author: 'David Martinez',
  },
]

export const PRODUCT_SCREENSHOTS = [
  {
    title: 'Executive Dashboard',
    description: 'Real-time KPIs, revenue trends, and pipeline health at a glance.',
    module: 'Dashboard',
  },
  {
    title: 'CRM Pipeline',
    description: 'Manage contacts, deals, and stages with drag-and-drop simplicity.',
    module: 'CRM',
  },
  {
    title: 'Workflow Automation',
    description: 'Build AI-powered sequences for follow-ups, onboarding, and growth.',
    module: 'Workflows',
  },
  {
    title: 'Analytics Center',
    description: 'Revenue attribution, conversion funnels, and team performance metrics.',
    module: 'Analytics',
  },
]

export function getServiceBySlug(slug: string): ServicePackage | undefined {
  return SERVICE_PACKAGES.find((s) => s.slug === slug)
}

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug)
}

