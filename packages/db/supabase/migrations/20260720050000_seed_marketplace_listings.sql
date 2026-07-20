-- Marketplace: seed OGMJ's own platform service listings. The homepage's
-- "Marketplace" section (#marketplace anchor) is a static marketing teaser
-- unrelated to this table; marketplace_listings/marketplace_orders existed
-- live with RLS (added in the Affiliate/Partner Hub PR) but no data and no
-- UI. Seeded from the same six services already described on the homepage
-- (SERVICE_PHOTOS in app/page.tsx) so the marketplace launches with real,
-- meaningful OGMJ offerings instead of placeholder listings.

INSERT INTO public.marketplace_listings
  (title, slug, category, description, short_desc, price, currency, price_type, delivery_days, revisions, features, is_platform, is_featured, sort_order, status)
SELECT * FROM (VALUES
  (
    'Business Operations Setup',
    'business-operations-setup',
    'Operations',
    'End-to-end setup of your registration, compliance, and day-to-day operations inside OGMJ BRANDS — CRM, invoicing, and team workspace configured and ready to run.',
    'Run registration, compliance, and day-to-day operations from one command layer.',
    150000::numeric, 'NGN', 'fixed', 10, 2,
    '["Business registration guidance", "Compliance checklist", "CRM + invoicing setup", "Team workspace configuration"]'::jsonb,
    true, true, 0, 'active'
  ),
  (
    'Brand Identity Package',
    'brand-identity-package',
    'Branding',
    'A complete identity system: logo refinement, brand guidelines, and creative direction built for global markets, delivered as production-ready assets.',
    'Identity systems, brand guidelines, and creative direction built for global markets.',
    250000::numeric, 'NGN', 'fixed', 14, 3,
    '["Logo refinement", "Brand guidelines document", "Color + typography system", "Social media templates"]'::jsonb,
    true, true, 1, 'active'
  ),
  (
    'Analytics & Automation Setup',
    'analytics-automation-setup',
    'Analytics',
    'Live dashboards and AI-assisted workflows configured for your business, turning day-to-day activity into decisions you can act on.',
    'Live dashboards and AI-assisted workflows that turn activity into decisions.',
    180000::numeric, 'NGN', 'fixed', 7, 2,
    '["Custom dashboard configuration", "Automated reporting", "Workflow automation setup", "KPI tracking"]'::jsonb,
    true, false, 2, 'active'
  ),
  (
    'Go-to-Market Launch Package',
    'go-to-market-launch',
    'Growth',
    'Go-to-market strategy, positioning, and a launch sequence that ships on time — from messaging to the first 30 days of execution.',
    'Go-to-market strategy, positioning, and a launch sequence that ships on time.',
    300000::numeric, 'NGN', 'starting_from', 21, 2,
    '["Positioning + messaging", "Launch sequence plan", "30-day execution calendar", "Performance review"]'::jsonb,
    true, false, 3, 'active'
  ),
  (
    'Dedicated Support Retainer',
    'dedicated-support-retainer',
    'Support',
    'A dedicated OGMJ team on call for your business every month, from onboarding questions to scaling challenges.',
    'A dedicated team on call for every stage, from onboarding to scale.',
    75000::numeric, 'NGN', 'fixed', 1, 0,
    '["Monthly dedicated support hours", "Priority response time", "Onboarding assistance", "Ongoing strategy check-ins"]'::jsonb,
    true, false, 4, 'active'
  ),
  (
    'Reporting & Insights Setup',
    'reporting-insights-setup',
    'Analytics',
    'Revenue, pipeline, and team performance made visible in real time — no spreadsheets, fully configured inside your OGMJ dashboard.',
    'Revenue, pipeline, and team performance visible in real time, no spreadsheets.',
    120000::numeric, 'NGN', 'fixed', 5, 2,
    '["Revenue tracking dashboard", "Pipeline visibility", "Team performance reports", "Custom KPI widgets"]'::jsonb,
    true, false, 5, 'active'
  )
) AS seed(title, slug, category, description, short_desc, price, currency, price_type, delivery_days, revisions, features, is_platform, is_featured, sort_order, status)
WHERE NOT EXISTS (SELECT 1 FROM public.marketplace_listings WHERE is_platform = true);
