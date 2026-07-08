-- ================================================================
-- OGMJ BRANDS - CANONICAL BASELINE SCHEMA
-- Generated from LIVE Supabase project czpfsfiatehldcavsvsw (read-only export)
-- Generated: 2026-07-08
-- Supersedes obsolete repo migrations 001/002/003 (never applied to this project).
-- Order: extensions -> enums -> tables -> functions -> constraints -> indexes
--        -> RLS enable -> policies -> triggers -> views
-- ================================================================

SET check_function_bodies = false;

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

CREATE TYPE public.business_role AS ENUM ('owner', 'admin', 'manager', 'member');

CREATE TYPE public.business_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TABLE IF NOT EXISTS public.ab_tests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  status text DEFAULT 'draft'::text,
  variants jsonb DEFAULT '[]'::jsonb,
  winner_variant text,
  confidence numeric(5,2),
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid,
  tool text NOT NULL,
  category text NOT NULL DEFAULT 'general'::text,
  title text,
  prompt text NOT NULL,
  output text NOT NULL,
  model text DEFAULT 'claude-sonnet-4-20250514'::text,
  tokens_used integer DEFAULT 0,
  is_saved boolean DEFAULT false,
  is_published boolean DEFAULT false,
  rating integer,
  tags text[] DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_execution_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  agent_type character varying(100) NOT NULL,
  model character varying(100) DEFAULT 'claude-sonnet-4-20250514'::character varying,
  prompt text,
  system_prompt text,
  output text,
  status character varying(50) DEFAULT 'completed'::character varying,
  tokens_used integer DEFAULT 0,
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  cost_usd numeric(10,6) DEFAULT 0,
  execution_time_ms integer,
  approved boolean DEFAULT false,
  approved_by uuid,
  approved_at timestamp with time zone,
  published boolean DEFAULT false,
  published_at timestamp with time zone,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.ai_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid,
  feature text NOT NULL,
  prompt_tokens integer DEFAULT 0,
  response_tokens integer DEFAULT 0,
  model text DEFAULT 'claude-sonnet-4-20250514'::text,
  result text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_memory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  category character varying(100) NOT NULL,
  key character varying(255) NOT NULL,
  value text NOT NULL,
  summary text,
  priority integer DEFAULT 0,
  usage_count integer DEFAULT 0,
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.ai_tool_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  tool_key text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics_daily (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  date date NOT NULL,
  entity_type text NOT NULL DEFAULT 'business'::text,
  entity_id uuid,
  visitors integer DEFAULT 0,
  page_views integer DEFAULT 0,
  sessions integer DEFAULT 0,
  bounces integer DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  new_contacts integer DEFAULT 0,
  emails_sent integer DEFAULT 0,
  emails_opened integer DEFAULT 0,
  emails_clicked integer DEFAULT 0,
  deals_created integer DEFAULT 0,
  deals_won integer DEFAULT 0,
  deals_value numeric DEFAULT 0,
  ai_calls integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  event_name text NOT NULL,
  event_type text NOT NULL,
  value numeric(12,2),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  scopes text[] DEFAULT '{}'::text[],
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  ip_whitelist text[] DEFAULT '{}'::text[],
  request_count bigint DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  window_start timestamp with time zone NOT NULL DEFAULT date_trunc('hour'::text, now()),
  endpoint text,
  request_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  contact_id uuid,
  deal_id uuid,
  lead_id uuid,
  owner_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  type text DEFAULT 'meeting'::text,
  status text DEFAULT 'scheduled'::text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  timezone text DEFAULT 'Africa/Lagos'::text,
  location text,
  meeting_url text,
  reminder_sent boolean DEFAULT false,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid,
  action character varying(100) NOT NULL,
  resource_type character varying(100) NOT NULL,
  resource_id uuid,
  changes jsonb,
  ip_address inet,
  user_agent text,
  status character varying(20) DEFAULT 'success'::character varying,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_addons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  addon_id uuid NOT NULL,
  transaction_id uuid,
  status text DEFAULT 'active'::text,
  starts_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role business_role NOT NULL DEFAULT 'member'::business_role,
  is_active boolean NOT NULL DEFAULT true,
  invited_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  key text NOT NULL,
  value jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role character varying(20) NOT NULL DEFAULT 'member'::character varying,
  invited_at timestamp with time zone DEFAULT now(),
  joined_at timestamp with time zone,
  invited_by uuid,
  status character varying(20) DEFAULT 'active'::character varying,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL DEFAULT ''::text,
  type text NOT NULL DEFAULT 'service_provider'::text,
  industry text NOT NULL DEFAULT ''::text,
  owner_id uuid NOT NULL,
  description text,
  website text,
  address jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  country text,
  currency text,
  user_id uuid,
  created_by uuid,
  business_name text,
  slug text NOT NULL DEFAULT ('business-'::text || (gen_random_uuid())::text),
  status business_status NOT NULL DEFAULT 'active'::business_status,
  timezone text DEFAULT 'Africa/Lagos'::text,
  legal_name text,
  logo_url text,
  website_url text,
  phone text,
  email text,
  state text,
  city text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_verified boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  onboarding_step integer DEFAULT 1,
  business_type text,
  tax_id text,
  registration_number text,
  domain character varying(255),
  custom_domain character varying(255),
  brand_color character varying(7) DEFAULT '#D4AF37'::character varying,
  team_size integer
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'email'::text,
  status text NOT NULL DEFAULT 'draft'::text,
  subject text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  stats jsonb NOT NULL DEFAULT '{"sent": 0, "opened": 0, "bounced": 0, "clicked": 0, "delivered": 0, "unsubscribed": 0}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  client_id uuid,
  project_id uuid,
  invoice_number text NOT NULL,
  title text,
  status text DEFAULT 'draft'::text,
  currency text DEFAULT 'NGN'::text,
  subtotal numeric(12,2) DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  discount numeric(12,2) DEFAULT 0,
  total numeric(12,2) DEFAULT 0,
  notes text,
  terms text,
  due_date date,
  sent_at timestamp with time zone,
  paid_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  address jsonb,
  status text DEFAULT 'active'::text,
  tags text[] DEFAULT '{}'::text[],
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  source text,
  total_revenue numeric(12,2) DEFAULT 0,
  avatar_url text,
  website text,
  industry text
);

