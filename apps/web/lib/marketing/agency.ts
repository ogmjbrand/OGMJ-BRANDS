/**
 * OGMJ BRANDS — Agency & professional services content (/agency)
 *
 * Content rules for this file (keep them when editing):
 * - No invented testimonials, client logos, results, revenue figures or
 *   metrics. The homepage TESTIMONIALS / CLIENT_LOGOS / TEAM entries in
 *   ./content.ts have NOT been verified as real and are deliberately
 *   not used on the agency page.
 * - Portfolio items only render when `published: true`, which should be
 *   set only after the client has approved being shown publicly.
 * - No prices here: services are scoped after the free Growth Audit.
 */

import {
  Sparkles,
  LayoutDashboard,
  Megaphone,
  Palette,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export const AGENCY = {
  eyebrow: 'OGMJ BRANDS · Agency',
  headline: 'We build brands',
  accent: 'that bring in clients.',
  intro:
    'OGMJ BRANDS is an international brand development, creative, digital marketing and business growth agency. We partner with founders and growing businesses to turn ideas into established, professional and scalable brands, from identity and websites to content, campaigns and automation.',
  promise: "We don't just make you look good. We bring you clients.",
  auditCtaLabel: 'Book Your Free Growth Audit',
  auditDescription:
    'A free 20-minute call where we review your brand, website and online presence, and show you the clearest opportunities to win more customers. No obligation.',
}

export type AgencyService = {
  id: string
  title: string
  summary: string
  icon: LucideIcon
  includes: string[]
}

export const AGENCY_SERVICES: AgencyService[] = [
  {
    id: 'brand-development',
    title: 'Brand Development',
    summary: 'Strategy, positioning and identity systems that make your business recognisable and trusted.',
    icon: Sparkles,
    includes: [
      'Brand strategy and positioning',
      'Naming and messaging',
      'Logo and corporate identity',
      'Brand guidelines',
      'Packaging and product presentation',
    ],
  },
  {
    id: 'website-ecommerce',
    title: 'Website & E-commerce Development',
    summary: 'Fast, conversion-focused websites and online stores built to turn visitors into customers.',
    icon: LayoutDashboard,
    includes: [
      'Business and brand websites',
      'E-commerce stores and checkout',
      'Landing pages and sales funnels',
      'SEO foundations and analytics',
      'Booking and enquiry flows',
    ],
  },
  {
    id: 'social-digital-marketing',
    title: 'Social Media & Digital Marketing',
    summary: 'Campaigns and always-on marketing that grow awareness, leads and sales.',
    icon: Megaphone,
    includes: [
      'Social media management',
      'Paid advertising (Meta, TikTok, Google)',
      'Email and WhatsApp marketing',
      'SEO and online visibility',
      'Lead generation and outreach',
    ],
  },
  {
    id: 'design-content',
    title: 'Graphic Design & Content Production',
    summary: 'Premium visuals, video and copy that tell your story consistently across every channel.',
    icon: Palette,
    includes: [
      'Graphic design and social creative',
      'Video production and editing',
      'Product and promotional content',
      'Copywriting and content strategy',
      'Presentations and sales materials',
    ],
  },
  {
    id: 'ai-automation',
    title: 'AI & Business Automation',
    summary: 'Practical AI and automated systems that save time and keep every lead followed up.',
    icon: Workflow,
    includes: [
      'CRM setup and pipeline automation',
      'Automated follow-up sequences',
      'AI assistants and chat',
      'Virtual assistance and admin support',
      'Customer service systems',
    ],
  },
]

export const AGENCY_PROCESS = [
  {
    step: '01',
    title: 'Free Growth Audit',
    description: 'A 20-minute call to understand your business and review your brand, website and channels.',
  },
  {
    step: '02',
    title: 'Strategy & Proposal',
    description: 'A clear, tailored plan with scope, deliverables and timeline. No surprises.',
  },
  {
    step: '03',
    title: 'Create & Build',
    description: 'Our team designs, builds and produces, with review points so you stay in control.',
  },
  {
    step: '04',
    title: 'Launch & Grow',
    description: 'We launch, measure what matters and keep improving to bring in more customers.',
  },
]

export type PortfolioItem = {
  name: string
  category: string
  /** What OGMJ actually delivered, stated factually. No outcome claims unless verified. */
  workDelivered: string
  url?: string
  /** Set to true only once the client has approved being shown publicly. */
  published: boolean
}

export const AGENCY_PORTFOLIO: PortfolioItem[] = [
  {
    name: 'By Chi Strands',
    category: 'Luxury hair brand',
    workDelivered: 'Brand design and e-commerce website design',
    url: 'https://bychistrands.vercel.app',
    published: false,
  },
  {
    name: 'CooMood',
    category: 'Fragrance and home scent brand',
    workDelivered: 'Brand positioning and e-commerce website design',
    url: 'https://coo-mood.vercel.app',
    published: false,
  },
]

export const ENQUIRY_SERVICE_OPTIONS = [
  { value: 'growth-audit', label: 'Free Growth Audit' },
  ...AGENCY_SERVICES.map((service) => ({ value: service.id, label: service.title })),
  { value: 'not-sure', label: "Not sure yet — let's talk" },
] as const

export const ENQUIRY_BUDGET_OPTIONS = [
  { value: 'not-sure', label: 'Not sure yet' },
  { value: 'under-1k', label: 'Under $1,000' },
  { value: '1k-5k', label: '$1,000 – $5,000' },
  { value: '5k-15k', label: '$5,000 – $15,000' },
  { value: '15k-plus', label: '$15,000+' },
] as const

export function getPublishedPortfolio(items: PortfolioItem[] = AGENCY_PORTFOLIO): PortfolioItem[] {
  return items.filter((item) => item.published)
}