CREATE TABLE IF NOT EXISTS public.clips (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  title text,
  start_time numeric(10,2),
  end_time numeric(10,2),
  file_path text,
  score numeric(5,2),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.components (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name character varying(255) NOT NULL,
  type character varying(100) NOT NULL,
  category character varying(100),
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  styles jsonb NOT NULL DEFAULT '{}'::jsonb,
  code text,
  thumbnail_url text,
  preview_url text,
  status character varying(20) DEFAULT 'draft'::character varying,
  visibility character varying(20) DEFAULT 'private'::character varying,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.contact_tags (
  contact_id uuid NOT NULL,
  tag_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text,
  email text,
  phone text,
  company text,
  job_title text,
  website text,
  avatar_url text,
  source text,
  status text NOT NULL DEFAULT 'active'::text,
  lifecycle_stage text NOT NULL DEFAULT 'lead'::text,
  country text,
  city text,
  timezone text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  company_name character varying(255),
  lead_score integer DEFAULT 0,
  last_contact_at timestamp with time zone,
  next_followup_at timestamp with time zone,
  tags text[] DEFAULT '{}'::text[],
  created_by uuid,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.content_calendar (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  post_id uuid,
  campaign_id uuid,
  title text NOT NULL,
  content text,
  platform text,
  post_type text DEFAULT 'post'::text,
  scheduled_at timestamp with time zone NOT NULL,
  status text DEFAULT 'planned'::text,
  color text DEFAULT '#10B981'::text,
  created_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  business_id uuid NOT NULL,
  role text DEFAULT 'member'::text,
  last_read_at timestamp with time zone,
  unread_count integer DEFAULT 0,
  is_muted boolean DEFAULT false,
  joined_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  title text,
  type text DEFAULT 'direct'::text,
  context_type text,
  context_id uuid,
  is_archived boolean DEFAULT false,
  last_message_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  contact_id uuid,
  deal_id uuid,
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  outcome text,
  scheduled_at timestamp with time zone,
  completed_at timestamp with time zone,
  duration_min integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  contact_id uuid,
  deal_id uuid,
  user_id uuid,
  content text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cron_job_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  status text NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  duration_ms integer,
  records_processed integer DEFAULT 0,
  error text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custom_domains (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  website_id uuid,
  funnel_id uuid,
  domain text NOT NULL,
  subdomain text,
  status text NOT NULL DEFAULT 'pending'::text,
  ssl_status text NOT NULL DEFAULT 'pending'::text,
  dns_verified boolean NOT NULL DEFAULT false,
  verified_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deal_tags (
  deal_id uuid NOT NULL,
  tag_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.deals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  pipeline_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  contact_id uuid,
  owner_id uuid,
  title text NOT NULL,
  value numeric(18,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD'::text,
  status text NOT NULL DEFAULT 'open'::text,
  close_date date,
  lost_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  description text,
  stage character varying(50) DEFAULT 'prospecting'::character varying,
  probability integer DEFAULT 0,
  expected_close_date date,
  closed_at timestamp with time zone,
  created_by uuid,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.discount_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  code text NOT NULL,
  name text,
  description text,
  type text NOT NULL DEFAULT 'percentage'::text,
  value numeric(12,2) NOT NULL DEFAULT 0,
  minimum_order numeric(12,2),
  maximum_discount numeric(12,2),
  currency text DEFAULT 'NGN'::text,
  applies_to text DEFAULT 'all'::text,
  applies_to_ids text[] DEFAULT '{}'::text[],
  usage_limit integer,
  usage_limit_per_customer integer DEFAULT 1,
  times_used integer DEFAULT 0,
  is_active boolean DEFAULT true,
  starts_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  to_email text NOT NULL,
  to_name text,
  subject text NOT NULL,
  template text,
  status text DEFAULT 'sent'::text,
  provider_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL,
  business_id uuid NOT NULL,
  position integer NOT NULL,
  name text,
  subject text NOT NULL,
  preview_text text,
  html_body text NOT NULL,
  text_body text,
  delay_days integer DEFAULT 0,
  delay_hours integer DEFAULT 0,
  send_time time without time zone,
  variables jsonb DEFAULT '[]'::jsonb,
  stats jsonb DEFAULT '{"sent": 0, "opened": 0, "bounced": 0, "clicked": 0, "unsubscribed": 0}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  owner_id uuid,
  name text NOT NULL,
  description text,
  status text DEFAULT 'draft'::text,
  trigger_type text DEFAULT 'manual'::text,
  trigger_config jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{"send_days": ["mon", "tue", "wed", "thu", "fri"], "send_hour": 9}'::jsonb,
  total_enrolled integer DEFAULT 0,
  total_completed integer DEFAULT 0,
  total_unsubscribed integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  preview_text text,
  html_body text NOT NULL,
  text_body text,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text NOT NULL DEFAULT 'transactional'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  email text NOT NULL,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  unsubscribed_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  website_id uuid,
  event_type character varying(100) NOT NULL,
  event_name character varying(255),
  visitor_id character varying(255),
  session_id character varying(255),
  user_id character varying(255),
  properties jsonb DEFAULT '{}'::jsonb,
  url character varying(2048),
  referrer character varying(2048),
  utm_source character varying(255),
  utm_medium character varying(255),
  utm_campaign character varying(255),
  utm_content character varying(255),
  utm_term character varying(255),
  device_type character varying(50),
  browser character varying(100),
  os character varying(100),
  ip_address inet,
  country character varying(2),
  city character varying(100),
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  name text NOT NULL,
  description text,
  is_enabled boolean DEFAULT false,
  rollout_percentage integer DEFAULT 0,
  enabled_for_plans text[] DEFAULT '{}'::text[],
  enabled_for_businesses uuid[] DEFAULT '{}'::uuid[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.form_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL,
  business_id uuid NOT NULL,
  contact_id uuid,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  referrer text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  style jsonb DEFAULT '{}'::jsonb,
  redirect_url text,
  webhook_url text,
  status text DEFAULT 'active'::text,
  submissions integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funnel_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL,
  business_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'optin'::text,
  position integer NOT NULL DEFAULT 0,
  slug text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  stats jsonb NOT NULL DEFAULT '{"views": 0, "conversions": 0, "submissions": 0}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funnel_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  funnel_id uuid NOT NULL,
  step_id uuid,
  contact_id uuid,
  email text,
  phone text,
  full_name text,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  ip_address text,
  user_agent text,
  referrer_url text,
  country text,
  city text,
  is_converted boolean DEFAULT false,
  converted_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funnels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'lead_gen'::text,
  status text NOT NULL DEFAULT 'draft'::text,
  slug text,
  thumbnail_url text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  stats jsonb NOT NULL DEFAULT '{"leads": 0, "visitors": 0, "conversions": 0}'::jsonb,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  name text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  credentials jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  last_synced_at timestamp with time zone,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  deal_id uuid,
  type character varying(50) NOT NULL,
  subject character varying(255),
  body text,
  direction character varying(10) DEFAULT 'outbound'::character varying,
  duration_secs integer,
  outcome character varying(100),
  scheduled_at timestamp with time zone,
  completed_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member'::text,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'::text),
  status text NOT NULL DEFAULT 'pending'::text,
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  accepted_at timestamp with time zone,
  message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  redeemed_at timestamp with time zone,
  redeemed_by uuid,
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  description text NOT NULL,
  quantity numeric(10,2) DEFAULT 1,
  unit_price numeric(12,2) NOT NULL,
  total numeric(12,2) DEFAULT (quantity * unit_price),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  subscription_id uuid,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'NGN'::text,
  status text NOT NULL,
  provider text NOT NULL,
  provider_reference text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  category text NOT NULL,
  subcategory text,
  tags text[] DEFAULT '{}'::text[],
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  views integer DEFAULT 0,
  helpful integer DEFAULT 0,
  not_helpful integer DEFAULT 0,
  author_id uuid,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  contact_id uuid,
  owner_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  company text,
  job_title text,
  source text,
  source_detail text,
  status text NOT NULL DEFAULT 'new'::text,
  score integer DEFAULT 0,
  temperature text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  country text,
  city text,
  tags text[] DEFAULT '{}'::text[],
  notes text,
  form_id uuid,
  funnel_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  converted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.list_contacts (
  list_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  subscribed_at timestamp with time zone DEFAULT now(),
  unsubscribed_at timestamp with time zone,
  status text DEFAULT 'subscribed'::text,
  source text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  category text NOT NULL,
  subcategory text,
  description text,
  short_desc text,
  price numeric NOT NULL DEFAULT 0,
  sale_price numeric,
  currency text NOT NULL DEFAULT 'NGN'::text,
  price_type text NOT NULL DEFAULT 'fixed'::text,
  delivery_days integer DEFAULT 7,
  revisions integer DEFAULT 2,
  thumbnail_url text,
  gallery jsonb DEFAULT '[]'::jsonb,
  features jsonb DEFAULT '[]'::jsonb,
  faq jsonb DEFAULT '[]'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'active'::text,
  is_featured boolean DEFAULT false,
  is_platform boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  listing_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  order_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  quantity integer DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'NGN'::text,
  requirements text,
  brief jsonb DEFAULT '{}'::jsonb,
  delivery_date date,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancel_reason text,
  rating integer,
  review text,
  reviewed_at timestamp with time zone,
  delivery_files jsonb DEFAULT '[]'::jsonb,
  revisions_used integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  uploaded_by uuid,
  name text NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  mime_type text,
  folder text DEFAULT 'general'::text,
  alt_text text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  business_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'text'::text,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_edited boolean DEFAULT false,
  edited_at timestamp with time zone,
  is_deleted boolean DEFAULT false,
  deleted_at timestamp with time zone,
  reply_to_id uuid,
  reactions jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info'::text,
  category text NOT NULL DEFAULT 'general'::text,
  is_read boolean DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  current_step integer DEFAULT 1,
  completed_steps jsonb DEFAULT '[]'::jsonb,
  is_complete boolean DEFAULT false,
  completed_at timestamp with time zone,
  skipped_steps jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_system boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  legal_name text,
  slug text NOT NULL,
  industry text,
  business_type text,
  description text,
  logo_url text,
  website_url text,
  phone text,
  email text,
  country text NOT NULL DEFAULT 'Nigeria'::text,
  state text,
  city text,
  address text,
  currency text NOT NULL DEFAULT 'NGN'::text,
  timezone text DEFAULT 'Africa/Lagos'::text,
  tax_id text,
  registration_number text,
  status text NOT NULL DEFAULT 'active'::text,
  is_verified boolean NOT NULL DEFAULT false,
  onboarding_completed boolean NOT NULL DEFAULT false,
  onboarding_step integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.page_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL,
  business_id uuid NOT NULL,
  version integer NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  saved_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  seo_title text,
  seo_description text,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  content jsonb DEFAULT '{}'::jsonb,
  meta jsonb DEFAULT '{}'::jsonb,
  page_order integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid,
  reference text NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  provider_reference text,
  provider_customer_id text,
  amount numeric NOT NULL,
  fee numeric DEFAULT 0,
  net_amount numeric DEFAULT (amount - fee),
  currency text NOT NULL DEFAULT 'NGN'::text,
  status text NOT NULL DEFAULT 'pending'::text,
  description text,
  entity_type text,
  entity_id uuid,
  payment_method text,
  bank_name text,
  account_number text,
  account_name text,
  paid_at timestamp with time zone,
  failed_at timestamp with time zone,
  refunded_at timestamp with time zone,
  refund_reason text,
  webhook_data jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payout_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'NGN'::text,
  bank_name text,
  account_number text,
  account_name text,
  status text NOT NULL DEFAULT 'pending'::text,
  notes text,
  processed_at timestamp with time zone,
  processed_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permission_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid,
  name text NOT NULL,
  description text,
  is_system boolean DEFAULT false,
  permissions jsonb DEFAULT '[]'::jsonb,
  color text DEFAULT '#6B7280'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL,
  business_id uuid NOT NULL,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#6366f1'::text,
  probability integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pipelines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_addons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD'::text,
  interval text DEFAULT 'monthly'::text,
  feature_key text NOT NULL,
  feature_value jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  websites_limit integer DEFAULT 1,
  funnels_limit integer DEFAULT 3,
  contacts_limit integer DEFAULT 500,
  team_members_limit integer DEFAULT 2,
  ai_tokens_monthly bigint DEFAULT 50000,
  email_sends_monthly integer DEFAULT 1000,
  storage_gb numeric DEFAULT 1,
  api_calls_monthly integer DEFAULT 10000,
  social_accounts_limit integer DEFAULT 2,
  campaigns_limit integer DEFAULT 5,
  custom_domains_limit integer DEFAULT 1,
  workflows_limit integer DEFAULT 5,
  marketplace_orders integer DEFAULT 3,
  remove_branding boolean DEFAULT false,
  priority_support boolean DEFAULT false,
  advanced_analytics boolean DEFAULT false,
  white_label boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN'::text,
  interval text NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  level text NOT NULL DEFAULT 'admin'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  target_email text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  business_id uuid NOT NULL,
  name text NOT NULL,
  sku text,
  options jsonb DEFAULT '{}'::jsonb,
  price numeric(12,2),
  compare_price numeric(12,2),
  cost_price numeric(12,2),
  stock_quantity integer DEFAULT 0,
  is_default boolean DEFAULT false,
  image_url text,
  weight numeric(8,2),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  short_description text,
  type text DEFAULT 'service'::text,
  category text,
  sku text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  compare_price numeric(12,2),
  cost_price numeric(12,2),
  currency text DEFAULT 'NGN'::text,
  stock_quantity integer DEFAULT 0,
  track_stock boolean DEFAULT false,
  is_unlimited boolean DEFAULT true,
  weight numeric(8,2),
  dimensions jsonb DEFAULT '{"unit": "cm", "width": 0, "height": 0, "length": 0}'::jsonb,
  images text[] DEFAULT '{}'::text[],
  thumbnail_url text,
  tags text[] DEFAULT '{}'::text[],
  status text DEFAULT 'draft'::text,
  is_featured boolean DEFAULT false,
  is_digital boolean DEFAULT false,
  digital_file_url text,
  seo jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  name text,
  avatar_url text,
  business_id uuid,
  role text DEFAULT 'user'::text,
  onboarding_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  phone text
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  client_id uuid,
  name text NOT NULL,
  description text,
  status text DEFAULT 'planning'::text,
  priority text DEFAULT 'medium'::text,
  budget numeric(10,2),
  start_date date,
  end_date date,
  progress integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  tags text[] DEFAULT '{}'::text[],
  assigned_to uuid,
  color text DEFAULT '#D4AF37'::text,
  is_archived boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  endpoint character varying(255) NOT NULL,
  identifier character varying(255),
  count integer DEFAULT 0,
  window_start timestamp with time zone DEFAULT now(),
  window_end timestamp with time zone DEFAULT (now() + '01:00:00'::interval),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL,
  ip_hash text,
  user_agent text,
  referrer_url text,
  landing_url text,
  converted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL,
  referrer_id uuid NOT NULL,
  transaction_id uuid,
  order_id uuid,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'NGN'::text,
  status text NOT NULL DEFAULT 'pending'::text,
  approved_at timestamp with time zone,
  paid_at timestamp with time zone,
  payout_ref text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  commission_type text NOT NULL DEFAULT 'percentage'::text,
  commission_value numeric NOT NULL DEFAULT 10,
  cookie_days integer DEFAULT 30,
  min_payout numeric DEFAULT 5000,
  payout_currency text DEFAULT 'NGN'::text,
  is_active boolean DEFAULT true,
  rules jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  referrer_id uuid NOT NULL,
  referred_id uuid,
  business_id uuid,
  code text NOT NULL,
  link text,
  clicks integer DEFAULT 0,
  signups integer DEFAULT 0,
  conversions integer DEFAULT 0,
  total_earned numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL,
  type text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sequence_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL,
  business_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  current_step integer DEFAULT 0,
  status text DEFAULT 'active'::text,
  enrolled_at timestamp with time zone DEFAULT now(),
  next_send_at timestamp with time zone,
  completed_at timestamp with time zone,
  unsubscribed_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  price numeric(12,2),
  currency text DEFAULT 'NGN'::text,
  price_type text DEFAULT 'fixed'::text,
  is_active boolean DEFAULT true,
  tags text[] DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  domain text,
  is_published boolean DEFAULT false,
  theme jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  published_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.social_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  platform text NOT NULL,
  account_name text NOT NULL,
  account_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  followers integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  account_id uuid,
  title text,
  content text NOT NULL,
  media_urls text[] DEFAULT '{}'::text[],
  platforms text[] DEFAULT '{}'::text[],
  status text DEFAULT 'draft'::text,
  scheduled_at timestamp with time zone,
  published_at timestamp with time zone,
  engagement jsonb DEFAULT '{"likes": 0, "reach": 0, "shares": 0, "comments": 0}'::jsonb,
  external_id text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriber_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  owner_id uuid,
  name text NOT NULL,
  description text,
  type text DEFAULT 'manual'::text,
  filter_rules jsonb DEFAULT '{}'::jsonb,
  count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  double_optin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  slug character varying(100) NOT NULL,
  description text,
  tagline character varying(255),
  price_ngn numeric(12,2) NOT NULL DEFAULT 0,
  price_usd numeric(12,2) NOT NULL DEFAULT 0,
  currency character varying(3) DEFAULT 'NGN'::character varying,
  billing_period character varying(20) DEFAULT 'monthly'::character varying,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  max_users integer DEFAULT 5,
  max_contacts integer DEFAULT 1000,
  max_websites integer DEFAULT 3,
  max_storage_gb integer DEFAULT 50,
  ai_tokens_monthly integer DEFAULT 100000,
  is_popular boolean DEFAULT false,
  is_enterprise boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  status character varying(20) DEFAULT 'active'::character varying,
  stripe_price_id character varying(255),
  paystack_plan_code character varying(255),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  provider text NOT NULL,
  provider_subscription_id text,
  provider_customer_id text,
  status text NOT NULL,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  amount numeric(12,2),
  billing_period character varying(20) DEFAULT 'monthly'::character varying,
  current_period_start date,
  current_period_end date,
  cancel_at date,
  cancelled_at timestamp with time zone,
  payment_method character varying(50),
  reference_id character varying(255),
  metadata jsonb DEFAULT '{}'::jsonb,
  currency character varying(3) DEFAULT 'NGN'::character varying
);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  created_by uuid NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open'::text,
  priority text NOT NULL DEFAULT 'medium'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo'::text,
  priority text NOT NULL DEFAULT 'medium'::text,
  assigned_to uuid,
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  tags text[] DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  project_id uuid,
  client_id uuid,
  estimated_hours numeric(5,2),
  actual_hours numeric(5,2)
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member'::text,
  is_active boolean DEFAULT true,
  invited_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  preview_image text,
  schema jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  subscription_id uuid,
  type character varying(50) NOT NULL,
  amount numeric(15,2) NOT NULL,
  currency character varying(3) DEFAULT 'NGN'::character varying,
  status character varying(50) DEFAULT 'pending'::character varying,
  payment_provider character varying(50),
  provider_reference character varying(255),
  provider_response jsonb DEFAULT '{}'::jsonb,
  invoice_number character varying(50),
  invoice_url text,
  receipt_url text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transcripts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  content text,
  language text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  metric_type character varying(100) NOT NULL,
  value bigint DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.usage_quotas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  ai_tokens_used bigint DEFAULT 0,
  ai_tokens_limit bigint DEFAULT 100000,
  websites_count integer DEFAULT 0,
  funnels_count integer DEFAULT 0,
  contacts_count integer DEFAULT 0,
  emails_sent integer DEFAULT 0,
  storage_bytes bigint DEFAULT 0,
  api_calls integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_role_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  assigned_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid,
  ip_address inet,
  user_agent text,
  device_type text,
  browser text,
  os text,
  country text,
  city text,
  started_at timestamp with time zone DEFAULT now(),
  last_seen_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.video_clips (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  video_id uuid NOT NULL,
  title character varying(255),
  description text,
  start_time_seconds integer NOT NULL,
  end_time_seconds integer NOT NULL,
  duration_seconds integer DEFAULT (end_time_seconds - start_time_seconds),
  aspect_ratio character varying(10) DEFAULT '16:9'::character varying,
  file_url text,
  file_path text,
  thumbnail_url text,
  has_captions boolean DEFAULT false,
  caption_file_url text,
  highlighted_keywords text[] DEFAULT '{}'::text[],
  viral_score numeric(4,2) DEFAULT 0,
  platform_targets text[] DEFAULT '{}'::text[],
  export_formats jsonb DEFAULT '{}'::jsonb,
  status character varying(50) DEFAULT 'pending'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  title text NOT NULL,
  file_path text NOT NULL,
  status text NOT NULL DEFAULT 'uploaded'::text,
  created_at timestamp with time zone DEFAULT now(),
  description text,
  source_url text,
  source_type character varying(50),
  file_url text,
  thumbnail_url text,
  duration_seconds integer,
  file_size_bytes bigint,
  transcription text,
  transcript_status character varying(50) DEFAULT 'pending'::character varying,
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.web_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL,
  business_id uuid NOT NULL,
  parent_id uuid,
  title text NOT NULL,
  slug text NOT NULL,
  type text NOT NULL DEFAULT 'page'::text,
  status text NOT NULL DEFAULT 'draft'::text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL,
  business_id uuid NOT NULL,
  event text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  http_status integer,
  response text,
  attempt integer DEFAULT 1,
  duration_ms integer,
  fired_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  secret text,
  events text[] NOT NULL DEFAULT '{}'::text[],
  is_active boolean DEFAULT true,
  retry_count integer DEFAULT 3,
  timeout_sec integer DEFAULT 30,
  headers jsonb DEFAULT '{}'::jsonb,
  last_fired_at timestamp with time zone,
  failure_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.website_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  website_id uuid,
  funnel_id uuid,
  session_id text,
  visitor_id text,
  page_url text NOT NULL,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  country text,
  city text,
  device_type text,
  browser text,
  os text,
  duration_sec integer,
  is_bounce boolean DEFAULT false,
  event_type text NOT NULL DEFAULT 'pageview'::text,
  event_name text,
  event_value numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.websites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  template_id text,
  status text NOT NULL DEFAULT 'draft'::text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  ssl_certificate text,
  seo_title character varying(255),
  seo_description text,
  analytics_id character varying(100),
  favicon_url text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL,
  business_id uuid NOT NULL,
  contact_id uuid,
  deal_id uuid,
  status text NOT NULL DEFAULT 'running'::text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  error text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.workflow_step_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL,
  step_index integer NOT NULL,
  action_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  executed_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workflows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft'::text,
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  run_count integer NOT NULL DEFAULT 0,
  last_run_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  slug text NOT NULL,
  is_default boolean DEFAULT false,
  color text DEFAULT '#10B981'::text,
  icon text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  inv public.invitations%ROWTYPE;
  result jsonb;
BEGIN
  SELECT * INTO inv FROM public.invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > now();

  IF inv.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Add member
  INSERT INTO public.business_members (business_id, user_id, role, invited_by)
  VALUES (inv.business_id, auth.uid(), inv.role, inv.invited_by)
  ON CONFLICT DO NOTHING;

  -- Update invitation status
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = inv.id;

  RETURN jsonb_build_object('success', true, 'business_id', inv.business_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.add_owner_as_business_member()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.business_members (business_id, user_id, role, is_active)
  values (new.id, new.owner_id, 'owner', true)
  on conflict (business_id, user_id) do nothing;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.add_owner_to_team_members()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.team_members (business_id, user_id, role, is_active)
  values (new.id, new.owner_id, 'owner', true)
  on conflict (business_id, user_id) do nothing;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_lead_score(p_lead_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_lead leads%ROWTYPE;
  v_score integer := 0;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  IF v_lead.email IS NOT NULL THEN v_score := v_score + 15; END IF;
  IF v_lead.phone IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_lead.company IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_lead.job_title IS NOT NULL THEN v_score := v_score + 5; END IF;
  IF v_lead.source = 'referral' THEN v_score := v_score + 20; END IF;
  IF v_lead.source = 'paid' THEN v_score := v_score + 15; END IF;
  IF v_lead.source = 'organic' THEN v_score := v_score + 10; END IF;
  IF v_lead.status = 'qualified' THEN v_score := v_score + 25; END IF;
  IF v_lead.status = 'contacted' THEN v_score := v_score + 10; END IF;
  v_score := LEAST(v_score, 100);
  UPDATE leads SET score = v_score WHERE id = p_lead_id;
  RETURN v_score;
END; $function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM rate_limits WHERE window_end < NOW() - INTERVAL '2 hours';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.convert_lead_to_contact(p_lead_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_lead leads%ROWTYPE;
  v_contact_id uuid;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;

  INSERT INTO contacts (
    business_id, first_name, last_name, email, phone,
    company, job_title, source, country, city, lifecycle_stage, metadata
  ) VALUES (
    v_lead.business_id, v_lead.first_name, v_lead.last_name,
    v_lead.email, v_lead.phone, v_lead.company, v_lead.job_title,
    v_lead.source, v_lead.country, v_lead.city, 'lead', v_lead.metadata
  )
  RETURNING id INTO v_contact_id;

  UPDATE leads SET status = 'converted', contact_id = v_contact_id, converted_at = now()
  WHERE id = p_lead_id;
  RETURN v_contact_id;
END; $function$
;

CREATE OR REPLACE FUNCTION public.create_business(p_name text, p_industry text DEFAULT NULL::text, p_country text DEFAULT 'Nigeria'::text, p_currency text DEFAULT 'NGN'::text)
 RETURNS businesses
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  new_business public.businesses;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.businesses (
    owner_id,
    name,
    industry,
    country,
    currency
  )
  values (
    auth.uid(),
    p_name,
    p_industry,
    p_country,
    p_currency
  )
  returning * into new_business;

  return new_business;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.create_default_workspace(p_business_id uuid, p_owner_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE v_workspace_id uuid;
BEGIN
  INSERT INTO workspaces (business_id, name, slug, is_default, created_by)
  VALUES (p_business_id, 'Main Workspace', 'main', true, p_owner_id)
  ON CONFLICT (business_id, slug) DO NOTHING
  RETURNING id INTO v_workspace_id;

  IF v_workspace_id IS NOT NULL THEN
    INSERT INTO workspace_members (workspace_id, business_id, user_id, role)
    VALUES (v_workspace_id, p_business_id, p_owner_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END IF;
  RETURN v_workspace_id;
END; $function$
;

CREATE OR REPLACE FUNCTION public.create_notification(p_business_id uuid, p_user_id uuid, p_title text, p_message text, p_type text DEFAULT 'info'::text, p_category text DEFAULT 'general'::text, p_action_url text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  notif_id uuid;
BEGIN
  INSERT INTO public.notifications (business_id, user_id, title, message, type, category, action_url)
  VALUES (p_business_id, p_user_id, p_title, p_message, p_type, p_category, p_action_url)
  RETURNING id INTO notif_id;
  RETURN notif_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enroll_contact_in_sequence(p_sequence_id uuid, p_contact_id uuid, p_business_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_enrollment_id uuid;
  v_first_delay integer;
BEGIN
  SELECT delay_days * 24 * 60 + delay_hours * 60 INTO v_first_delay
  FROM email_sequence_steps WHERE sequence_id = p_sequence_id AND position = 1;

  INSERT INTO sequence_enrollments (sequence_id, business_id, contact_id, current_step, status, next_send_at)
  VALUES (p_sequence_id, p_business_id, p_contact_id, 0, 'active',
    now() + (COALESCE(v_first_delay, 0) * interval '1 minute'))
  ON CONFLICT (sequence_id, contact_id) DO UPDATE
    SET status = 'active', next_send_at = EXCLUDED.next_send_at, current_step = 0
  RETURNING id INTO v_enrollment_id;

  UPDATE email_sequences SET total_enrolled = total_enrolled + 1 WHERE id = p_sequence_id;
  RETURN v_enrollment_id;
END; $function$
;

CREATE OR REPLACE FUNCTION public.funnel_submission_to_contact()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  contact_id_var uuid;
  parts text[];
BEGIN
  IF NEW.email IS NOT NULL THEN
    -- Check if contact exists
    SELECT id INTO contact_id_var
    FROM public.contacts
    WHERE business_id = NEW.business_id AND email = NEW.email
    LIMIT 1;

    IF contact_id_var IS NULL THEN
      -- Parse name
      parts := string_to_array(COALESCE(NEW.full_name, ''), ' ');
      INSERT INTO public.contacts (
        business_id, owner_id, first_name, last_name, email, phone,
        source, lifecycle_stage, metadata
      )
      SELECT
        NEW.business_id,
        b.owner_id,
        COALESCE(parts[1], 'Unknown'),
        CASE WHEN array_length(parts, 1) > 1 THEN parts[2] ELSE NULL END,
        NEW.email,
        NEW.phone,
        'funnel',
        'lead',
        jsonb_build_object('funnel_id', NEW.funnel_id, 'utm_source', NEW.utm_source)
      FROM public.businesses b WHERE b.id = NEW.business_id
      RETURNING id INTO contact_id_var;
    END IF;

    -- Link contact to submission
    UPDATE public.funnel_submissions
    SET contact_id = contact_id_var
    WHERE id = NEW.id;

    -- Update funnel stats
    UPDATE public.funnels
    SET stats = jsonb_set(
      COALESCE(stats, '{}'),
      '{leads}',
      to_jsonb(COALESCE((stats->>'leads')::int, 0) + 1)
    )
    WHERE id = NEW.funnel_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE biz_prefix text; seq int;
BEGIN
  SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 3))
  INTO biz_prefix FROM public.businesses WHERE id = NEW.business_id;
  SELECT COUNT(*) + 1 INTO seq FROM public.client_invoices WHERE business_id = NEW.business_id;
  NEW.invoice_number := COALESCE(biz_prefix, 'INV') || '-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(seq::text, 4, '0');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'ORD-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_slug(text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  RETURN LOWER(
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE($1, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_unique_business_slug(base_name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  base_slug := public.slugify(base_name);

  if base_slug is null or base_slug = '' then
    base_slug := 'business';
  end if;

  final_slug := base_slug;

  while exists (
    select 1
    from public.businesses
    where slug = final_slug
  ) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  return final_slug;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_analytics_range(p_business_id uuid, p_start date, p_end date)
 RETURNS TABLE(date date, visitors integer, page_views integer, conversions integer, revenue numeric, new_contacts integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NOT public.is_business_member(p_business_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT d.date, d.visitors, d.page_views, d.conversions, d.revenue, d.new_contacts
  FROM public.analytics_daily d
  WHERE d.business_id = p_business_id
  AND d.date BETWEEN p_start AND p_end
  AND d.entity_type = 'business'
  ORDER BY d.date;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_business_stats(p_business_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_contacts',       (SELECT COUNT(*) FROM contacts     WHERE business_id = p_business_id),
    'total_deals',          (SELECT COUNT(*) FROM deals        WHERE business_id = p_business_id),
    'open_deals',           (SELECT COUNT(*) FROM deals        WHERE business_id = p_business_id AND status = 'open'),
    'deals_value',          (SELECT COALESCE(SUM(value),0)     FROM deals WHERE business_id = p_business_id AND status = 'open'),
    'total_websites',       (SELECT COUNT(*) FROM websites     WHERE business_id = p_business_id),
    'open_tickets',         (SELECT COUNT(*) FROM support_tickets WHERE business_id = p_business_id AND status = 'open'),
    'ai_tokens_used_month', (SELECT COALESCE(SUM(tokens_used),0) FROM ai_execution_logs
                             WHERE business_id = p_business_id
                               AND created_at >= date_trunc('month', NOW()))
  ) INTO v_result;
  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_business_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_business_member(p_business_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'contacts_total', (SELECT COUNT(*) FROM public.contacts WHERE business_id = p_business_id),
    'contacts_new_30d', (SELECT COUNT(*) FROM public.contacts WHERE business_id = p_business_id AND created_at > now() - interval '30 days'),
    'deals_open', (SELECT COUNT(*) FROM public.deals WHERE business_id = p_business_id AND status = 'open'),
    'deals_value', (SELECT COALESCE(SUM(value), 0) FROM public.deals WHERE business_id = p_business_id AND status = 'open'),
    'deals_won_30d', (SELECT COUNT(*) FROM public.deals WHERE business_id = p_business_id AND status = 'won' AND updated_at > now() - interval '30 days'),
    'revenue_won_30d', (SELECT COALESCE(SUM(value), 0) FROM public.deals WHERE business_id = p_business_id AND status = 'won' AND updated_at > now() - interval '30 days'),
    'invoices_outstanding', (SELECT COUNT(*) FROM public.client_invoices WHERE business_id = p_business_id AND status IN ('sent','overdue')),
    'invoices_outstanding_value', (SELECT COALESCE(SUM(total), 0) FROM public.client_invoices WHERE business_id = p_business_id AND status IN ('sent','overdue')),
    'projects_active', (SELECT COUNT(*) FROM public.projects WHERE business_id = p_business_id AND status = 'active'),
    'tasks_due_today', (SELECT COUNT(*) FROM public.tasks WHERE business_id = p_business_id AND status != 'completed' AND due_date::date = CURRENT_DATE),
    'ai_tokens_used', (SELECT COALESCE(SUM(ai_tokens_used), 0) FROM public.usage_quotas WHERE business_id = p_business_id AND period_start = date_trunc('month', now())::date),
    'funnel_submissions_30d', (SELECT COUNT(*) FROM public.funnel_submissions WHERE business_id = p_business_id AND created_at > now() - interval '30 days'),
    'notifications_unread', (SELECT COUNT(*) FROM public.notifications WHERE business_id = p_business_id AND user_id = auth.uid() AND is_read = false)
  ) INTO result;

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_lead_stats(p_business_id uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'new', COUNT(*) FILTER (WHERE status = 'new'),
    'contacted', COUNT(*) FILTER (WHERE status = 'contacted'),
    'qualified', COUNT(*) FILTER (WHERE status = 'qualified'),
    'converted', COUNT(*) FILTER (WHERE status = 'converted'),
    'lost', COUNT(*) FILTER (WHERE status = 'lost'),
    'hot', COUNT(*) FILTER (WHERE temperature = 'hot'),
    'avg_score', ROUND(AVG(score), 1),
    'conversion_rate', ROUND(
      COUNT(*) FILTER (WHERE status = 'converted')::numeric / NULLIF(COUNT(*),0) * 100, 1
    )
  ) INTO v_result
  FROM leads
  WHERE business_id = p_business_id
    AND created_at >= now() - (p_days || ' days')::interval;
  RETURN v_result;
END; $function$
;

CREATE OR REPLACE FUNCTION public.get_user_business_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT id FROM public.businesses WHERE owner_id = auth.uid() LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_businesses(p_user_id uuid)
 RETURNS TABLE(business_id uuid, role character varying, business_name text, slug text, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    bu.business_id,
    bu.role,
    b.name,
    b.slug,
    b.status::TEXT
  FROM business_users bu
  JOIN businesses b ON b.id = bu.business_id
  WHERE bu.user_id = p_user_id
    AND bu.status = 'active';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_business_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Set IDs
    IF NEW.created_by IS NULL THEN NEW.created_by := auth.uid(); END IF;
    IF NEW.owner_id IS NULL THEN NEW.owner_id := auth.uid(); END IF;
    IF NEW.user_id IS NULL THEN NEW.user_id := auth.uid(); END IF;
    
    -- Set defaults
    IF NEW.type IS NULL OR NEW.type = '' THEN NEW.type := 'service_provider'; END IF;
    IF NEW.name IS NULL OR NEW.name = '' THEN NEW.name := COALESCE(NEW.business_name, 'Business'); END IF;
    IF NEW.business_name IS NULL THEN NEW.business_name := NEW.name; END IF;
    IF NEW.status IS NULL THEN NEW.status := 'active'::business_status; END IF;
    IF NEW.onboarding_step IS NULL THEN NEW.onboarding_step := 1; END IF;
    
    -- Generate unique slug
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
      NEW.slug := LOWER(
        TRIM(
          REGEXP_REPLACE(
            REGEXP_REPLACE(COALESCE(NEW.business_name, NEW.name, 'business'), '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
          ),
          '-'
        )
      );
      
      IF NEW.slug = '' THEN
        NEW.slug := 'business-' || SUBSTRING(NEW.id::text, 1, 8);
      END IF;
    END IF;
    
    NEW.created_at := NOW();
    NEW.updated_at := NOW();
  
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_business_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Set IDs
  IF NEW.created_by IS NULL THEN NEW.created_by := auth.uid(); END IF;
  IF NEW.owner_id IS NULL THEN NEW.owner_id := auth.uid(); END IF;
  IF NEW.user_id IS NULL THEN NEW.user_id := auth.uid(); END IF;
  
  -- Set defaults
  IF NEW.type IS NULL OR NEW.type = '' THEN NEW.type := 'service_provider'; END IF;
  IF NEW.name IS NULL OR NEW.name = '' THEN NEW.name := COALESCE(NEW.business_name, 'Business'); END IF;
  IF NEW.business_name IS NULL THEN NEW.business_name := NEW.name; END IF;
  IF NEW.status IS NULL THEN NEW.status := 'active'::business_status; END IF;
  IF NEW.onboarding_step IS NULL THEN NEW.onboarding_step := 1; END IF;
  
  -- Generate unique slug
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(COALESCE(NEW.business_name, NEW.name, 'business'), '[^a-zA-Z0-9\s-]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '-'
      )
    );
    
    IF NEW.slug = '' THEN
      NEW.slug := 'business-' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_business_member_on_create()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.business_members (business_id, user_id, role, is_active)
  VALUES (NEW.id, NEW.owner_id, 'owner', true)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_business_members_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_business_upsert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_slug TEXT;
  v_counter INT := 0;
  v_base_slug TEXT;
BEGIN
  -- Set owner IDs from current auth user
  NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  NEW.owner_id   := COALESCE(NEW.owner_id,   auth.uid());
  NEW.user_id    := COALESCE(NEW.user_id,     auth.uid());

  -- Enforce type default
  IF NEW.type IS NULL OR NEW.type = '' THEN
    NEW.type := 'service_provider';
  END IF;

  -- Sync name / business_name
  NEW.business_name := COALESCE(NULLIF(TRIM(NEW.business_name), ''), NULLIF(TRIM(NEW.name), ''), 'My Business');
  NEW.name          := NEW.business_name;

  -- Status default
  NEW.status := COALESCE(NEW.status, 'active'::business_status);

  -- Timestamps
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := NOW();
  END IF;
  NEW.updated_at := NOW();

  -- Auto-generate unique slug on INSERT or if slug is empty
  IF TG_OP = 'INSERT' OR NEW.slug IS NULL OR TRIM(NEW.slug) = '' THEN
    v_base_slug := LOWER(
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(NEW.business_name, '[^a-zA-Z0-9\s-]', '', 'g'),
          '\s+', '-', 'g'
        ), '-'
      )
    );
    IF v_base_slug = '' THEN
      v_base_slug := 'business-' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;
    v_slug := v_base_slug;
    WHILE EXISTS (
      SELECT 1 FROM public.businesses
      WHERE slug = v_slug AND id IS DISTINCT FROM NEW.id
    ) LOOP
      v_counter := v_counter + 1;
      v_slug := v_base_slug || '-' || v_counter;
    END LOOP;
    NEW.slug := v_slug;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_business()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Add owner as business member
  INSERT INTO public.business_members (business_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT DO NOTHING;

  -- Create onboarding record
  INSERT INTO public.onboarding_progress (business_id, current_step, completed_steps)
  VALUES (NEW.id, 1, '[]'::jsonb)
  ON CONFLICT (business_id) DO NOTHING;

  -- Create default pipeline
  WITH pipeline AS (
    INSERT INTO public.pipelines (business_id, name, is_default)
    VALUES (NEW.id, 'Sales Pipeline', true)
    RETURNING id
  )
  INSERT INTO public.pipeline_stages (pipeline_id, business_id, name, position, color, probability)
  SELECT p.id, NEW.id, s.name, s.pos, s.color, s.prob
  FROM pipeline p
  CROSS JOIN (VALUES
    ('New Lead', 0, '#6366f1', 10),
    ('Contacted', 1, '#8b5cf6', 25),
    ('Proposal Sent', 2, '#D4AF37', 50),
    ('Negotiation', 3, '#f59e0b', 75),
    ('Closed Won', 4, '#10B981', 100),
    ('Closed Lost', 5, '#ef4444', 0)
  ) AS s(name, pos, color, prob);

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_business_workspace()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  PERFORM create_default_workspace(NEW.id, NEW.owner_id);
  RETURN NEW;
END; $function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_business_role(_business_id uuid, _user_id uuid, _roles business_role[])
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = _business_id
      and bm.user_id = _user_id
      and bm.is_active = true
      and bm.role = any(_roles)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.has_team_role(_business_id uuid, _roles text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.team_members tm
    where tm.business_id = _business_id
      and tm.user_id = auth.uid()
      and coalesce(tm.is_active, true) = true
      and tm.role = any(_roles)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.increment_usage_metric(p_business_id uuid, p_metric_type character varying, p_increment bigint DEFAULT 1)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO usage_metrics(business_id, metric_type, value, period_start, period_end)
  VALUES (
    p_business_id,
    p_metric_type,
    p_increment,
    date_trunc('month', NOW())::date,
    (date_trunc('month', NOW()) + INTERVAL '1 month - 1 day')::date
  )
  ON CONFLICT (business_id, metric_type, period_start)
  DO UPDATE SET
    value = usage_metrics.value + p_increment,
    updated_at = NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_or_update_business(p_business_data jsonb)
 RETURNS TABLE(id uuid, success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id UUID;
  v_slug TEXT;
  v_counter INT := 0;
  v_base_slug TEXT;
BEGIN
  -- Generate or use provided ID
  v_id := COALESCE((p_business_data->>'id')::UUID, gen_random_uuid());
  
  -- Generate slug from business_name or name
  v_base_slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        COALESCE(p_business_data->>'business_name', p_business_data->>'name', 'business'),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
  
  v_base_slug := TRIM(v_base_slug, '-');
  
  IF v_base_slug = '' OR v_base_slug IS NULL THEN
    v_base_slug := 'business-' || SUBSTRING(v_id::text, 1, 8);
  END IF;
  
  v_slug := v_base_slug;
  v_counter := 0;
  
  -- Ensure unique slug
  WHILE EXISTS(
    SELECT 1 FROM public.businesses 
    WHERE slug = v_slug AND id != v_id
  ) LOOP
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter;
  END LOOP;
  
  -- Try to insert, if conflict exists, update instead
  INSERT INTO public.businesses (
    id,
    business_name,
    name,
    type,
    industry,
    owner_id,
    user_id,
    created_by,
    slug,
    status,
    country,
    currency,
    onboarding_step
  ) VALUES (
    v_id,
    COALESCE(p_business_data->>'business_name', p_business_data->>'name'),
    COALESCE(p_business_data->>'name', p_business_data->>'business_name'),
    COALESCE(p_business_data->>'type', 'service_provider'),
    COALESCE(p_business_data->>'industry', ''),
    COALESCE((p_business_data->>'owner_id')::UUID, auth.uid()),
    COALESCE((p_business_data->>'user_id')::UUID, auth.uid()),
    COALESCE((p_business_data->>'created_by')::UUID, auth.uid()),
    v_slug,
    COALESCE(p_business_data->>'status', 'active')::"business_status",
    p_business_data->>'country',
    p_business_data->>'currency',
    COALESCE((p_business_data->>'onboarding_step')::INT, 2)
  )
  ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    industry = EXCLUDED.industry,
    country = EXCLUDED.country,
    currency = EXCLUDED.currency,
    updated_at = NOW()
  RETURNING public.businesses.id, true, 'Business created successfully'::TEXT INTO id, success, message;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT v_id, false, SQLERRM::TEXT;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_biz_member(bid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses WHERE id = bid AND owner_id = auth.uid()
    UNION ALL
    SELECT 1 FROM public.business_members WHERE business_id = bid AND user_id = auth.uid() AND is_active = true
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_business_member(bid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = bid
    AND user_id = auth.uid()
    AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = bid
    AND owner_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_business_member(_business_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = _business_id
      and bm.user_id = _user_id
      and bm.is_active = true
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_business_owner(_business_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.businesses b
    where b.id = _business_id
      and b.owner_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = auth.uid()
    AND is_active = true
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_team_member(_business_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.team_members tm
    where tm.business_id = _business_id
      and tm.user_id = auth.uid()
      and coalesce(tm.is_active, true) = true
  );
$function$
;

CREATE OR REPLACE FUNCTION public.log_activity(p_business_id uuid, p_action text, p_entity_type text, p_entity_id uuid DEFAULT NULL::uuid, p_entity_name text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.activity_logs (business_id, user_id, action, entity_type, entity_id, entity_name, metadata)
  VALUES (p_business_id, auth.uid(), p_action, p_entity_type, p_entity_id, p_entity_name, p_metadata);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_ai_execution(p_business_id uuid, p_agent_type character varying, p_prompt text, p_output text, p_tokens_used integer DEFAULT 0, p_cost_usd numeric DEFAULT 0, p_execution_time_ms integer DEFAULT 0, p_created_by uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO ai_execution_logs(
    business_id, agent_type, prompt, output,
    tokens_used, cost_usd, execution_time_ms,
    created_by, metadata, status
  ) VALUES (
    p_business_id, p_agent_type, p_prompt, p_output,
    p_tokens_used, p_cost_usd, p_execution_time_ms,
    p_created_by, p_metadata, 'completed'
  ) RETURNING id INTO v_id;

  -- Track token usage
  PERFORM increment_usage_metric(p_business_id, 'ai_tokens_used', p_tokens_used);

  RETURN v_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_audit(p_business_id uuid, p_user_id uuid, p_action character varying, p_resource_type character varying, p_resource_id uuid DEFAULT NULL::uuid, p_changes jsonb DEFAULT NULL::jsonb, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_status character varying DEFAULT 'success'::character varying, p_error_message text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO audit_logs(
    business_id, user_id, action, resource_type, resource_id,
    changes, ip_address, user_agent, status, error_message
  ) VALUES (
    p_business_id, p_user_id, p_action, p_resource_type, p_resource_id,
    p_changes, p_ip_address, p_user_agent, p_status, p_error_message
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_business_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE business_id = p_business_id
  AND user_id = auth.uid()
  AND is_read = false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.recalculate_invoice_total()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE inv_id uuid; tax_r numeric; disc numeric; sub numeric;
BEGIN
  inv_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  SELECT tax_rate, discount INTO tax_r, disc FROM public.client_invoices WHERE id = inv_id;
  SELECT COALESCE(SUM(quantity * unit_price), 0) INTO sub FROM public.invoice_items WHERE invoice_id = inv_id;
  UPDATE public.client_invoices SET
    subtotal   = sub,
    tax_amount = ROUND(sub * COALESCE(tax_r, 0) / 100, 2),
    total      = ROUND(sub + (sub * COALESCE(tax_r, 0) / 100) - COALESCE(disc, 0), 2),
    updated_at = now()
  WHERE id = inv_id;
  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_business_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Set user IDs if not provided
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Set defaults
  IF NEW.type IS NULL OR NEW.type = '' THEN
    NEW.type := 'service_provider';
  END IF;
  
  IF NEW.name IS NULL OR NEW.name = '' THEN
    NEW.name := COALESCE(NEW.business_name, 'New Business');
  END IF;
  
  IF NEW.business_name IS NULL OR NEW.business_name = '' THEN
    NEW.business_name := NEW.name;
  END IF;
  
  IF NEW.status IS NULL THEN
    NEW.status := 'active'::business_status;
  END IF;
  
  IF NEW.onboarding_step IS NULL THEN
    NEW.onboarding_step := 2;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_business_owner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_slug TEXT;
  v_counter INT := 0;
  v_base_slug TEXT;
  v_business_name TEXT;
BEGIN
  -- Set created_by to current user if not provided
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  
  -- Set owner_id to current user if not provided
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  
  -- Set user_id to current user if not provided
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Set type to service_provider if not provided
  IF NEW.type IS NULL OR NEW.type = '' THEN
    NEW.type := 'service_provider';
  END IF;
  
  -- Determine the business name
  v_business_name := COALESCE(NULLIF(TRIM(NEW.business_name), ''), NULLIF(TRIM(NEW.name), ''), 'New Business');
  NEW.business_name := v_business_name;
  NEW.name := v_business_name;
  
  -- Generate slug if not provided
  IF NEW.slug IS NULL OR TRIM(NEW.slug) = '' THEN
    v_base_slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(v_business_name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    );
    
    v_base_slug := TRIM(v_base_slug, '-');
    
    IF v_base_slug = '' OR v_base_slug IS NULL THEN
      v_base_slug := 'business-' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;
    
    v_slug := v_base_slug;
    v_counter := 0;
    
    WHILE EXISTS(
      SELECT 1 FROM public.businesses 
      WHERE slug = v_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) LOOP
      v_counter := v_counter + 1;
      v_slug := v_base_slug || '-' || v_counter;
    END LOOP;
    
    NEW.slug := v_slug;
  END IF;
  
  -- Set status
  IF NEW.status IS NULL THEN
    NEW.status := 'active'::business_status;
  END IF;
  
  -- Set onboarding step
  IF NEW.onboarding_step IS NULL THEN
    NEW.onboarding_step := 2;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_business_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.slug is null or trim(new.slug::text) = '' then
    new.slug := public.generate_unique_business_slug(new.name);
  else
    new.slug := public.slugify(new.slug::text);
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.slugify(input text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$function$
;

CREATE OR REPLACE FUNCTION public.sync_business_users_from_members()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO business_users(business_id, user_id, role, status, created_at, updated_at)
    VALUES (NEW.business_id, NEW.user_id, COALESCE(NEW.role, 'member'), 'active', NOW(), NOW())
    ON CONFLICT (business_id, user_id) DO UPDATE
      SET role = EXCLUDED.role, updated_at = NOW();
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE business_users
    SET role = COALESCE(NEW.role,'member'), updated_at = NOW()
    WHERE business_id = NEW.business_id AND user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE business_users SET status = 'inactive', updated_at = NOW()
    WHERE business_id = OLD.business_id AND user_id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.track_ai_usage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  period_s date := date_trunc('month', now())::date;
  period_e date := (date_trunc('month', now()) + interval '1 month - 1 day')::date;
BEGIN
  INSERT INTO public.usage_quotas (business_id, period_start, period_end, ai_tokens_used)
  VALUES (NEW.business_id, period_s, period_e, COALESCE(NEW.prompt_tokens, 0) + COALESCE(NEW.response_tokens, 0))
  ON CONFLICT (business_id, period_start) DO UPDATE SET
    ai_tokens_used = usage_quotas.ai_tokens_used + EXCLUDED.ai_tokens_used,
    updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_audit_contacts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit(NEW.business_id, NEW.created_by, 'contact.created', 'contacts', NEW.id,
      jsonb_build_object('email', NEW.email, 'name', NEW.first_name || ' ' || NEW.last_name));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit(NEW.business_id, NEW.updated_by, 'contact.updated', 'contacts', NEW.id, NULL);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit(OLD.business_id, NULL, 'contact.deleted', 'contacts', OLD.id, NULL);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_audit_deals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit(NEW.business_id, NEW.created_by, 'deal.created', 'deals', NEW.id,
      jsonb_build_object('title', NEW.title, 'value', NEW.value, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_audit(NEW.business_id, NEW.updated_by, 'deal.status_changed', 'deals', NEW.id,
      jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$
;

CREATE OR REPLACE FUNCTION public.update_client_revenue()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    UPDATE public.clients
    SET total_revenue = COALESCE(total_revenue, 0) + COALESCE(NEW.total, 0)
    WHERE id = NEW.client_id AND business_id = NEW.business_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE conversations SET last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $function$
;

CREATE OR REPLACE FUNCTION public.update_subscriber_list_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE subscriber_lists SET count = count + 1 WHERE id = NEW.list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE subscriber_lists SET count = GREATEST(count - 1, 0) WHERE id = OLD.list_id;
  END IF;
  RETURN NULL;
END; $function$
;

CREATE OR REPLACE FUNCTION public.user_business_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT id FROM public.businesses WHERE owner_id = auth.uid() LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.user_has_business_access(p_business_id uuid, p_user_id uuid, p_min_role character varying DEFAULT 'viewer'::character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM business_users
    WHERE business_id = p_business_id
      AND user_id     = p_user_id
      AND status      = 'active'
      AND CASE p_min_role
            WHEN 'admin'   THEN role = 'admin'
            WHEN 'editor'  THEN role IN ('admin', 'editor', 'manager')
            WHEN 'manager' THEN role IN ('admin', 'editor', 'manager')
            ELSE TRUE
          END
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_is_member(bid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = bid AND user_id = auth.uid() AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = bid AND owner_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.validate_discount_code(p_business_id uuid, p_code text, p_order_total numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_discount discount_codes%ROWTYPE;
  v_discount_amount numeric;
BEGIN
  SELECT * INTO v_discount
  FROM discount_codes
  WHERE business_id = p_business_id
    AND UPPER(code) = UPPER(p_code)
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
    AND (usage_limit IS NULL OR times_used < usage_limit);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired discount code');
  END IF;

  IF v_discount.minimum_order IS NOT NULL AND p_order_total < v_discount.minimum_order THEN
    RETURN jsonb_build_object('valid', false, 'error',
      'Minimum order of ' || v_discount.minimum_order || ' required');
  END IF;

  IF v_discount.type = 'percentage' THEN
    v_discount_amount := p_order_total * (v_discount.value / 100);
    IF v_discount.maximum_discount IS NOT NULL THEN
      v_discount_amount := LEAST(v_discount_amount, v_discount.maximum_discount);
    END IF;
  ELSIF v_discount.type = 'fixed' THEN
    v_discount_amount := LEAST(v_discount.value, p_order_total);
  ELSE
    v_discount_amount := 0;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'discount_id', v_discount.id,
    'type', v_discount.type,
    'value', v_discount.value,
    'discount_amount', v_discount_amount,
    'final_total', p_order_total - v_discount_amount
  );
END; $function$
;

ALTER TABLE public.ab_tests ADD CONSTRAINT ab_tests_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.ab_tests ADD CONSTRAINT ab_tests_entity_type_check CHECK ((entity_type = ANY (ARRAY['funnel_step'::text, 'email'::text, 'campaign'::text, 'landing_page'::text, 'email_subject'::text])));

ALTER TABLE public.ab_tests ADD CONSTRAINT ab_tests_pkey PRIMARY KEY (id);

ALTER TABLE public.ab_tests ADD CONSTRAINT ab_tests_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'running'::text, 'completed'::text, 'stopped'::text])));

ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);

ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.ai_content ADD CONSTRAINT ai_content_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.ai_content ADD CONSTRAINT ai_content_category_check CHECK ((category = ANY (ARRAY['copy'::text, 'social_media'::text, 'email'::text, 'blog'::text, 'seo'::text, 'branding'::text, 'strategy'::text, 'ads'::text, 'product'::text, 'general'::text, 'website'::text, 'whatsapp'::text])));

ALTER TABLE public.ai_content ADD CONSTRAINT ai_content_pkey PRIMARY KEY (id);

ALTER TABLE public.ai_content ADD CONSTRAINT ai_content_rating_check CHECK (((rating >= 1) AND (rating <= 5)));

ALTER TABLE public.ai_content ADD CONSTRAINT ai_content_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.ai_execution_logs ADD CONSTRAINT ai_execution_logs_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);

ALTER TABLE public.ai_execution_logs ADD CONSTRAINT ai_execution_logs_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.ai_execution_logs ADD CONSTRAINT ai_execution_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.ai_execution_logs ADD CONSTRAINT ai_execution_logs_pkey PRIMARY KEY (id);

ALTER TABLE public.ai_logs ADD CONSTRAINT ai_logs_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.ai_logs ADD CONSTRAINT ai_logs_pkey PRIMARY KEY (id);

ALTER TABLE public.ai_logs ADD CONSTRAINT ai_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.ai_memory ADD CONSTRAINT ai_memory_business_id_category_key_key UNIQUE (business_id, category, key);

ALTER TABLE public.ai_memory ADD CONSTRAINT ai_memory_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.ai_memory ADD CONSTRAINT ai_memory_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.ai_memory ADD CONSTRAINT ai_memory_pkey PRIMARY KEY (id);

ALTER TABLE public.ai_tool_configs ADD CONSTRAINT ai_tool_configs_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.ai_tool_configs ADD CONSTRAINT ai_tool_configs_business_id_tool_key_key UNIQUE (business_id, tool_key);

ALTER TABLE public.ai_tool_configs ADD CONSTRAINT ai_tool_configs_pkey PRIMARY KEY (id);

ALTER TABLE public.analytics_daily ADD CONSTRAINT analytics_daily_business_id_date_entity_type_entity_id_key UNIQUE (business_id, date, entity_type, entity_id);

ALTER TABLE public.analytics_daily ADD CONSTRAINT analytics_daily_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.analytics_daily ADD CONSTRAINT analytics_daily_pkey PRIMARY KEY (id);

ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);

ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_key_hash_key UNIQUE (key_hash);

ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);

ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.api_rate_limits ADD CONSTRAINT api_rate_limits_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.api_rate_limits ADD CONSTRAINT api_rate_limits_business_id_window_start_endpoint_key UNIQUE (business_id, window_start, endpoint);

ALTER TABLE public.api_rate_limits ADD CONSTRAINT api_rate_limits_pkey PRIMARY KEY (id);

ALTER TABLE public.appointments ADD CONSTRAINT appointments_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.appointments ADD CONSTRAINT appointments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE public.appointments ADD CONSTRAINT appointments_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

ALTER TABLE public.appointments ADD CONSTRAINT appointments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

ALTER TABLE public.appointments ADD CONSTRAINT appointments_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id);

ALTER TABLE public.appointments ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);

ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text, 'rescheduled'::text])));

ALTER TABLE public.appointments ADD CONSTRAINT appointments_type_check CHECK ((type = ANY (ARRAY['meeting'::text, 'call'::text, 'demo'::text, 'follow_up'::text, 'consultation'::text, 'other'::text])));

ALTER TABLE public.appointments ADD CONSTRAINT valid_appointment_times CHECK ((end_time > start_time));

ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);

ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.business_addons ADD CONSTRAINT business_addons_addon_id_fkey FOREIGN KEY (addon_id) REFERENCES plan_addons(id) ON DELETE CASCADE;

ALTER TABLE public.business_addons ADD CONSTRAINT business_addons_business_id_addon_id_key UNIQUE (business_id, addon_id);

ALTER TABLE public.business_addons ADD CONSTRAINT business_addons_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.business_addons ADD CONSTRAINT business_addons_pkey PRIMARY KEY (id);

ALTER TABLE public.business_addons ADD CONSTRAINT business_addons_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text])));

ALTER TABLE public.business_addons ADD CONSTRAINT business_addons_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id);

ALTER TABLE public.business_members ADD CONSTRAINT business_members_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.business_members ADD CONSTRAINT business_members_business_id_user_id_key UNIQUE (business_id, user_id);

ALTER TABLE public.business_members ADD CONSTRAINT business_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.business_members ADD CONSTRAINT business_members_pkey PRIMARY KEY (id);

ALTER TABLE public.business_members ADD CONSTRAINT business_members_user_business_unique UNIQUE (user_id, business_id);

ALTER TABLE public.business_members ADD CONSTRAINT business_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.business_settings ADD CONSTRAINT business_settings_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.business_settings ADD CONSTRAINT business_settings_business_id_key_key UNIQUE (business_id, key);

ALTER TABLE public.business_settings ADD CONSTRAINT business_settings_pkey PRIMARY KEY (id);

ALTER TABLE public.business_users ADD CONSTRAINT business_users_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.business_users ADD CONSTRAINT business_users_business_id_user_id_key UNIQUE (business_id, user_id);

ALTER TABLE public.business_users ADD CONSTRAINT business_users_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id);

ALTER TABLE public.business_users ADD CONSTRAINT business_users_pkey PRIMARY KEY (id);

ALTER TABLE public.business_users ADD CONSTRAINT business_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.businesses ADD CONSTRAINT businesses_created_by_unique UNIQUE (created_by);

ALTER TABLE public.businesses ADD CONSTRAINT businesses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.businesses ADD CONSTRAINT businesses_owner_id_unique UNIQUE (owner_id);

ALTER TABLE public.businesses ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);

ALTER TABLE public.businesses ADD CONSTRAINT businesses_slug_unique UNIQUE (slug);

ALTER TABLE public.businesses ADD CONSTRAINT businesses_type_check CHECK ((type = ANY (ARRAY['service_provider'::text, 'agency'::text, 'ecommerce'::text, 'creator'::text, 'consultant'::text, 'freelancer'::text])));

ALTER TABLE public.businesses ADD CONSTRAINT businesses_user_id_unique UNIQUE (user_id);

ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);

ALTER TABLE public.client_invoices ADD CONSTRAINT client_invoices_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.client_invoices ADD CONSTRAINT client_invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE public.client_invoices ADD CONSTRAINT client_invoices_pkey PRIMARY KEY (id);

ALTER TABLE public.client_invoices ADD CONSTRAINT client_invoices_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE public.clients ADD CONSTRAINT clients_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.clients ADD CONSTRAINT clients_pkey PRIMARY KEY (id);

ALTER TABLE public.clients ADD CONSTRAINT clients_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text])));

ALTER TABLE public.clips ADD CONSTRAINT clips_pkey PRIMARY KEY (id);

ALTER TABLE public.clips ADD CONSTRAINT clips_video_id_fkey FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;

ALTER TABLE public.components ADD CONSTRAINT components_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.components ADD CONSTRAINT components_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.components ADD CONSTRAINT components_pkey PRIMARY KEY (id);

ALTER TABLE public.contact_tags ADD CONSTRAINT contact_tags_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE public.contact_tags ADD CONSTRAINT contact_tags_pkey PRIMARY KEY (contact_id, tag_id);

ALTER TABLE public.contact_tags ADD CONSTRAINT contact_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;

ALTER TABLE public.contacts ADD CONSTRAINT contacts_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.contacts ADD CONSTRAINT contacts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.contacts ADD CONSTRAINT contacts_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.contacts ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);

ALTER TABLE public.contacts ADD CONSTRAINT contacts_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);

ALTER TABLE public.content_calendar ADD CONSTRAINT content_calendar_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.content_calendar ADD CONSTRAINT content_calendar_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id);

ALTER TABLE public.content_calendar ADD CONSTRAINT content_calendar_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.content_calendar ADD CONSTRAINT content_calendar_pkey PRIMARY KEY (id);

ALTER TABLE public.content_calendar ADD CONSTRAINT content_calendar_post_id_fkey FOREIGN KEY (post_id) REFERENCES social_posts(id);

ALTER TABLE public.content_calendar ADD CONSTRAINT content_calendar_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'scheduled'::text, 'published'::text, 'cancelled'::text, 'failed'::text])));

ALTER TABLE public.conversation_participants ADD CONSTRAINT conversation_participants_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.conversation_participants ADD CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE public.conversation_participants ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (conversation_id, user_id);

ALTER TABLE public.conversation_participants ADD CONSTRAINT conversation_participants_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text])));

ALTER TABLE public.conversation_participants ADD CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.conversations ADD CONSTRAINT conversations_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.conversations ADD CONSTRAINT conversations_context_type_check CHECK ((context_type = ANY (ARRAY['deal'::text, 'contact'::text, 'project'::text, 'order'::text, 'support_ticket'::text])));

ALTER TABLE public.conversations ADD CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.conversations ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);

ALTER TABLE public.conversations ADD CONSTRAINT conversations_type_check CHECK ((type = ANY (ARRAY['direct'::text, 'group'::text, 'channel'::text, 'deal_thread'::text, 'support_thread'::text])));

ALTER TABLE public.crm_activities ADD CONSTRAINT crm_activities_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.crm_activities ADD CONSTRAINT crm_activities_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE public.crm_activities ADD CONSTRAINT crm_activities_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

ALTER TABLE public.crm_activities ADD CONSTRAINT crm_activities_pkey PRIMARY KEY (id);

ALTER TABLE public.crm_activities ADD CONSTRAINT crm_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.crm_notes ADD CONSTRAINT crm_notes_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.crm_notes ADD CONSTRAINT crm_notes_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE public.crm_notes ADD CONSTRAINT crm_notes_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE;

ALTER TABLE public.crm_notes ADD CONSTRAINT crm_notes_pkey PRIMARY KEY (id);

ALTER TABLE public.crm_notes ADD CONSTRAINT crm_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.cron_job_logs ADD CONSTRAINT cron_job_logs_pkey PRIMARY KEY (id);

ALTER TABLE public.cron_job_logs ADD CONSTRAINT cron_job_logs_status_check CHECK ((status = ANY (ARRAY['started'::text, 'completed'::text, 'failed'::text, 'skipped'::text])));

ALTER TABLE public.custom_domains ADD CONSTRAINT custom_domains_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.custom_domains ADD CONSTRAINT custom_domains_domain_key UNIQUE (domain);

ALTER TABLE public.custom_domains ADD CONSTRAINT custom_domains_funnel_id_fkey FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE SET NULL;

ALTER TABLE public.custom_domains ADD CONSTRAINT custom_domains_pkey PRIMARY KEY (id);

ALTER TABLE public.custom_domains ADD CONSTRAINT custom_domains_website_id_fkey FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE SET NULL;

ALTER TABLE public.deal_tags ADD CONSTRAINT deal_tags_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE;

ALTER TABLE public.deal_tags ADD CONSTRAINT deal_tags_pkey PRIMARY KEY (deal_id, tag_id);

ALTER TABLE public.deal_tags ADD CONSTRAINT deal_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;

ALTER TABLE public.deals ADD CONSTRAINT deals_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.deals ADD CONSTRAINT deals_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE public.deals ADD CONSTRAINT deals_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.deals ADD CONSTRAINT deals_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.deals ADD CONSTRAINT deals_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE;

ALTER TABLE public.deals ADD CONSTRAINT deals_pkey PRIMARY KEY (id);

ALTER TABLE public.deals ADD CONSTRAINT deals_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES pipeline_stages(id) ON DELETE SET NULL;

ALTER TABLE public.deals ADD CONSTRAINT deals_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);

ALTER TABLE public.discount_codes ADD CONSTRAINT discount_codes_applies_to_check CHECK ((applies_to = ANY (ARRAY['all'::text, 'specific_products'::text, 'specific_categories'::text])));

ALTER TABLE public.discount_codes ADD CONSTRAINT discount_codes_business_id_code_key UNIQUE (business_id, code);

ALTER TABLE public.discount_codes ADD CONSTRAINT discount_codes_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.discount_codes ADD CONSTRAINT discount_codes_pkey PRIMARY KEY (id);

ALTER TABLE public.discount_codes ADD CONSTRAINT discount_codes_type_check CHECK ((type = ANY (ARRAY['percentage'::text, 'fixed'::text, 'free_shipping'::text, 'buy_x_get_y'::text])));

ALTER TABLE public.discount_codes ADD CONSTRAINT discount_codes_value_check CHECK ((value >= (0)::numeric));

ALTER TABLE public.email_logs ADD CONSTRAINT email_logs_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.email_logs ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);

ALTER TABLE public.email_sequence_steps ADD CONSTRAINT email_sequence_steps_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.email_sequence_steps ADD CONSTRAINT email_sequence_steps_delay_days_check CHECK ((delay_days >= 0));

ALTER TABLE public.email_sequence_steps ADD CONSTRAINT email_sequence_steps_delay_hours_check CHECK (((delay_hours >= 0) AND (delay_hours <= 23)));

ALTER TABLE public.email_sequence_steps ADD CONSTRAINT email_sequence_steps_pkey PRIMARY KEY (id);

ALTER TABLE public.email_sequence_steps ADD CONSTRAINT email_sequence_steps_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE CASCADE;

ALTER TABLE public.email_sequence_steps ADD CONSTRAINT email_sequence_steps_sequence_id_position_key UNIQUE (sequence_id, "position");

ALTER TABLE public.email_sequences ADD CONSTRAINT email_sequences_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.email_sequences ADD CONSTRAINT email_sequences_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id);

ALTER TABLE public.email_sequences ADD CONSTRAINT email_sequences_pkey PRIMARY KEY (id);

ALTER TABLE public.email_sequences ADD CONSTRAINT email_sequences_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'archived'::text])));

ALTER TABLE public.email_sequences ADD CONSTRAINT email_sequences_trigger_type_check CHECK ((trigger_type = ANY (ARRAY['manual'::text, 'contact_created'::text, 'tag_added'::text, 'form_submitted'::text, 'deal_stage_changed'::text, 'appointment_booked'::text, 'purchase_completed'::text, 'lead_converted'::text, 'list_added'::text, 'workflow_trigger'::text])));

ALTER TABLE public.email_templates ADD CONSTRAINT email_templates_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.email_templates ADD CONSTRAINT email_templates_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.email_templates ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);

ALTER TABLE public.email_unsubscribes ADD CONSTRAINT email_unsubscribes_business_id_email_key UNIQUE (business_id, email);

ALTER TABLE public.email_unsubscribes ADD CONSTRAINT email_unsubscribes_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.email_unsubscribes ADD CONSTRAINT email_unsubscribes_pkey PRIMARY KEY (id);

ALTER TABLE public.events ADD CONSTRAINT events_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.events ADD CONSTRAINT events_pkey PRIMARY KEY (id);

ALTER TABLE public.events ADD CONSTRAINT events_website_id_fkey FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE SET NULL;

ALTER TABLE public.feature_flags ADD CONSTRAINT feature_flags_key_key UNIQUE (key);

ALTER TABLE public.feature_flags ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);

ALTER TABLE public.feature_flags ADD CONSTRAINT feature_flags_rollout_percentage_check CHECK (((rollout_percentage >= 0) AND (rollout_percentage <= 100)));

ALTER TABLE public.form_responses ADD CONSTRAINT form_responses_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.form_responses ADD CONSTRAINT form_responses_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id);

ALTER TABLE public.form_responses ADD CONSTRAINT form_responses_form_id_fkey FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE;

ALTER TABLE public.form_responses ADD CONSTRAINT form_responses_pkey PRIMARY KEY (id);

ALTER TABLE public.forms ADD CONSTRAINT forms_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.forms ADD CONSTRAINT forms_pkey PRIMARY KEY (id);

ALTER TABLE public.forms ADD CONSTRAINT forms_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text])));

ALTER TABLE public.funnel_steps ADD CONSTRAINT funnel_steps_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.funnel_steps ADD CONSTRAINT funnel_steps_funnel_id_fkey FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE;

ALTER TABLE public.funnel_steps ADD CONSTRAINT funnel_steps_pkey PRIMARY KEY (id);

ALTER TABLE public.funnel_submissions ADD CONSTRAINT funnel_submissions_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.funnel_submissions ADD CONSTRAINT funnel_submissions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id);

ALTER TABLE public.funnel_submissions ADD CONSTRAINT funnel_submissions_funnel_id_fkey FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE;

ALTER TABLE public.funnel_submissions ADD CONSTRAINT funnel_submissions_pkey PRIMARY KEY (id);

ALTER TABLE public.funnel_submissions ADD CONSTRAINT funnel_submissions_step_id_fkey FOREIGN KEY (step_id) REFERENCES funnel_steps(id);

ALTER TABLE public.funnels ADD CONSTRAINT funnels_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.funnels ADD CONSTRAINT funnels_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.funnels ADD CONSTRAINT funnels_pkey PRIMARY KEY (id);

ALTER TABLE public.integrations ADD CONSTRAINT integrations_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.integrations ADD CONSTRAINT integrations_business_id_provider_type_key UNIQUE (business_id, provider, type);

ALTER TABLE public.integrations ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);

ALTER TABLE public.interactions ADD CONSTRAINT interactions_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.interactions ADD CONSTRAINT interactions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE public.interactions ADD CONSTRAINT interactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.interactions ADD CONSTRAINT interactions_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

ALTER TABLE public.interactions ADD CONSTRAINT interactions_pkey PRIMARY KEY (id);

ALTER TABLE public.invitations ADD CONSTRAINT invitations_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.invitations ADD CONSTRAINT invitations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.invitations ADD CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id);

ALTER TABLE public.invitations ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);

ALTER TABLE public.invitations ADD CONSTRAINT invitations_redeemed_by_fkey FOREIGN KEY (redeemed_by) REFERENCES auth.users(id);

ALTER TABLE public.invitations ADD CONSTRAINT invitations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text, 'cancelled'::text])));

ALTER TABLE public.invitations ADD CONSTRAINT invitations_token_key UNIQUE (token);

ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES client_invoices(id) ON DELETE CASCADE;

ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);

ALTER TABLE public.invoices ADD CONSTRAINT invoices_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.invoices ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);

ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text])));

ALTER TABLE public.invoices ADD CONSTRAINT invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

ALTER TABLE public.knowledge_base ADD CONSTRAINT knowledge_base_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id);

ALTER TABLE public.knowledge_base ADD CONSTRAINT knowledge_base_pkey PRIMARY KEY (id);

ALTER TABLE public.knowledge_base ADD CONSTRAINT knowledge_base_slug_key UNIQUE (slug);

ALTER TABLE public.leads ADD CONSTRAINT leads_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.leads ADD CONSTRAINT leads_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE public.leads ADD CONSTRAINT leads_form_id_fkey FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL;

ALTER TABLE public.leads ADD CONSTRAINT leads_funnel_id_fkey FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE SET NULL;

ALTER TABLE public.leads ADD CONSTRAINT leads_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id);

ALTER TABLE public.leads ADD CONSTRAINT leads_pkey PRIMARY KEY (id);

ALTER TABLE public.leads ADD CONSTRAINT leads_score_check CHECK (((score >= 0) AND (score <= 100)));

ALTER TABLE public.leads ADD CONSTRAINT leads_status_check CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'unqualified'::text, 'converted'::text, 'lost'::text])));

ALTER TABLE public.leads ADD CONSTRAINT leads_temperature_check CHECK ((temperature = ANY (ARRAY['hot'::text, 'warm'::text, 'cold'::text])));

ALTER TABLE public.list_contacts ADD CONSTRAINT list_contacts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE public.list_contacts ADD CONSTRAINT list_contacts_list_id_fkey FOREIGN KEY (list_id) REFERENCES subscriber_lists(id) ON DELETE CASCADE;

ALTER TABLE public.list_contacts ADD CONSTRAINT list_contacts_pkey PRIMARY KEY (list_id, contact_id);

ALTER TABLE public.list_contacts ADD CONSTRAINT list_contacts_status_check CHECK ((status = ANY (ARRAY['subscribed'::text, 'unsubscribed'::text, 'bounced'::text, 'complained'::text, 'pending'::text])));

ALTER TABLE public.marketplace_listings ADD CONSTRAINT marketplace_listings_pkey PRIMARY KEY (id);

ALTER TABLE public.marketplace_listings ADD CONSTRAINT marketplace_listings_price_type_check CHECK ((price_type = ANY (ARRAY['fixed'::text, 'starting_from'::text, 'custom'::text, 'free'::text])));

ALTER TABLE public.marketplace_listings ADD CONSTRAINT marketplace_listings_slug_key UNIQUE (slug);

ALTER TABLE public.marketplace_listings ADD CONSTRAINT marketplace_listings_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'draft'::text, 'archived'::text])));

ALTER TABLE public.marketplace_orders ADD CONSTRAINT marketplace_orders_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.marketplace_orders ADD CONSTRAINT marketplace_orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id);

ALTER TABLE public.marketplace_orders ADD CONSTRAINT marketplace_orders_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id);

ALTER TABLE public.marketplace_orders ADD CONSTRAINT marketplace_orders_order_number_key UNIQUE (order_number);

ALTER TABLE public.marketplace_orders ADD CONSTRAINT marketplace_orders_pkey PRIMARY KEY (id);

ALTER TABLE public.marketplace_orders ADD CONSTRAINT marketplace_orders_rating_check CHECK (((rating >= 1) AND (rating <= 5)));

ALTER TABLE public.marketplace_orders ADD CONSTRAINT marketplace_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'in_progress'::text, 'revision_requested'::text, 'delivered'::text, 'completed'::text, 'cancelled'::text, 'refunded'::text, 'disputed'::text])));

ALTER TABLE public.media ADD CONSTRAINT media_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.media ADD CONSTRAINT media_pkey PRIMARY KEY (id);

ALTER TABLE public.media ADD CONSTRAINT media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);

ALTER TABLE public.messages ADD CONSTRAINT messages_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.messages ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);

ALTER TABLE public.messages ADD CONSTRAINT messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL;

ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id);

ALTER TABLE public.messages ADD CONSTRAINT messages_type_check CHECK ((type = ANY (ARRAY['text'::text, 'image'::text, 'file'::text, 'system'::text, 'mention'::text])));

ALTER TABLE public.notifications ADD CONSTRAINT notifications_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.onboarding_progress ADD CONSTRAINT onboarding_progress_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.onboarding_progress ADD CONSTRAINT onboarding_progress_business_id_key UNIQUE (business_id);

ALTER TABLE public.onboarding_progress ADD CONSTRAINT onboarding_progress_pkey PRIMARY KEY (id);

ALTER TABLE public.order_messages ADD CONSTRAINT order_messages_order_id_fkey FOREIGN KEY (order_id) REFERENCES marketplace_orders(id) ON DELETE CASCADE;

ALTER TABLE public.order_messages ADD CONSTRAINT order_messages_pkey PRIMARY KEY (id);

ALTER TABLE public.order_messages ADD CONSTRAINT order_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id);

ALTER TABLE public.organizations ADD CONSTRAINT organizations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.organizations ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);

ALTER TABLE public.organizations ADD CONSTRAINT organizations_slug_key UNIQUE (slug);

ALTER TABLE public.page_versions ADD CONSTRAINT page_versions_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.page_versions ADD CONSTRAINT page_versions_page_id_fkey FOREIGN KEY (page_id) REFERENCES web_pages(id) ON DELETE CASCADE;

ALTER TABLE public.page_versions ADD CONSTRAINT page_versions_pkey PRIMARY KEY (id);

ALTER TABLE public.page_versions ADD CONSTRAINT page_versions_saved_by_fkey FOREIGN KEY (saved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.pages ADD CONSTRAINT pages_pkey PRIMARY KEY (id);

ALTER TABLE public.pages ADD CONSTRAINT pages_site_id_fkey FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE;

ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);

ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_provider_check CHECK ((provider = ANY (ARRAY['paystack'::text, 'flutterwave'::text, 'paypal'::text, 'bank_transfer'::text, 'stripe'::text, 'manual'::text])));

ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_reference_key UNIQUE (reference);

ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'success'::text, 'failed'::text, 'cancelled'::text, 'refunded'::text, 'reversed'::text])));

ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_type_check CHECK ((type = ANY (ARRAY['subscription'::text, 'one_time'::text, 'invoice'::text, 'order'::text, 'refund'::text, 'payout'::text, 'topup'::text])));

ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.payout_requests ADD CONSTRAINT payout_requests_pkey PRIMARY KEY (id);

ALTER TABLE public.payout_requests ADD CONSTRAINT payout_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES auth.users(id);

ALTER TABLE public.payout_requests ADD CONSTRAINT payout_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'paid'::text, 'rejected'::text])));

ALTER TABLE public.payout_requests ADD CONSTRAINT payout_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.permission_roles ADD CONSTRAINT permission_roles_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.permission_roles ADD CONSTRAINT permission_roles_pkey PRIMARY KEY (id);

ALTER TABLE public.pipeline_stages ADD CONSTRAINT pipeline_stages_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.pipeline_stages ADD CONSTRAINT pipeline_stages_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE;

ALTER TABLE public.pipeline_stages ADD CONSTRAINT pipeline_stages_pkey PRIMARY KEY (id);

ALTER TABLE public.pipeline_stages ADD CONSTRAINT pipeline_stages_probability_check CHECK (((probability >= 0) AND (probability <= 100)));

ALTER TABLE public.pipelines ADD CONSTRAINT pipelines_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.pipelines ADD CONSTRAINT pipelines_pkey PRIMARY KEY (id);

ALTER TABLE public.plan_addons ADD CONSTRAINT plan_addons_interval_check CHECK (("interval" = ANY (ARRAY['monthly'::text, 'yearly'::text, 'one_time'::text])));

ALTER TABLE public.plan_addons ADD CONSTRAINT plan_addons_key_key UNIQUE (key);

ALTER TABLE public.plan_addons ADD CONSTRAINT plan_addons_pkey PRIMARY KEY (id);

ALTER TABLE public.plan_limits ADD CONSTRAINT plan_limits_pkey PRIMARY KEY (id);

ALTER TABLE public.plan_limits ADD CONSTRAINT plan_limits_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

ALTER TABLE public.plans ADD CONSTRAINT plans_code_key UNIQUE (code);

ALTER TABLE public.plans ADD CONSTRAINT plans_interval_check CHECK (("interval" = ANY (ARRAY['monthly'::text, 'yearly'::text, 'one_time'::text])));

ALTER TABLE public.plans ADD CONSTRAINT plans_name_key UNIQUE (name);

ALTER TABLE public.plans ADD CONSTRAINT plans_pkey PRIMARY KEY (id);

ALTER TABLE public.platform_admins ADD CONSTRAINT platform_admins_level_check CHECK ((level = ANY (ARRAY['admin'::text, 'super_admin'::text, 'support'::text, 'finance'::text])));

ALTER TABLE public.platform_admins ADD CONSTRAINT platform_admins_pkey PRIMARY KEY (id);

ALTER TABLE public.platform_admins ADD CONSTRAINT platform_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.platform_admins ADD CONSTRAINT platform_admins_user_id_key UNIQUE (user_id);

ALTER TABLE public.platform_audit_log ADD CONSTRAINT platform_audit_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id);

ALTER TABLE public.platform_audit_log ADD CONSTRAINT platform_audit_log_pkey PRIMARY KEY (id);

ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_key_key UNIQUE (key);

ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);

ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);

ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);

ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE public.products ADD CONSTRAINT products_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.products ADD CONSTRAINT products_business_id_slug_key UNIQUE (business_id, slug);

ALTER TABLE public.products ADD CONSTRAINT products_compare_price_check CHECK ((compare_price >= (0)::numeric));

ALTER TABLE public.products ADD CONSTRAINT products_cost_price_check CHECK ((cost_price >= (0)::numeric));

ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);

ALTER TABLE public.products ADD CONSTRAINT products_price_check CHECK ((price >= (0)::numeric));

ALTER TABLE public.products ADD CONSTRAINT products_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'out_of_stock'::text, 'archived'::text])));

ALTER TABLE public.products ADD CONSTRAINT products_type_check CHECK ((type = ANY (ARRAY['physical'::text, 'digital'::text, 'service'::text, 'subscription'::text, 'course'::text])));

ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text, 'team_member'::text])));

ALTER TABLE public.projects ADD CONSTRAINT projects_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);

ALTER TABLE public.projects ADD CONSTRAINT projects_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.projects ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE public.projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

ALTER TABLE public.projects ADD CONSTRAINT projects_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])));

ALTER TABLE public.projects ADD CONSTRAINT projects_progress_check CHECK (((progress >= 0) AND (progress <= 100)));

ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['planning'::text, 'active'::text, 'on_hold'::text, 'completed'::text, 'cancelled'::text])));

ALTER TABLE public.rate_limits ADD CONSTRAINT rate_limits_business_id_endpoint_window_start_key UNIQUE (business_id, endpoint, window_start);

ALTER TABLE public.rate_limits ADD CONSTRAINT rate_limits_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.rate_limits ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id);

ALTER TABLE public.referral_clicks ADD CONSTRAINT referral_clicks_pkey PRIMARY KEY (id);

ALTER TABLE public.referral_clicks ADD CONSTRAINT referral_clicks_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE;

ALTER TABLE public.referral_commissions ADD CONSTRAINT referral_commissions_order_id_fkey FOREIGN KEY (order_id) REFERENCES marketplace_orders(id);

ALTER TABLE public.referral_commissions ADD CONSTRAINT referral_commissions_pkey PRIMARY KEY (id);

ALTER TABLE public.referral_commissions ADD CONSTRAINT referral_commissions_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE;

ALTER TABLE public.referral_commissions ADD CONSTRAINT referral_commissions_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id);

ALTER TABLE public.referral_commissions ADD CONSTRAINT referral_commissions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'paid'::text, 'cancelled'::text])));

ALTER TABLE public.referral_commissions ADD CONSTRAINT referral_commissions_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id);

ALTER TABLE public.referral_programs ADD CONSTRAINT referral_programs_commission_type_check CHECK ((commission_type = ANY (ARRAY['percentage'::text, 'fixed'::text])));

ALTER TABLE public.referral_programs ADD CONSTRAINT referral_programs_pkey PRIMARY KEY (id);

ALTER TABLE public.referrals ADD CONSTRAINT referrals_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id);

ALTER TABLE public.referrals ADD CONSTRAINT referrals_code_key UNIQUE (code);

ALTER TABLE public.referrals ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);

ALTER TABLE public.referrals ADD CONSTRAINT referrals_program_id_fkey FOREIGN KEY (program_id) REFERENCES referral_programs(id);

ALTER TABLE public.referrals ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES auth.users(id);

ALTER TABLE public.referrals ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id);

ALTER TABLE public.referrals ADD CONSTRAINT referrals_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'banned'::text])));

ALTER TABLE public.sections ADD CONSTRAINT sections_page_id_fkey FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

ALTER TABLE public.sections ADD CONSTRAINT sections_pkey PRIMARY KEY (id);

ALTER TABLE public.sequence_enrollments ADD CONSTRAINT sequence_enrollments_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.sequence_enrollments ADD CONSTRAINT sequence_enrollments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE public.sequence_enrollments ADD CONSTRAINT sequence_enrollments_pkey PRIMARY KEY (id);

ALTER TABLE public.sequence_enrollments ADD CONSTRAINT sequence_enrollments_sequence_id_contact_id_key UNIQUE (sequence_id, contact_id);

ALTER TABLE public.sequence_enrollments ADD CONSTRAINT sequence_enrollments_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE CASCADE;

ALTER TABLE public.sequence_enrollments ADD CONSTRAINT sequence_enrollments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'unsubscribed'::text, 'bounced'::text, 'failed'::text])));

ALTER TABLE public.services ADD CONSTRAINT services_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.services ADD CONSTRAINT services_pkey PRIMARY KEY (id);

ALTER TABLE public.sites ADD CONSTRAINT sites_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.sites ADD CONSTRAINT sites_pkey PRIMARY KEY (id);

ALTER TABLE public.social_accounts ADD CONSTRAINT social_accounts_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.social_accounts ADD CONSTRAINT social_accounts_pkey PRIMARY KEY (id);

ALTER TABLE public.social_posts ADD CONSTRAINT social_posts_account_id_fkey FOREIGN KEY (account_id) REFERENCES social_accounts(id) ON DELETE SET NULL;

ALTER TABLE public.social_posts ADD CONSTRAINT social_posts_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.social_posts ADD CONSTRAINT social_posts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.social_posts ADD CONSTRAINT social_posts_pkey PRIMARY KEY (id);

ALTER TABLE public.subscriber_lists ADD CONSTRAINT subscriber_lists_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.subscriber_lists ADD CONSTRAINT subscriber_lists_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id);

ALTER TABLE public.subscriber_lists ADD CONSTRAINT subscriber_lists_pkey PRIMARY KEY (id);

ALTER TABLE public.subscriber_lists ADD CONSTRAINT subscriber_lists_type_check CHECK ((type = ANY (ARRAY['manual'::text, 'dynamic'::text, 'import'::text, 'segment'::text])));

ALTER TABLE public.subscription_plans ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);

ALTER TABLE public.subscription_plans ADD CONSTRAINT subscription_plans_slug_key UNIQUE (slug);

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id);

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_provider_check CHECK ((provider = ANY (ARRAY['paystack'::text, 'flutterwave'::text])));

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'cancelled'::text, 'past_due'::text, 'trialing'::text])));

ALTER TABLE public.support_ticket_messages ADD CONSTRAINT support_ticket_messages_pkey PRIMARY KEY (id);

ALTER TABLE public.support_ticket_messages ADD CONSTRAINT support_ticket_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.support_ticket_messages ADD CONSTRAINT support_ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE;

ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);

ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])));

ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])));

ALTER TABLE public.tags ADD CONSTRAINT tags_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.tags ADD CONSTRAINT tags_business_id_name_key UNIQUE (business_id, name);

ALTER TABLE public.tags ADD CONSTRAINT tags_pkey PRIMARY KEY (id);

ALTER TABLE public.tasks ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id);

ALTER TABLE public.tasks ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);

ALTER TABLE public.tasks ADD CONSTRAINT tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])));

ALTER TABLE public.tasks ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check CHECK ((status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])));

ALTER TABLE public.team_members ADD CONSTRAINT team_members_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.team_members ADD CONSTRAINT team_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.team_members ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);

ALTER TABLE public.team_members ADD CONSTRAINT team_members_user_business_unique UNIQUE (user_id, business_id);

ALTER TABLE public.team_members ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.templates ADD CONSTRAINT templates_pkey PRIMARY KEY (id);

ALTER TABLE public.transactions ADD CONSTRAINT transactions_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);

ALTER TABLE public.transactions ADD CONSTRAINT transactions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

ALTER TABLE public.transcripts ADD CONSTRAINT transcripts_pkey PRIMARY KEY (id);

ALTER TABLE public.transcripts ADD CONSTRAINT transcripts_video_id_fkey FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;

ALTER TABLE public.usage_metrics ADD CONSTRAINT usage_metrics_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.usage_metrics ADD CONSTRAINT usage_metrics_business_id_metric_type_period_start_key UNIQUE (business_id, metric_type, period_start);

ALTER TABLE public.usage_metrics ADD CONSTRAINT usage_metrics_pkey PRIMARY KEY (id);

ALTER TABLE public.usage_quotas ADD CONSTRAINT usage_quotas_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.usage_quotas ADD CONSTRAINT usage_quotas_business_id_period_start_key UNIQUE (business_id, period_start);

ALTER TABLE public.usage_quotas ADD CONSTRAINT usage_quotas_pkey PRIMARY KEY (id);

ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);

ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

ALTER TABLE public.user_role_assignments ADD CONSTRAINT user_role_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id);

ALTER TABLE public.user_role_assignments ADD CONSTRAINT user_role_assignments_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.user_role_assignments ADD CONSTRAINT user_role_assignments_business_id_user_id_role_id_key UNIQUE (business_id, user_id, role_id);

ALTER TABLE public.user_role_assignments ADD CONSTRAINT user_role_assignments_pkey PRIMARY KEY (id);

ALTER TABLE public.user_role_assignments ADD CONSTRAINT user_role_assignments_role_id_fkey FOREIGN KEY (role_id) REFERENCES permission_roles(id) ON DELETE CASCADE;

ALTER TABLE public.user_role_assignments ADD CONSTRAINT user_role_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_sessions ADD CONSTRAINT user_sessions_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.user_sessions ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);

ALTER TABLE public.user_sessions ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.video_clips ADD CONSTRAINT video_clips_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.video_clips ADD CONSTRAINT video_clips_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.video_clips ADD CONSTRAINT video_clips_pkey PRIMARY KEY (id);

ALTER TABLE public.video_clips ADD CONSTRAINT video_clips_video_id_fkey FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;

ALTER TABLE public.videos ADD CONSTRAINT videos_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.videos ADD CONSTRAINT videos_pkey PRIMARY KEY (id);

ALTER TABLE public.videos ADD CONSTRAINT videos_status_check CHECK ((status = ANY (ARRAY['uploaded'::text, 'processing'::text, 'processed'::text, 'failed'::text])));

ALTER TABLE public.videos ADD CONSTRAINT videos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.web_pages ADD CONSTRAINT web_pages_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.web_pages ADD CONSTRAINT web_pages_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES web_pages(id) ON DELETE SET NULL;

ALTER TABLE public.web_pages ADD CONSTRAINT web_pages_pkey PRIMARY KEY (id);

ALTER TABLE public.web_pages ADD CONSTRAINT web_pages_website_id_fkey FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE;

ALTER TABLE public.web_pages ADD CONSTRAINT web_pages_website_id_slug_key UNIQUE (website_id, slug);

ALTER TABLE public.webhook_logs ADD CONSTRAINT webhook_logs_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id);

ALTER TABLE public.webhook_logs ADD CONSTRAINT webhook_logs_pkey PRIMARY KEY (id);

ALTER TABLE public.webhook_logs ADD CONSTRAINT webhook_logs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'success'::text, 'failed'::text])));

ALTER TABLE public.webhook_logs ADD CONSTRAINT webhook_logs_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE;

ALTER TABLE public.webhooks ADD CONSTRAINT webhooks_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.webhooks ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id);

ALTER TABLE public.website_analytics ADD CONSTRAINT website_analytics_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.website_analytics ADD CONSTRAINT website_analytics_event_type_check CHECK ((event_type = ANY (ARRAY['pageview'::text, 'click'::text, 'scroll'::text, 'form_view'::text, 'form_submit'::text, 'conversion'::text, 'purchase'::text, 'video_play'::text, 'download'::text, 'custom'::text])));

ALTER TABLE public.website_analytics ADD CONSTRAINT website_analytics_funnel_id_fkey FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE;

ALTER TABLE public.website_analytics ADD CONSTRAINT website_analytics_pkey PRIMARY KEY (id);

ALTER TABLE public.website_analytics ADD CONSTRAINT website_analytics_website_id_fkey FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE;

ALTER TABLE public.websites ADD CONSTRAINT websites_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.websites ADD CONSTRAINT websites_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.websites ADD CONSTRAINT websites_pkey PRIMARY KEY (id);

ALTER TABLE public.workflow_executions ADD CONSTRAINT workflow_executions_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.workflow_executions ADD CONSTRAINT workflow_executions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE public.workflow_executions ADD CONSTRAINT workflow_executions_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

ALTER TABLE public.workflow_executions ADD CONSTRAINT workflow_executions_pkey PRIMARY KEY (id);

ALTER TABLE public.workflow_executions ADD CONSTRAINT workflow_executions_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

ALTER TABLE public.workflow_step_logs ADD CONSTRAINT workflow_step_logs_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE;

ALTER TABLE public.workflow_step_logs ADD CONSTRAINT workflow_step_logs_pkey PRIMARY KEY (id);

ALTER TABLE public.workflows ADD CONSTRAINT workflows_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.workflows ADD CONSTRAINT workflows_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.workflows ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);

ALTER TABLE public.workspace_members ADD CONSTRAINT workspace_members_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.workspace_members ADD CONSTRAINT workspace_members_pkey PRIMARY KEY (id);

ALTER TABLE public.workspace_members ADD CONSTRAINT workspace_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text, 'viewer'::text])));

ALTER TABLE public.workspace_members ADD CONSTRAINT workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.workspace_members ADD CONSTRAINT workspace_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.workspace_members ADD CONSTRAINT workspace_members_workspace_id_user_id_key UNIQUE (workspace_id, user_id);

ALTER TABLE public.workspace_members ADD CONSTRAINT workspace_members_workspace_id_user_id_unique UNIQUE (workspace_id, user_id);

ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_business_id_slug_key UNIQUE (business_id, slug);

ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_created_by_unique UNIQUE (created_by);

ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX businesses_slug_key ON public.businesses USING btree (slug);

CREATE INDEX campaigns_business_id_idx ON public.campaigns USING btree (business_id);

CREATE INDEX campaigns_status_idx ON public.campaigns USING btree (status);

CREATE INDEX contacts_business_id_idx ON public.contacts USING btree (business_id);

CREATE INDEX contacts_email_idx ON public.contacts USING btree (email);

CREATE INDEX contacts_lifecycle_stage_idx ON public.contacts USING btree (lifecycle_stage);

CREATE INDEX crm_activities_contact_id_idx ON public.crm_activities USING btree (contact_id);

CREATE INDEX crm_activities_deal_id_idx ON public.crm_activities USING btree (deal_id);

CREATE INDEX crm_activities_type_idx ON public.crm_activities USING btree (type);

CREATE INDEX custom_domains_business_id_idx ON public.custom_domains USING btree (business_id);

CREATE INDEX custom_domains_domain_idx ON public.custom_domains USING btree (domain);

CREATE INDEX deals_business_id_idx ON public.deals USING btree (business_id);

CREATE INDEX deals_stage_id_idx ON public.deals USING btree (stage_id);

CREATE INDEX deals_status_idx ON public.deals USING btree (status);

CREATE INDEX email_templates_business_id_idx ON public.email_templates USING btree (business_id);

CREATE INDEX funnel_steps_funnel_id_idx ON public.funnel_steps USING btree (funnel_id);

CREATE INDEX funnels_business_id_idx ON public.funnels USING btree (business_id);

CREATE INDEX funnels_status_idx ON public.funnels USING btree (status);

CREATE INDEX idx_ab_tests_business ON public.ab_tests USING btree (business_id);

CREATE INDEX idx_ab_tests_entity ON public.ab_tests USING btree (entity_type, entity_id);

CREATE INDEX idx_ab_tests_status ON public.ab_tests USING btree (status);

CREATE INDEX idx_activity_logs_business ON public.activity_logs USING btree (business_id);

CREATE INDEX idx_activity_logs_created ON public.activity_logs USING btree (created_at DESC);

CREATE INDEX idx_activity_logs_entity ON public.activity_logs USING btree (entity_type, entity_id);

CREATE INDEX idx_activity_logs_user ON public.activity_logs USING btree (user_id);

CREATE INDEX idx_ai_content_business ON public.ai_content USING btree (business_id);

CREATE INDEX idx_ai_content_category ON public.ai_content USING btree (category);

CREATE INDEX idx_ai_content_saved ON public.ai_content USING btree (is_saved) WHERE (is_saved = true);

CREATE INDEX idx_ai_content_tool ON public.ai_content USING btree (tool);

CREATE INDEX idx_ai_exec_agent_type ON public.ai_execution_logs USING btree (agent_type);

CREATE INDEX idx_ai_exec_business_id ON public.ai_execution_logs USING btree (business_id);

CREATE INDEX idx_ai_exec_cost ON public.ai_execution_logs USING btree (business_id, cost_usd DESC);

CREATE INDEX idx_ai_exec_created_at ON public.ai_execution_logs USING btree (created_at DESC);

CREATE INDEX idx_ai_exec_created_by ON public.ai_execution_logs USING btree (created_by);

CREATE INDEX idx_ai_exec_model ON public.ai_execution_logs USING btree (model);

CREATE INDEX idx_ai_exec_status ON public.ai_execution_logs USING btree (status);

CREATE INDEX idx_ai_logs_business ON public.ai_logs USING btree (business_id);

CREATE INDEX idx_ai_logs_created ON public.ai_logs USING btree (created_at DESC);

CREATE INDEX idx_ai_logs_feature ON public.ai_logs USING btree (feature);

CREATE INDEX idx_ai_memory_business_id ON public.ai_memory USING btree (business_id);

CREATE INDEX idx_ai_memory_category ON public.ai_memory USING btree (business_id, category);

CREATE INDEX idx_ai_memory_key ON public.ai_memory USING btree (business_id, key);

CREATE INDEX idx_ai_memory_last_used ON public.ai_memory USING btree (business_id, last_used_at DESC);

CREATE INDEX idx_ai_memory_priority ON public.ai_memory USING btree (business_id, priority DESC);

CREATE INDEX idx_analytics_daily_business_date ON public.analytics_daily USING btree (business_id, date DESC);

CREATE INDEX idx_analytics_events_business ON public.analytics_events USING btree (business_id);

CREATE INDEX idx_analytics_events_created ON public.analytics_events USING btree (created_at DESC);

CREATE INDEX idx_analytics_events_type ON public.analytics_events USING btree (event_type);

CREATE INDEX idx_api_keys_business ON public.api_keys USING btree (business_id);

CREATE INDEX idx_api_keys_hash ON public.api_keys USING btree (key_hash);

CREATE INDEX idx_appointments_business ON public.appointments USING btree (business_id);

CREATE INDEX idx_appointments_contact ON public.appointments USING btree (contact_id);

CREATE INDEX idx_appointments_deal ON public.appointments USING btree (deal_id);

CREATE INDEX idx_appointments_owner ON public.appointments USING btree (owner_id);

CREATE INDEX idx_appointments_start ON public.appointments USING btree (start_time);

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);

CREATE INDEX idx_appointments_type ON public.appointments USING btree (type);

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);

CREATE INDEX idx_audit_logs_business_id ON public.audit_logs USING btree (business_id);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);

CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource_type, resource_id);

CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs USING btree (business_id, resource_type, created_at DESC);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);

CREATE INDEX idx_business_addons_business ON public.business_addons USING btree (business_id);

CREATE INDEX idx_business_addons_expires ON public.business_addons USING btree (expires_at);

CREATE INDEX idx_business_addons_status ON public.business_addons USING btree (status);

CREATE INDEX idx_business_members_business ON public.business_members USING btree (business_id);

CREATE INDEX idx_business_members_business_id ON public.business_members USING btree (business_id);

CREATE INDEX idx_business_members_role ON public.business_members USING btree (role);

CREATE INDEX idx_business_members_user ON public.business_members USING btree (user_id);

CREATE INDEX idx_business_members_user_id ON public.business_members USING btree (user_id);

CREATE INDEX idx_business_settings_business_id ON public.business_settings USING btree (business_id);

CREATE INDEX idx_business_users_business_id ON public.business_users USING btree (business_id);

CREATE INDEX idx_business_users_status ON public.business_users USING btree (status);

CREATE INDEX idx_business_users_user_id ON public.business_users USING btree (user_id);

CREATE INDEX idx_businesses_country ON public.businesses USING btree (country);

CREATE INDEX idx_businesses_created_at ON public.businesses USING btree (created_at DESC);

CREATE INDEX idx_businesses_created_by ON public.businesses USING btree (created_by);

CREATE UNIQUE INDEX idx_businesses_id_unique ON public.businesses USING btree (id);

CREATE INDEX idx_businesses_industry ON public.businesses USING btree (industry);

CREATE INDEX idx_businesses_name ON public.businesses USING btree (name);

CREATE INDEX idx_businesses_name_search ON public.businesses USING gin (to_tsvector('simple'::regconfig, ((COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text))));

CREATE INDEX idx_businesses_owner ON public.businesses USING btree (owner_id);

CREATE INDEX idx_businesses_owner_id ON public.businesses USING btree (owner_id);

CREATE UNIQUE INDEX idx_businesses_owner_id_business_name ON public.businesses USING btree (owner_id, COALESCE(business_name, ''::text)) WHERE (business_name IS NOT NULL);

CREATE INDEX idx_businesses_slug ON public.businesses USING btree (slug);

CREATE INDEX idx_businesses_status ON public.businesses USING btree (status);

CREATE INDEX idx_businesses_type ON public.businesses USING btree (type);

CREATE INDEX idx_businesses_user_id ON public.businesses USING btree (user_id);

CREATE INDEX idx_campaigns_business ON public.campaigns USING btree (business_id);

CREATE INDEX idx_campaigns_status ON public.campaigns USING btree (status);

CREATE INDEX idx_campaigns_type ON public.campaigns USING btree (type);

CREATE INDEX idx_client_invoices_business ON public.client_invoices USING btree (business_id);

CREATE INDEX idx_client_invoices_client ON public.client_invoices USING btree (client_id);

CREATE INDEX idx_client_invoices_due_date ON public.client_invoices USING btree (due_date);

CREATE INDEX idx_client_invoices_status ON public.client_invoices USING btree (status);

CREATE INDEX idx_clients_business ON public.clients USING btree (business_id);

CREATE INDEX idx_clients_business_id ON public.clients USING btree (business_id);

CREATE INDEX idx_clients_email ON public.clients USING btree (email);

CREATE INDEX idx_clients_status ON public.clients USING btree (status);

CREATE INDEX idx_components_business_id ON public.components USING btree (business_id);

CREATE INDEX idx_components_category ON public.components USING btree (business_id, category);

CREATE INDEX idx_components_status ON public.components USING btree (status);

CREATE INDEX idx_components_type ON public.components USING btree (business_id, type);

CREATE INDEX idx_components_visibility ON public.components USING btree (visibility);

CREATE INDEX idx_contacts_business_id ON public.contacts USING btree (business_id);

CREATE INDEX idx_contacts_created ON public.contacts USING btree (created_at DESC);

CREATE INDEX idx_contacts_email ON public.contacts USING btree (email);

CREATE INDEX idx_contacts_lead_score ON public.contacts USING btree (business_id, lead_score DESC);

CREATE INDEX idx_contacts_lifecycle ON public.contacts USING btree (lifecycle_stage);

CREATE INDEX idx_contacts_next_followup ON public.contacts USING btree (business_id, next_followup_at) WHERE (next_followup_at IS NOT NULL);

CREATE INDEX idx_contacts_status ON public.contacts USING btree (status);

CREATE INDEX idx_content_calendar_business ON public.content_calendar USING btree (business_id);

CREATE INDEX idx_content_calendar_scheduled ON public.content_calendar USING btree (scheduled_at);

CREATE INDEX idx_conversation_participants_business ON public.conversation_participants USING btree (business_id);

CREATE INDEX idx_conversation_participants_conv ON public.conversation_participants USING btree (conversation_id);

CREATE INDEX idx_conversation_participants_user ON public.conversation_participants USING btree (user_id);

CREATE INDEX idx_conversations_business ON public.conversations USING btree (business_id);

CREATE INDEX idx_conversations_context ON public.conversations USING btree (context_type, context_id);

CREATE INDEX idx_conversations_last_message ON public.conversations USING btree (last_message_at DESC);

CREATE INDEX idx_cron_job_logs_job ON public.cron_job_logs USING btree (job_name);

CREATE INDEX idx_cron_job_logs_started ON public.cron_job_logs USING btree (started_at DESC);

CREATE INDEX idx_cron_job_logs_status ON public.cron_job_logs USING btree (status);

CREATE INDEX idx_deals_business_id ON public.deals USING btree (business_id);

CREATE INDEX idx_deals_close_date ON public.deals USING btree (business_id, expected_close_date);

CREATE INDEX idx_deals_owner_id ON public.deals USING btree (owner_id);

CREATE INDEX idx_deals_pipeline_id ON public.deals USING btree (pipeline_id);

CREATE INDEX idx_deals_probability ON public.deals USING btree (business_id, probability DESC);

CREATE INDEX idx_deals_stage_id ON public.deals USING btree (stage_id);

CREATE INDEX idx_deals_status ON public.deals USING btree (status);

CREATE INDEX idx_discount_codes_active ON public.discount_codes USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_discount_codes_business ON public.discount_codes USING btree (business_id);

CREATE INDEX idx_discount_codes_code ON public.discount_codes USING btree (code);

CREATE INDEX idx_discount_codes_expires ON public.discount_codes USING btree (expires_at);

CREATE INDEX idx_email_sequences_business ON public.email_sequences USING btree (business_id);

CREATE INDEX idx_email_sequences_status ON public.email_sequences USING btree (status);

CREATE INDEX idx_email_sequences_trigger ON public.email_sequences USING btree (trigger_type);

CREATE INDEX idx_email_unsubscribes_business ON public.email_unsubscribes USING btree (business_id);

CREATE INDEX idx_email_unsubscribes_email ON public.email_unsubscribes USING btree (email);

CREATE INDEX idx_events_business_id ON public.events USING btree (business_id);

CREATE INDEX idx_events_created_at ON public.events USING btree (created_at DESC);

CREATE INDEX idx_events_dashboard ON public.events USING btree (business_id, event_type, created_at DESC);

CREATE INDEX idx_events_event_type ON public.events USING btree (event_type);

CREATE INDEX idx_events_session_id ON public.events USING btree (session_id);

CREATE INDEX idx_events_utm ON public.events USING btree (business_id, utm_campaign, utm_source);

CREATE INDEX idx_events_utm_source ON public.events USING btree (business_id, utm_source);

CREATE INDEX idx_events_visitor_id ON public.events USING btree (visitor_id);

CREATE INDEX idx_events_website_id ON public.events USING btree (website_id);

CREATE INDEX idx_feature_flags_enabled ON public.feature_flags USING btree (is_enabled) WHERE (is_enabled = true);

CREATE INDEX idx_feature_flags_key ON public.feature_flags USING btree (key);

CREATE INDEX idx_form_responses_business ON public.form_responses USING btree (business_id);

CREATE INDEX idx_form_responses_contact ON public.form_responses USING btree (contact_id);

CREATE INDEX idx_form_responses_form ON public.form_responses USING btree (form_id);

CREATE INDEX idx_funnel_steps_funnel ON public.funnel_steps USING btree (funnel_id);

CREATE INDEX idx_funnel_submissions_business ON public.funnel_submissions USING btree (business_id);

CREATE INDEX idx_funnel_submissions_contact ON public.funnel_submissions USING btree (contact_id);

CREATE INDEX idx_funnel_submissions_created ON public.funnel_submissions USING btree (created_at DESC);

CREATE INDEX idx_funnel_submissions_funnel ON public.funnel_submissions USING btree (funnel_id);

CREATE INDEX idx_funnels_business ON public.funnels USING btree (business_id);

CREATE INDEX idx_funnels_status ON public.funnels USING btree (status);

CREATE INDEX idx_interactions_business_id ON public.interactions USING btree (business_id);

CREATE INDEX idx_interactions_contact_id ON public.interactions USING btree (contact_id);

CREATE INDEX idx_interactions_created_at ON public.interactions USING btree (created_at DESC);

CREATE INDEX idx_interactions_deal_id ON public.interactions USING btree (deal_id);

CREATE INDEX idx_interactions_outcome ON public.interactions USING btree (business_id, outcome);

CREATE INDEX idx_interactions_scheduled_at ON public.interactions USING btree (scheduled_at) WHERE (scheduled_at IS NOT NULL);

CREATE INDEX idx_interactions_type ON public.interactions USING btree (business_id, type);

CREATE INDEX idx_invitations_business ON public.invitations USING btree (business_id);

CREATE INDEX idx_invitations_email ON public.invitations USING btree (email);

CREATE INDEX idx_invitations_token ON public.invitations USING btree (token);

CREATE INDEX idx_knowledge_base_category ON public.knowledge_base USING btree (category);

CREATE INDEX idx_knowledge_base_search ON public.knowledge_base USING gin (to_tsvector('english'::regconfig, ((COALESCE(title, ''::text) || ' '::text) || COALESCE(content, ''::text))));

CREATE INDEX idx_knowledge_base_slug ON public.knowledge_base USING btree (slug);

CREATE INDEX idx_leads_business ON public.leads USING btree (business_id);

CREATE INDEX idx_leads_contact ON public.leads USING btree (contact_id);

CREATE INDEX idx_leads_created ON public.leads USING btree (created_at DESC);

CREATE INDEX idx_leads_email ON public.leads USING btree (email);

CREATE INDEX idx_leads_funnel ON public.leads USING btree (funnel_id);

CREATE INDEX idx_leads_owner ON public.leads USING btree (owner_id);

CREATE INDEX idx_leads_score ON public.leads USING btree (score DESC);

CREATE INDEX idx_leads_search ON public.leads USING gin (to_tsvector('simple'::regconfig, ((((((COALESCE(first_name, ''::text) || ' '::text) || COALESCE(last_name, ''::text)) || ' '::text) || COALESCE(email, ''::text)) || ' '::text) || COALESCE(company, ''::text))));

CREATE INDEX idx_leads_source ON public.leads USING btree (source);

CREATE INDEX idx_leads_status ON public.leads USING btree (status);

CREATE INDEX idx_leads_temperature ON public.leads USING btree (temperature);

CREATE INDEX idx_list_contacts_contact ON public.list_contacts USING btree (contact_id);

CREATE INDEX idx_list_contacts_list ON public.list_contacts USING btree (list_id);

CREATE INDEX idx_list_contacts_status ON public.list_contacts USING btree (status);

CREATE INDEX idx_marketplace_orders_business ON public.marketplace_orders USING btree (business_id);

CREATE INDEX idx_marketplace_orders_buyer ON public.marketplace_orders USING btree (buyer_id);

CREATE INDEX idx_marketplace_orders_listing ON public.marketplace_orders USING btree (listing_id);

CREATE INDEX idx_marketplace_orders_status ON public.marketplace_orders USING btree (status);

CREATE INDEX idx_messages_active ON public.messages USING btree (conversation_id, created_at DESC) WHERE (is_deleted = false);

CREATE INDEX idx_messages_business ON public.messages USING btree (business_id);

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id);

CREATE INDEX idx_messages_created ON public.messages USING btree (created_at DESC);

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);

CREATE INDEX idx_notifications_business ON public.notifications USING btree (business_id);

CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id, is_read) WHERE (is_read = false);

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read) WHERE (is_read = false);

CREATE INDEX idx_payment_transactions_business ON public.payment_transactions USING btree (business_id);

CREATE INDEX idx_payment_transactions_created ON public.payment_transactions USING btree (created_at DESC);

CREATE INDEX idx_payment_transactions_reference ON public.payment_transactions USING btree (reference);

CREATE INDEX idx_payment_transactions_status ON public.payment_transactions USING btree (status);

CREATE INDEX idx_permission_roles_business ON public.permission_roles USING btree (business_id);

CREATE INDEX idx_plan_addons_active ON public.plan_addons USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_plan_addons_key ON public.plan_addons USING btree (key);

CREATE INDEX idx_product_variants_business ON public.product_variants USING btree (business_id);

CREATE INDEX idx_product_variants_product ON public.product_variants USING btree (product_id);

CREATE INDEX idx_products_business ON public.products USING btree (business_id);

CREATE INDEX idx_products_category ON public.products USING btree (category);

CREATE INDEX idx_products_created ON public.products USING btree (created_at DESC);

CREATE INDEX idx_products_featured ON public.products USING btree (is_featured) WHERE (is_featured = true);

CREATE INDEX idx_products_search ON public.products USING gin (to_tsvector('simple'::regconfig, ((COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text))));

CREATE INDEX idx_products_slug ON public.products USING btree (slug);

CREATE INDEX idx_products_status ON public.products USING btree (status);

CREATE INDEX idx_products_type ON public.products USING btree (type);

CREATE INDEX idx_profiles_business_id ON public.profiles USING btree (business_id);

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);

CREATE INDEX idx_projects_business ON public.projects USING btree (business_id);

CREATE INDEX idx_projects_business_id ON public.projects USING btree (business_id);

CREATE INDEX idx_projects_client_id ON public.projects USING btree (client_id);

CREATE INDEX idx_projects_status ON public.projects USING btree (status);

CREATE INDEX idx_rate_limits_cleanup ON public.rate_limits USING btree (window_end);

CREATE INDEX idx_rate_limits_lookup ON public.rate_limits USING btree (business_id, endpoint, window_end);

CREATE INDEX idx_rate_limits_ttl ON public.rate_limits USING btree (window_end, business_id);

CREATE INDEX idx_referral_commissions_referrer ON public.referral_commissions USING btree (referrer_id);

CREATE INDEX idx_referral_commissions_status ON public.referral_commissions USING btree (status);

CREATE INDEX idx_referrals_code ON public.referrals USING btree (code);

CREATE INDEX idx_referrals_referrer ON public.referrals USING btree (referrer_id);

CREATE INDEX idx_sequence_enrollments_contact ON public.sequence_enrollments USING btree (contact_id);

CREATE INDEX idx_sequence_enrollments_next_send ON public.sequence_enrollments USING btree (next_send_at) WHERE (status = 'active'::text);

CREATE INDEX idx_sequence_enrollments_sequence ON public.sequence_enrollments USING btree (sequence_id);

CREATE INDEX idx_sequence_enrollments_status ON public.sequence_enrollments USING btree (status);

CREATE INDEX idx_sequence_steps_business ON public.email_sequence_steps USING btree (business_id);

CREATE INDEX idx_sequence_steps_sequence ON public.email_sequence_steps USING btree (sequence_id);

CREATE INDEX idx_social_posts_business ON public.social_posts USING btree (business_id);

CREATE INDEX idx_social_posts_scheduled ON public.social_posts USING btree (scheduled_at) WHERE (scheduled_at IS NOT NULL);

CREATE INDEX idx_social_posts_status ON public.social_posts USING btree (status);

CREATE INDEX idx_subscriber_lists_business ON public.subscriber_lists USING btree (business_id);

CREATE INDEX idx_subscription_plans_slug ON public.subscription_plans USING btree (slug);

CREATE INDEX idx_subscription_plans_status ON public.subscription_plans USING btree (status);

CREATE INDEX idx_subscriptions_business ON public.subscriptions USING btree (business_id);

CREATE INDEX idx_subscriptions_plan ON public.subscriptions USING btree (plan_id);

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);

CREATE INDEX idx_support_tickets_business ON public.support_tickets USING btree (business_id);

CREATE INDEX idx_support_tickets_created_by ON public.support_tickets USING btree (created_by);

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);

CREATE INDEX idx_tasks_assigned_to ON public.tasks USING btree (assigned_to);

CREATE INDEX idx_tasks_business ON public.tasks USING btree (business_id);

CREATE INDEX idx_tasks_business_id ON public.tasks USING btree (business_id);

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date);

CREATE INDEX idx_tasks_project_id ON public.tasks USING btree (project_id);

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);

CREATE INDEX idx_team_members_business_id ON public.team_members USING btree (business_id);

CREATE INDEX idx_team_members_user ON public.team_members USING btree (user_id);

CREATE INDEX idx_team_members_user_id ON public.team_members USING btree (user_id);

CREATE INDEX idx_transactions_business_id ON public.transactions USING btree (business_id);

CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at DESC);

CREATE INDEX idx_transactions_invoice_number ON public.transactions USING btree (invoice_number) WHERE (invoice_number IS NOT NULL);

CREATE INDEX idx_transactions_provider ON public.transactions USING btree (payment_provider);

CREATE INDEX idx_transactions_provider_reference ON public.transactions USING btree (provider_reference);

CREATE INDEX idx_transactions_status ON public.transactions USING btree (status);

CREATE INDEX idx_transactions_subscription_id ON public.transactions USING btree (subscription_id);

CREATE INDEX idx_usage_metrics_lookup ON public.usage_metrics USING btree (business_id, metric_type);

CREATE INDEX idx_usage_metrics_month ON public.usage_metrics USING btree (business_id, period_start DESC, metric_type);

CREATE INDEX idx_usage_metrics_period ON public.usage_metrics USING btree (business_id, period_start DESC);

CREATE INDEX idx_user_role_assignments_business ON public.user_role_assignments USING btree (business_id);

CREATE INDEX idx_user_role_assignments_role ON public.user_role_assignments USING btree (role_id);

CREATE INDEX idx_user_role_assignments_user ON public.user_role_assignments USING btree (user_id);

CREATE INDEX idx_user_sessions_active ON public.user_sessions USING btree (is_active, last_seen_at DESC) WHERE (is_active = true);

CREATE INDEX idx_user_sessions_business ON public.user_sessions USING btree (business_id);

CREATE INDEX idx_user_sessions_user ON public.user_sessions USING btree (user_id);

CREATE INDEX idx_video_clips_business_id ON public.video_clips USING btree (business_id);

CREATE INDEX idx_video_clips_status ON public.video_clips USING btree (status);

CREATE INDEX idx_video_clips_video_id ON public.video_clips USING btree (video_id);

CREATE INDEX idx_video_clips_viral_score ON public.video_clips USING btree (business_id, viral_score DESC);

CREATE INDEX idx_web_pages_website ON public.web_pages USING btree (website_id);

CREATE INDEX idx_webhook_logs_webhook ON public.webhook_logs USING btree (webhook_id);

CREATE INDEX idx_webhooks_business ON public.webhooks USING btree (business_id);

CREATE INDEX idx_website_analytics_business ON public.website_analytics USING btree (business_id);

CREATE INDEX idx_website_analytics_created ON public.website_analytics USING btree (created_at DESC);

CREATE INDEX idx_website_analytics_session ON public.website_analytics USING btree (session_id);

CREATE INDEX idx_website_analytics_visitor ON public.website_analytics USING btree (visitor_id);

CREATE INDEX idx_website_analytics_website ON public.website_analytics USING btree (website_id);

CREATE INDEX idx_websites_business ON public.websites USING btree (business_id);

CREATE INDEX idx_websites_status ON public.websites USING btree (status);

CREATE INDEX idx_workflow_executions_status ON public.workflow_executions USING btree (status);

CREATE INDEX idx_workflow_executions_workflow ON public.workflow_executions USING btree (workflow_id);

CREATE INDEX idx_workflows_business ON public.workflows USING btree (business_id);

CREATE INDEX idx_workflows_status ON public.workflows USING btree (status);

CREATE INDEX idx_workflows_trigger ON public.workflows USING btree (trigger_type);

CREATE INDEX idx_workflows_trigger_type ON public.workflows USING btree (trigger_type);

CREATE INDEX idx_workspace_members_business ON public.workspace_members USING btree (business_id);

CREATE INDEX idx_workspace_members_user ON public.workspace_members USING btree (user_id);

CREATE INDEX idx_workspace_members_workspace ON public.workspace_members USING btree (workspace_id);

CREATE INDEX idx_workspaces_business ON public.workspaces USING btree (business_id);

CREATE INDEX idx_workspaces_slug ON public.workspaces USING btree (slug);

CREATE INDEX page_versions_page_id_idx ON public.page_versions USING btree (page_id);

CREATE INDEX pipeline_stages_pipeline_id_idx ON public.pipeline_stages USING btree (pipeline_id);

CREATE INDEX pipelines_business_id_idx ON public.pipelines USING btree (business_id);

CREATE INDEX web_pages_status_idx ON public.web_pages USING btree (status);

CREATE INDEX web_pages_website_id_idx ON public.web_pages USING btree (website_id);

CREATE INDEX websites_business_id_idx ON public.websites USING btree (business_id);

CREATE INDEX workflow_executions_contact_id_idx ON public.workflow_executions USING btree (contact_id);

CREATE INDEX workflow_executions_status_idx ON public.workflow_executions USING btree (status);

CREATE INDEX workflow_executions_workflow_id_idx ON public.workflow_executions USING btree (workflow_id);

CREATE INDEX workflow_step_logs_execution_id_idx ON public.workflow_step_logs USING btree (execution_id);

CREATE INDEX workflows_business_id_idx ON public.workflows USING btree (business_id);

CREATE INDEX workflows_status_idx ON public.workflows USING btree (status);

CREATE INDEX workflows_trigger_type_idx ON public.workflows USING btree (trigger_type);

ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ai_content ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ai_execution_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ai_tool_configs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.business_addons ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.deal_tags ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.funnel_steps ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.funnel_submissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.list_contacts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.page_versions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.permission_roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.plan_addons ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.platform_audit_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.referral_programs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.subscriber_lists ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.usage_quotas ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.video_clips ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.web_pages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.website_analytics ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.workflow_step_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY ab_tests_delete ON public.ab_tests AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = ab_tests.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY ab_tests_insert ON public.ab_tests AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY ab_tests_select ON public.ab_tests AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY ab_tests_update ON public.ab_tests AS PERMISSIVE FOR UPDATE TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY activity_logs_business_member ON public.activity_logs AS PERMISSIVE FOR SELECT TO public
  USING (is_business_member(business_id));

CREATE POLICY activity_logs_insert ON public.activity_logs AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY policy_all ON public.activity_logs AS PERMISSIVE FOR ALL TO public
  USING (is_biz_member(business_id))
  WITH CHECK (is_biz_member(business_id));

CREATE POLICY ai_content_business ON public.ai_content AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY ai_exec_logs_insert ON public.ai_execution_logs AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text)))));

CREATE POLICY ai_exec_logs_select ON public.ai_execution_logs AS PERMISSIVE FOR SELECT TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text)))));

CREATE POLICY ai_logs_business_member ON public.ai_logs AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY policy_all ON public.ai_logs AS PERMISSIVE FOR ALL TO public
  USING (is_biz_member(business_id))
  WITH CHECK (is_biz_member(business_id));

CREATE POLICY ai_memory_delete ON public.ai_memory AS PERMISSIVE FOR DELETE TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = 'admin'::text)))));

CREATE POLICY ai_memory_insert ON public.ai_memory AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = ANY ((ARRAY['admin'::character varying, 'editor'::character varying, 'manager'::character varying])::text[]))))));

CREATE POLICY ai_memory_select ON public.ai_memory AS PERMISSIVE FOR SELECT TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text)))));

CREATE POLICY ai_memory_update ON public.ai_memory AS PERMISSIVE FOR UPDATE TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = ANY ((ARRAY['admin'::character varying, 'editor'::character varying, 'manager'::character varying])::text[]))))));

CREATE POLICY ai_tool_configs_business ON public.ai_tool_configs AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY analytics_daily_business ON public.analytics_daily AS PERMISSIVE FOR SELECT TO public
  USING (is_business_member(business_id));

CREATE POLICY analytics_events_all ON public.analytics_events AS PERMISSIVE FOR ALL TO authenticated
  USING (user_is_member(business_id));

CREATE POLICY analytics_events_insert ON public.analytics_events AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY analytics_events_select ON public.analytics_events AS PERMISSIVE FOR SELECT TO public
  USING (is_business_member(business_id));

CREATE POLICY api_keys_business ON public.api_keys AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY appointments_delete ON public.appointments AS PERMISSIVE FOR DELETE TO public
  USING (((owner_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = appointments.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY appointments_insert ON public.appointments AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY appointments_select ON public.appointments AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY appointments_update ON public.appointments AS PERMISSIVE FOR UPDATE TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY audit_logs_insert_system ON public.audit_logs AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY audit_logs_select ON public.audit_logs AS PERMISSIVE FOR SELECT TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::text[]))))));

CREATE POLICY business_addons_delete ON public.business_addons AS PERMISSIVE FOR DELETE TO public
  USING (is_platform_admin());

CREATE POLICY business_addons_insert ON public.business_addons AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY business_addons_select ON public.business_addons AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY business_addons_update ON public.business_addons AS PERMISSIVE FOR UPDATE TO public
  USING (is_platform_admin());

CREATE POLICY business_members_all ON public.business_members AS PERMISSIVE FOR ALL TO authenticated
  USING (user_is_member(business_id))
  WITH CHECK (user_is_member(business_id));

CREATE POLICY business_members_insert ON public.business_members AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY business_members_select ON public.business_members AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR (user_id = auth.uid())));

CREATE POLICY business_members_update ON public.business_members AS PERMISSIVE FOR UPDATE TO public
  USING (is_business_member(business_id));

CREATE POLICY business_settings_all ON public.business_settings AS PERMISSIVE FOR ALL TO authenticated
  USING (user_is_member(business_id))
  WITH CHECK (user_is_member(business_id));

CREATE POLICY business_settings_member ON public.business_settings AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY business_users_insert ON public.business_users AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = 'admin'::text)))));

CREATE POLICY business_users_select ON public.business_users AS PERMISSIVE FOR SELECT TO public
  USING (((user_id = auth.uid()) OR (business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text))))));

CREATE POLICY business_users_update ON public.business_users AS PERMISSIVE FOR UPDATE TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = 'admin'::text)))));

CREATE POLICY business_delete ON public.businesses AS PERMISSIVE FOR DELETE TO authenticated
  USING ((owner_id = auth.uid()));

CREATE POLICY business_insert ON public.businesses AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((owner_id = auth.uid()));

CREATE POLICY business_select ON public.businesses AS PERMISSIVE FOR SELECT TO authenticated
  USING (((owner_id = auth.uid()) OR user_is_member(id)));

CREATE POLICY business_update ON public.businesses AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((owner_id = auth.uid()));

CREATE POLICY businesses_insert_own ON public.businesses AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((owner_id = auth.uid()) OR (user_id = auth.uid())));

CREATE POLICY businesses_select_member ON public.businesses AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(id) OR is_platform_admin()));

CREATE POLICY businesses_update_member ON public.businesses AS PERMISSIVE FOR UPDATE TO public
  USING (is_business_member(id));

CREATE POLICY campaigns_business_member ON public.campaigns AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY client_invoices_business_member ON public.client_invoices AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY policy_all ON public.client_invoices AS PERMISSIVE FOR ALL TO public
  USING (is_biz_member(business_id))
  WITH CHECK (is_biz_member(business_id));

CREATE POLICY clients_all ON public.clients AS PERMISSIVE FOR ALL TO authenticated
  USING (user_is_member(business_id))
  WITH CHECK (user_is_member(business_id));

CREATE POLICY clients_business_member ON public.clients AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY clips_all ON public.clips AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM videos v
  WHERE ((v.id = clips.video_id) AND is_biz_member(v.business_id)))));

CREATE POLICY clips_via_video ON public.clips AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM videos v
  WHERE ((v.id = clips.video_id) AND is_business_member(v.business_id)))));

CREATE POLICY components_delete ON public.components AS PERMISSIVE FOR DELETE TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = 'admin'::text)))));

CREATE POLICY components_insert ON public.components AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = ANY ((ARRAY['admin'::character varying, 'editor'::character varying])::text[]))))));

CREATE POLICY components_select ON public.components AS PERMISSIVE FOR SELECT TO public
  USING ((((visibility)::text = 'public'::text) OR (business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text))))));

CREATE POLICY components_update ON public.components AS PERMISSIVE FOR UPDATE TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = ANY ((ARRAY['admin'::character varying, 'editor'::character varying])::text[]))))));

CREATE POLICY contact_tags_via_contact ON public.contact_tags AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_tags.contact_id) AND is_business_member(c.business_id)))));

CREATE POLICY contacts_business_member ON public.contacts AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY content_calendar_business ON public.content_calendar AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY conv_participants_delete ON public.conversation_participants AS PERMISSIVE FOR DELETE TO public
  USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = conversation_participants.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY conv_participants_insert ON public.conversation_participants AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY conv_participants_select ON public.conversation_participants AS PERMISSIVE FOR SELECT TO public
  USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = conversation_participants.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY conv_participants_update ON public.conversation_participants AS PERMISSIVE FOR UPDATE TO public
  USING (((user_id = auth.uid()) OR is_platform_admin()));

CREATE POLICY conversations_delete ON public.conversations AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = conversations.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY conversations_insert ON public.conversations AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY conversations_select ON public.conversations AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM conversation_participants cp
  WHERE ((cp.conversation_id = conversations.id) AND (cp.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = conversations.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY conversations_update ON public.conversations AS PERMISSIVE FOR UPDATE TO public
  USING (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = conversations.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY crm_activities_business_member ON public.crm_activities AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY crm_notes_business_member ON public.crm_notes AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY cron_job_logs_delete ON public.cron_job_logs AS PERMISSIVE FOR DELETE TO public
  USING (is_platform_admin());

CREATE POLICY cron_job_logs_insert ON public.cron_job_logs AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY cron_job_logs_select ON public.cron_job_logs AS PERMISSIVE FOR SELECT TO public
  USING (is_platform_admin());

CREATE POLICY custom_domains_business_member ON public.custom_domains AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY deal_tags_via_deal ON public.deal_tags AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM deals d
  WHERE ((d.id = deal_tags.deal_id) AND is_business_member(d.business_id)))));

CREATE POLICY deals_business_member ON public.deals AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY discount_codes_delete ON public.discount_codes AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = discount_codes.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY discount_codes_insert ON public.discount_codes AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY discount_codes_select ON public.discount_codes AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY discount_codes_update ON public.discount_codes AS PERMISSIVE FOR UPDATE TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY email_logs_all ON public.email_logs AS PERMISSIVE FOR ALL TO public
  USING (is_biz_member(business_id))
  WITH CHECK (is_biz_member(business_id));

CREATE POLICY email_logs_business_member ON public.email_logs AS PERMISSIVE FOR SELECT TO public
  USING (is_business_member(business_id));

CREATE POLICY sequence_steps_delete ON public.email_sequence_steps AS PERMISSIVE FOR DELETE TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY sequence_steps_insert ON public.email_sequence_steps AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY sequence_steps_select ON public.email_sequence_steps AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY sequence_steps_update ON public.email_sequence_steps AS PERMISSIVE FOR UPDATE TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY email_sequences_delete ON public.email_sequences AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = email_sequences.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY email_sequences_insert ON public.email_sequences AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY email_sequences_select ON public.email_sequences AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY email_sequences_update ON public.email_sequences AS PERMISSIVE FOR UPDATE TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY email_templates_business_member ON public.email_templates AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY unsubscribes_delete ON public.email_unsubscribes AS PERMISSIVE FOR DELETE TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY unsubscribes_insert ON public.email_unsubscribes AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY unsubscribes_select ON public.email_unsubscribes AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY events_insert ON public.events AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY events_select ON public.events AS PERMISSIVE FOR SELECT TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text)))));

CREATE POLICY feature_flags_delete ON public.feature_flags AS PERMISSIVE FOR DELETE TO public
  USING (is_platform_admin());

CREATE POLICY feature_flags_insert ON public.feature_flags AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_platform_admin());

CREATE POLICY feature_flags_select ON public.feature_flags AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() IS NOT NULL));

CREATE POLICY feature_flags_update ON public.feature_flags AS PERMISSIVE FOR UPDATE TO public
  USING (is_platform_admin());

CREATE POLICY form_responses_insert_public ON public.form_responses AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY form_responses_select_business ON public.form_responses AS PERMISSIVE FOR SELECT TO public
  USING (is_business_member(business_id));

CREATE POLICY forms_business ON public.forms AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY funnel_steps_business_member ON public.funnel_steps AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY funnel_submissions_insert_public ON public.funnel_submissions AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY funnel_submissions_select_business ON public.funnel_submissions AS PERMISSIVE FOR SELECT TO public
  USING (is_business_member(business_id));

CREATE POLICY funnels_business_member ON public.funnels AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY integrations_business ON public.integrations AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY interactions_delete ON public.interactions AS PERMISSIVE FOR DELETE TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::text[]))))));

CREATE POLICY interactions_insert ON public.interactions AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = ANY ((ARRAY['admin'::character varying, 'editor'::character varying, 'manager'::character varying])::text[]))))));

CREATE POLICY interactions_select ON public.interactions AS PERMISSIVE FOR SELECT TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text)))));

CREATE POLICY interactions_update ON public.interactions AS PERMISSIVE FOR UPDATE TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = ANY ((ARRAY['admin'::character varying, 'editor'::character varying, 'manager'::character varying])::text[]))))));

CREATE POLICY invitations_business_insert ON public.invitations AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY invitations_business_select ON public.invitations AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR (email = auth.email())));

CREATE POLICY invitations_token_update ON public.invitations AS PERMISSIVE FOR UPDATE TO public
  USING (((email = auth.email()) OR is_business_member(business_id)));

CREATE POLICY invoice_items_via_invoice ON public.invoice_items AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM client_invoices ci
  WHERE ((ci.id = invoice_items.invoice_id) AND is_business_member(ci.business_id)))));

CREATE POLICY policy_all ON public.invoice_items AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM client_invoices ci
  WHERE ((ci.id = invoice_items.invoice_id) AND is_biz_member(ci.business_id)))));

CREATE POLICY invoices_all ON public.invoices AS PERMISSIVE FOR ALL TO public
  USING (is_biz_member(business_id))
  WITH CHECK (is_biz_member(business_id));

CREATE POLICY invoices_business_member ON public.invoices AS PERMISSIVE FOR SELECT TO public
  USING (is_business_member(business_id));

CREATE POLICY knowledge_base_admin_all ON public.knowledge_base AS PERMISSIVE FOR ALL TO public
  USING (is_platform_admin());

CREATE POLICY knowledge_base_public_select ON public.knowledge_base AS PERMISSIVE FOR SELECT TO public
  USING (((is_published = true) OR is_platform_admin()));

CREATE POLICY leads_delete ON public.leads AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = leads.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY leads_insert ON public.leads AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY leads_select ON public.leads AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY leads_update ON public.leads AS PERMISSIVE FOR UPDATE TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY list_contacts_delete ON public.list_contacts AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM subscriber_lists sl
  WHERE ((sl.id = list_contacts.list_id) AND is_business_member(sl.business_id)))) OR is_platform_admin()));

CREATE POLICY list_contacts_insert ON public.list_contacts AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM subscriber_lists sl
  WHERE ((sl.id = list_contacts.list_id) AND is_business_member(sl.business_id)))));

CREATE POLICY list_contacts_select ON public.list_contacts AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM subscriber_lists sl
  WHERE ((sl.id = list_contacts.list_id) AND is_business_member(sl.business_id)))) OR is_platform_admin()));

CREATE POLICY list_contacts_update ON public.list_contacts AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1
   FROM subscriber_lists sl
  WHERE ((sl.id = list_contacts.list_id) AND is_business_member(sl.business_id)))));

CREATE POLICY marketplace_listings_admin_all ON public.marketplace_listings AS PERMISSIVE FOR ALL TO public
  USING (is_platform_admin());

CREATE POLICY marketplace_listings_select ON public.marketplace_listings AS PERMISSIVE FOR SELECT TO public
  USING (((status = 'active'::text) OR is_platform_admin()));

CREATE POLICY marketplace_orders_insert ON public.marketplace_orders AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((buyer_id = auth.uid()));

CREATE POLICY marketplace_orders_select ON public.marketplace_orders AS PERMISSIVE FOR SELECT TO public
  USING (((buyer_id = auth.uid()) OR is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY marketplace_orders_update ON public.marketplace_orders AS PERMISSIVE FOR UPDATE TO public
  USING (((buyer_id = auth.uid()) OR is_platform_admin()));

CREATE POLICY media_business_member ON public.media AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY policy_all ON public.media AS PERMISSIVE FOR ALL TO public
  USING (is_biz_member(business_id))
  WITH CHECK (is_biz_member(business_id));

CREATE POLICY messages_delete ON public.messages AS PERMISSIVE FOR DELETE TO public
  USING (((sender_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = messages.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY messages_insert ON public.messages AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((sender_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM conversation_participants cp
  WHERE ((cp.conversation_id = messages.conversation_id) AND (cp.user_id = auth.uid()))))));

CREATE POLICY messages_select ON public.messages AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM conversation_participants cp
  WHERE ((cp.conversation_id = messages.conversation_id) AND (cp.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = messages.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY messages_update ON public.messages AS PERMISSIVE FOR UPDATE TO public
  USING (((sender_id = auth.uid()) OR is_platform_admin()));

CREATE POLICY notifications_user_own ON public.notifications AS PERMISSIVE FOR ALL TO public
  USING (((user_id = auth.uid()) OR is_business_member(business_id)));

CREATE POLICY policy_all ON public.notifications AS PERMISSIVE FOR ALL TO public
  USING (is_biz_member(business_id))
  WITH CHECK (is_biz_member(business_id));

CREATE POLICY onboarding_business ON public.onboarding_progress AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY order_messages_insert ON public.order_messages AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((sender_id = auth.uid()));

CREATE POLICY order_messages_select ON public.order_messages AS PERMISSIVE FOR SELECT TO public
  USING (((sender_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM marketplace_orders o
  WHERE ((o.id = order_messages.order_id) AND (o.buyer_id = auth.uid())))) OR is_platform_admin()));

CREATE POLICY organizations_all ON public.organizations AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() IS NOT NULL))
  WITH CHECK ((auth.uid() IS NOT NULL));

CREATE POLICY organizations_owner ON public.organizations AS PERMISSIVE FOR ALL TO public
  USING (((owner_id = auth.uid()) OR is_platform_admin()));

CREATE POLICY page_versions_business_member ON public.page_versions AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY pages_all ON public.pages AS PERMISSIVE FOR ALL TO authenticated
  USING ((site_id IN ( SELECT sites.id
   FROM sites
  WHERE user_is_member(sites.business_id))));

CREATE POLICY pages_via_site ON public.pages AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM sites s
  WHERE ((s.id = pages.site_id) AND is_business_member(s.business_id)))));

CREATE POLICY payment_transactions_insert ON public.payment_transactions AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY payment_transactions_select ON public.payment_transactions AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY payout_requests_own ON public.payout_requests AS PERMISSIVE FOR ALL TO public
  USING (((user_id = auth.uid()) OR is_platform_admin()));

CREATE POLICY permission_roles_delete ON public.permission_roles AS PERMISSIVE FOR DELETE TO public
  USING (((is_system = false) AND (((business_id IS NULL) AND is_platform_admin()) OR ((business_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = permission_roles.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = 'owner'::business_role))))))));

CREATE POLICY permission_roles_insert ON public.permission_roles AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((((business_id IS NULL) AND is_platform_admin()) OR ((business_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = permission_roles.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = 'owner'::business_role)))))));

CREATE POLICY permission_roles_select ON public.permission_roles AS PERMISSIVE FOR SELECT TO public
  USING (((business_id IS NULL) OR is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY permission_roles_update ON public.permission_roles AS PERMISSIVE FOR UPDATE TO public
  USING (((is_system = false) AND (((business_id IS NULL) AND is_platform_admin()) OR ((business_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = permission_roles.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = 'owner'::business_role))))))));

CREATE POLICY pipeline_stages_business_member ON public.pipeline_stages AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY pipelines_business_member ON public.pipelines AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY plan_addons_select ON public.plan_addons AS PERMISSIVE FOR SELECT TO public
  USING (((is_active = true) OR is_platform_admin()));

CREATE POLICY plan_addons_write ON public.plan_addons AS PERMISSIVE FOR ALL TO public
  USING (is_platform_admin());

CREATE POLICY plan_limits_select ON public.plan_limits AS PERMISSIVE FOR SELECT TO public
  USING (true);

CREATE POLICY plans_read ON public.plans AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY plans_select_all ON public.plans AS PERMISSIVE FOR SELECT TO public
  USING (((is_active = true) OR is_platform_admin()));

CREATE POLICY platform_admins_self ON public.platform_admins AS PERMISSIVE FOR SELECT TO public
  USING (((user_id = auth.uid()) OR is_platform_admin()));

CREATE POLICY platform_audit_log_admin ON public.platform_audit_log AS PERMISSIVE FOR ALL TO public
  USING (is_platform_admin());

CREATE POLICY platform_settings_read ON public.platform_settings AS PERMISSIVE FOR SELECT TO public
  USING (true);

CREATE POLICY platform_settings_write_admin ON public.platform_settings AS PERMISSIVE FOR ALL TO public
  USING (is_platform_admin());

CREATE POLICY product_variants_delete ON public.product_variants AS PERMISSIVE FOR DELETE TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY product_variants_insert ON public.product_variants AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY product_variants_select ON public.product_variants AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR (EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = product_variants.product_id) AND (p.status = 'active'::text)))) OR is_platform_admin()));

CREATE POLICY product_variants_update ON public.product_variants AS PERMISSIVE FOR UPDATE TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY products_delete ON public.products AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = products.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY products_insert ON public.products AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY products_public_select ON public.products AS PERMISSIVE FOR SELECT TO public
  USING (((status = 'active'::text) OR is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY products_update ON public.products AS PERMISSIVE FOR UPDATE TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY "Users can insert their own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can update their own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((auth.uid() = id));

CREATE POLICY "Users can view their own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = id));

CREATE POLICY profiles_insert ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((id = auth.uid()));

CREATE POLICY profiles_insert_own ON public.profiles AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((id = auth.uid()));

CREATE POLICY profiles_select ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated
  USING ((id = auth.uid()));

CREATE POLICY profiles_select_own ON public.profiles AS PERMISSIVE FOR SELECT TO public
  USING (((id = auth.uid()) OR is_platform_admin()));

CREATE POLICY profiles_update ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((id = auth.uid()));

CREATE POLICY profiles_update_own ON public.profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((id = auth.uid()));

CREATE POLICY projects_all ON public.projects AS PERMISSIVE FOR ALL TO authenticated
  USING (user_is_member(business_id))
  WITH CHECK (user_is_member(business_id));

CREATE POLICY projects_business_member ON public.projects AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY rate_limits_select_own ON public.rate_limits AS PERMISSIVE FOR SELECT TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = 'admin'::text)))));

CREATE POLICY referral_clicks_insert ON public.referral_clicks AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY referral_commissions_own ON public.referral_commissions AS PERMISSIVE FOR SELECT TO public
  USING (((referrer_id = auth.uid()) OR is_platform_admin()));

CREATE POLICY referral_programs_select ON public.referral_programs AS PERMISSIVE FOR SELECT TO public
  USING (((is_active = true) OR is_platform_admin()));

CREATE POLICY referrals_own ON public.referrals AS PERMISSIVE FOR ALL TO public
  USING (((referrer_id = auth.uid()) OR is_platform_admin()));

CREATE POLICY sections_all ON public.sections AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM (pages pg
     JOIN sites s ON ((s.id = pg.site_id)))
  WHERE ((pg.id = sections.page_id) AND is_biz_member(s.business_id)))));

CREATE POLICY sections_via_page ON public.sections AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM (pages p
     JOIN sites s ON ((s.id = p.site_id)))
  WHERE ((p.id = sections.page_id) AND is_business_member(s.business_id)))));

CREATE POLICY sequence_enrollments_delete ON public.sequence_enrollments AS PERMISSIVE FOR DELETE TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY sequence_enrollments_insert ON public.sequence_enrollments AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY sequence_enrollments_select ON public.sequence_enrollments AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY sequence_enrollments_update ON public.sequence_enrollments AS PERMISSIVE FOR UPDATE TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY policy_all ON public.services AS PERMISSIVE FOR ALL TO public
  USING (is_biz_member(business_id))
  WITH CHECK (is_biz_member(business_id));

CREATE POLICY services_business_member ON public.services AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY sites_all ON public.sites AS PERMISSIVE FOR ALL TO authenticated
  USING (user_is_member(business_id))
  WITH CHECK (user_is_member(business_id));

CREATE POLICY sites_business_member ON public.sites AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY policy_all ON public.social_accounts AS PERMISSIVE FOR ALL TO public
  USING (is_biz_member(business_id))
  WITH CHECK (is_biz_member(business_id));

CREATE POLICY social_accounts_business_member ON public.social_accounts AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY policy_all ON public.social_posts AS PERMISSIVE FOR ALL TO public
  USING (is_biz_member(business_id))
  WITH CHECK (is_biz_member(business_id));

CREATE POLICY social_posts_business_member ON public.social_posts AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY subscriber_lists_delete ON public.subscriber_lists AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = subscriber_lists.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY subscriber_lists_insert ON public.subscriber_lists AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY subscriber_lists_select ON public.subscriber_lists AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY subscriber_lists_update ON public.subscriber_lists AS PERMISSIVE FOR UPDATE TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY subscription_plans_public_read ON public.subscription_plans AS PERMISSIVE FOR SELECT TO public
  USING (((status)::text = 'active'::text));

CREATE POLICY subscriptions_all ON public.subscriptions AS PERMISSIVE FOR ALL TO authenticated
  USING (user_is_member(business_id))
  WITH CHECK (user_is_member(business_id));

CREATE POLICY subscriptions_business_member ON public.subscriptions AS PERMISSIVE FOR SELECT TO public
  USING (is_business_member(business_id));

CREATE POLICY support_ticket_messages_member ON public.support_ticket_messages AS PERMISSIVE FOR ALL TO public
  USING (((sender_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM support_tickets st
  WHERE ((st.id = support_ticket_messages.ticket_id) AND is_business_member(st.business_id))))));

CREATE POLICY ticket_messages_all ON public.support_ticket_messages AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM support_tickets st
  WHERE ((st.id = support_ticket_messages.ticket_id) AND is_biz_member(st.business_id)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM support_tickets st
  WHERE ((st.id = support_ticket_messages.ticket_id) AND is_biz_member(st.business_id)))));

CREATE POLICY support_tickets_all ON public.support_tickets AS PERMISSIVE FOR ALL TO authenticated
  USING (user_is_member(business_id))
  WITH CHECK (user_is_member(business_id));

CREATE POLICY support_tickets_business_member ON public.support_tickets AS PERMISSIVE FOR ALL TO public
  USING ((is_business_member(business_id) OR (created_by = auth.uid())));

CREATE POLICY tags_business_member ON public.tags AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY tasks_all ON public.tasks AS PERMISSIVE FOR ALL TO authenticated
  USING (user_is_member(business_id))
  WITH CHECK (user_is_member(business_id));

CREATE POLICY tasks_business_member ON public.tasks AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY team_members_all ON public.team_members AS PERMISSIVE FOR ALL TO authenticated
  USING (user_is_member(business_id))
  WITH CHECK (user_is_member(business_id));

CREATE POLICY team_members_business_member ON public.team_members AS PERMISSIVE FOR ALL TO public
  USING ((is_business_member(business_id) OR (user_id = auth.uid())));

CREATE POLICY templates_read ON public.templates AS PERMISSIVE FOR SELECT TO public
  USING (true);

CREATE POLICY templates_select ON public.templates AS PERMISSIVE FOR SELECT TO public
  USING (((is_active = true) OR is_platform_admin()));

CREATE POLICY transactions_insert_system ON public.transactions AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::text[]))))));

CREATE POLICY transactions_select ON public.transactions AS PERMISSIVE FOR SELECT TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::text[]))))));

CREATE POLICY transcripts_all ON public.transcripts AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM videos v
  WHERE ((v.id = transcripts.video_id) AND is_biz_member(v.business_id)))));

CREATE POLICY transcripts_via_video ON public.transcripts AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM videos v
  WHERE ((v.id = transcripts.video_id) AND is_business_member(v.business_id)))));

CREATE POLICY usage_metrics_select ON public.usage_metrics AS PERMISSIVE FOR SELECT TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text)))));

CREATE POLICY usage_quotas_business ON public.usage_quotas AS PERMISSIVE FOR SELECT TO public
  USING (is_business_member(business_id));

CREATE POLICY user_profiles_own ON public.user_profiles AS PERMISSIVE FOR ALL TO public
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

CREATE POLICY role_assignments_delete ON public.user_role_assignments AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = user_role_assignments.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY role_assignments_insert ON public.user_role_assignments AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = user_role_assignments.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE POLICY role_assignments_select ON public.user_role_assignments AS PERMISSIVE FOR SELECT TO public
  USING (((user_id = auth.uid()) OR is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY user_sessions_delete ON public.user_sessions AS PERMISSIVE FOR DELETE TO public
  USING (((user_id = auth.uid()) OR is_platform_admin()));

CREATE POLICY user_sessions_insert ON public.user_sessions AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY user_sessions_select ON public.user_sessions AS PERMISSIVE FOR SELECT TO public
  USING (((user_id = auth.uid()) OR ((business_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = user_sessions.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role])))))) OR is_platform_admin()));

CREATE POLICY user_sessions_update ON public.user_sessions AS PERMISSIVE FOR UPDATE TO public
  USING (((user_id = auth.uid()) OR is_platform_admin()));

CREATE POLICY video_clips_delete ON public.video_clips AS PERMISSIVE FOR DELETE TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = ANY ((ARRAY['admin'::character varying, 'editor'::character varying])::text[]))))));

CREATE POLICY video_clips_insert ON public.video_clips AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text) AND ((bu.role)::text = ANY ((ARRAY['admin'::character varying, 'editor'::character varying, 'manager'::character varying])::text[]))))));

CREATE POLICY video_clips_select ON public.video_clips AS PERMISSIVE FOR SELECT TO public
  USING ((business_id IN ( SELECT bu.business_id
   FROM business_users bu
  WHERE ((bu.user_id = auth.uid()) AND ((bu.status)::text = 'active'::text)))));

CREATE POLICY videos_all ON public.videos AS PERMISSIVE FOR ALL TO public
  USING (is_biz_member(business_id))
  WITH CHECK (is_biz_member(business_id));

CREATE POLICY videos_business_member ON public.videos AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY web_pages_business_member ON public.web_pages AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY webhook_logs_business ON public.webhook_logs AS PERMISSIVE FOR SELECT TO public
  USING (is_business_member(business_id));

CREATE POLICY webhooks_business ON public.webhooks AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY website_analytics_insert ON public.website_analytics AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY website_analytics_select ON public.website_analytics AS PERMISSIVE FOR SELECT TO public
  USING (is_business_member(business_id));

CREATE POLICY websites_business_member ON public.websites AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY workflow_executions_business_member ON public.workflow_executions AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY workflow_step_logs_via_execution ON public.workflow_step_logs AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM workflow_executions we
  WHERE ((we.id = workflow_step_logs.execution_id) AND is_business_member(we.business_id)))));

CREATE POLICY workflows_business_member ON public.workflows AS PERMISSIVE FOR ALL TO public
  USING (is_business_member(business_id));

CREATE POLICY workspace_members_delete ON public.workspace_members AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = workspace_members.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR (user_id = auth.uid())));

CREATE POLICY workspace_members_insert ON public.workspace_members AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = workspace_members.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))));

CREATE POLICY workspace_members_select ON public.workspace_members AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY workspace_members_update ON public.workspace_members AS PERMISSIVE FOR UPDATE TO public
  USING (((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = workspace_members.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR (user_id = auth.uid())));

CREATE POLICY workspace_delete ON public.workspaces AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = workspaces.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = 'owner'::business_role)))) OR is_platform_admin()));

CREATE POLICY workspace_insert ON public.workspaces AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_business_member(business_id));

CREATE POLICY workspace_select ON public.workspaces AS PERMISSIVE FOR SELECT TO public
  USING ((is_business_member(business_id) OR is_platform_admin()));

CREATE POLICY workspace_update ON public.workspaces AS PERMISSIVE FOR UPDATE TO public
  USING (((EXISTS ( SELECT 1
   FROM business_members
  WHERE ((business_members.business_id = workspaces.business_id) AND (business_members.user_id = auth.uid()) AND (business_members.role = ANY (ARRAY['owner'::business_role, 'admin'::business_role]))))) OR is_platform_admin()));

CREATE TRIGGER handle_business_members_changes_trigger BEFORE UPDATE ON public.business_members FOR EACH ROW EXECUTE FUNCTION handle_business_members_changes();

CREATE TRIGGER handle_business_upsert_trigger BEFORE INSERT OR UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION handle_business_upsert();

CREATE TRIGGER on_business_created AFTER INSERT ON public.businesses FOR EACH ROW EXECUTE FUNCTION handle_new_business();

CREATE TRIGGER tr_client_revenue AFTER UPDATE ON public.client_invoices FOR EACH ROW EXECUTE FUNCTION update_client_revenue();

CREATE TRIGGER tr_funnel_to_contact AFTER INSERT ON public.funnel_submissions FOR EACH ROW EXECUTE FUNCTION funnel_submission_to_contact();

CREATE TRIGGER tr_order_number BEFORE INSERT ON public.marketplace_orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

CREATE TRIGGER tr_track_ai_usage AFTER INSERT ON public.ai_logs FOR EACH ROW EXECUTE FUNCTION track_ai_usage();

CREATE TRIGGER tr_updated_at_ai_tool_configs BEFORE UPDATE ON public.ai_tool_configs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_api_keys BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_content_calendar BEFORE UPDATE ON public.content_calendar FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_forms BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_integrations BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_invitations BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_knowledge_base BEFORE UPDATE ON public.knowledge_base FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_marketplace_orders BEFORE UPDATE ON public.marketplace_orders FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_onboarding_progress BEFORE UPDATE ON public.onboarding_progress FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_payment_transactions BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_payout_requests BEFORE UPDATE ON public.payout_requests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_platform_settings BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_referral_programs BEFORE UPDATE ON public.referral_programs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_referrals BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_usage_quotas BEFORE UPDATE ON public.usage_quotas FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tr_updated_at_webhooks BEFORE UPDATE ON public.webhooks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_ai_memory_updated_at BEFORE UPDATE ON public.ai_memory FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_business_users_updated_at BEFORE UPDATE ON public.business_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_client_invoices_updated_at BEFORE UPDATE ON public.client_invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_components_updated_at BEFORE UPDATE ON public.components FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_contacts_audit AFTER INSERT OR DELETE OR UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION trg_audit_contacts();

CREATE TRIGGER trg_conversation_last_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

CREATE TRIGGER trg_deals_audit AFTER INSERT OR UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION trg_audit_deals();

CREATE TRIGGER trg_interactions_updated_at BEFORE UPDATE ON public.interactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_invoice_items_total AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION recalculate_invoice_total();

CREATE TRIGGER trg_invoice_number BEFORE INSERT ON public.client_invoices FOR EACH ROW WHEN (((new.invoice_number IS NULL) OR (new.invoice_number = ''::text))) EXECUTE FUNCTION generate_invoice_number();

CREATE TRIGGER trg_list_contact_count AFTER INSERT OR DELETE ON public.list_contacts FOR EACH ROW EXECUTE FUNCTION update_subscriber_list_count();

CREATE TRIGGER trg_new_business_workspace AFTER INSERT ON public.businesses FOR EACH ROW EXECUTE FUNCTION handle_new_business_workspace();

CREATE TRIGGER trg_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.email_sequences FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.email_sequence_steps FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.subscriber_lists FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.discount_codes FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.permission_roles FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.plan_addons FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.business_addons FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.ab_tests FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_social_accounts_updated_at BEFORE UPDATE ON public.social_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_social_posts_updated_at BEFORE UPDATE ON public.social_posts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_subscription_plans_updated BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sync_business_users AFTER INSERT OR DELETE OR UPDATE ON public.business_members FOR EACH ROW EXECUTE FUNCTION sync_business_users_from_members();

CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_usage_metrics_updated_at BEFORE UPDATE ON public.usage_metrics FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_video_clips_updated_at BEFORE UPDATE ON public.video_clips FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE VIEW public.my_businesses AS  SELECT b.id,
    b.name,
    b.type,
    b.industry,
    b.owner_id,
    b.description,
    b.website,
    b.address,
    b.settings,
    b.is_active,
    b.created_at,
    b.updated_at,
    b.country,
    b.currency,
    b.user_id,
    b.created_by,
    b.business_name,
    b.slug,
    b.status,
    bm.role AS my_role,
    bm.is_active AS my_membership_active
   FROM businesses b
     JOIN business_members bm ON bm.business_id = b.id
  WHERE bm.user_id = auth.uid();
