-- OGMJ BRANDS — Complete Database Schema (Phase 1 MVP)
-- Last Updated: April 17, 2026
-- ================================
-- ENABLE EXTENSIONS
-- ================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgtrgm";
-- ================================
-- 1. BUSINESSES & TEAMS
-- ================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255),
  custom_domain VARCHAR(255),
  logo_url TEXT,
  brand_color VARCHAR(7) DEFAULT '#D4AF37',
  currency VARCHAR(3) DEFAULT 'NGN',
  timezone VARCHAR(50) DEFAULT 'UTC',
  country VARCHAR(2),
  industry VARCHAR(100),
  team_size INT,
  phone VARCHAR(20),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_created_by ON businesses(created_by);
CREATE INDEX idx_businesses_created_at ON businesses(created_at DESC);
-- ================================
CREATE TABLE IF NOT EXISTS business_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  -- admin, editor, viewer, manager
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP,
  invited_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'active',
  -- pending, active, inactive
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);
CREATE INDEX idx_business_users_business_id ON business_users(business_id);
CREATE INDEX idx_business_users_user_id ON business_users(user_id);
CREATE INDEX idx_business_users_status ON business_users(status);
-- ================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  redeemed_at TIMESTAMP,
  redeemed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);
CREATE INDEX idx_invitations_business_id ON invitations(business_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
-- ================================
-- 2. AUDIT & SECURITY
-- ================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_business_id ON audit_logs(business_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
-- ================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  prefix VARCHAR(20) NOT NULL,
  environment VARCHAR(20) DEFAULT 'development',
  permissions JSONB NOT NULL DEFAULT '{}',
  rate_limit INT DEFAULT 1000,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);
CREATE INDEX idx_api_keys_business_id ON api_keys(business_id);
-- ================================
-- 3. CRM MODULE
-- ================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(255),
  job_title VARCHAR(100),
  lead_score INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'lead',
  source VARCHAR(100),
  last_contact_at TIMESTAMP,
  next_followup_at TIMESTAMP,
  tags TEXT [] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_contacts_business_id ON contacts(business_id);
CREATE INDEX idx_contacts_email ON contacts(business_id, email);
CREATE INDEX idx_contacts_status ON contacts(business_id, status);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
-- ================================
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  value DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  status VARCHAR(50) DEFAULT 'open',
  stage VARCHAR(50) DEFAULT 'prospecting',
  probability INT DEFAULT 0,
  expected_close_date DATE,
  closed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_deals_business_id ON deals(business_id);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_status ON deals(business_id, status);
CREATE INDEX idx_deals_value ON deals(value DESC);
-- ================================
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE
  SET NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    body TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX idx_interactions_business_id ON interactions(business_id);
CREATE INDEX idx_interactions_created_at ON interactions(created_at DESC);
-- ================================
-- 4. BUILDER MODULE
-- ================================
CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  domain VARCHAR(255) UNIQUE,
  custom_domain VARCHAR(255) UNIQUE,
  ssl_certificate TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  template_id VARCHAR(100),
  seo_title VARCHAR(255),
  seo_description TEXT,
  analytics_id VARCHAR(100),
  favicon_url TEXT,
  metadata JSONB DEFAULT '{}',
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_websites_business_id ON websites(business_id);
CREATE INDEX idx_websites_slug ON websites(business_id, slug);
-- ================================
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  path VARCHAR(255),
  layout_id VARCHAR(100),
  sections JSONB NOT NULL DEFAULT '[]',
  meta_title VARCHAR(255),
  meta_description TEXT,
  og_image VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_pages_website_id ON pages(website_id);
CREATE INDEX idx_pages_slug ON pages(website_id, slug);
-- ================================
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  props JSONB NOT NULL DEFAULT '{}',
  styles JSONB NOT NULL DEFAULT '{}',
  code TEXT,
  thumbnail_url TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  visibility VARCHAR(20) DEFAULT 'private',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_components_business_id ON components(business_id);
-- ================================
-- 5. PAYMENTS MODULE
-- ================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  billing_period VARCHAR(20) DEFAULT 'monthly',
  features JSONB NOT NULL DEFAULT '[]',
  max_users INT DEFAULT 5,
  max_contacts INT DEFAULT 1000,
  max_websites INT,
  max_storage_gb INT DEFAULT 50,
  ai_tokens_monthly INT DEFAULT 100000,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- ================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50) DEFAULT 'active',
  currency VARCHAR(3) DEFAULT 'NGN',
  amount DECIMAL(10, 2) NOT NULL,
  billing_period VARCHAR(20) DEFAULT 'monthly',
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  cancel_at DATE,
  cancelled_at TIMESTAMP,
  payment_method VARCHAR(50),
  reference_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_business_id ON subscriptions(business_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_payment_method ON subscriptions(payment_method);
-- ================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  status VARCHAR(50) DEFAULT 'pending',
  payment_provider VARCHAR(50),
  provider_reference VARCHAR(255),
  invoice_number VARCHAR(50),
  invoice_url TEXT,
  receipt_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_transactions_business_id ON transactions(business_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
-- ================================
-- 6. VIDEO MODULE
-- ================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  source_url TEXT,
  source_type VARCHAR(50),
  file_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INT,
  file_size_bytes BIGINT,
  status VARCHAR(50) DEFAULT 'processing',
  transcription TEXT,
  transcript_status VARCHAR(50) DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_videos_business_id ON videos(business_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
-- ================================
CREATE TABLE IF NOT EXISTS video_clips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  start_time_seconds INT NOT NULL,
  end_time_seconds INT NOT NULL,
  duration_seconds INT GENERATED ALWAYS AS (end_time_seconds - start_time_seconds) STORED,
  aspect_ratio VARCHAR(10) DEFAULT '16:9',
  file_url TEXT,
  thumbnail_url TEXT,
  has_captions BOOLEAN DEFAULT FALSE,
  caption_file_url TEXT,
  highlighted_keywords TEXT [],
  viral_score DECIMAL(3, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_video_clips_video_id ON video_clips(video_id);
CREATE INDEX idx_video_clips_business_id ON video_clips(business_id);
-- ================================
-- 7. ANALYTICS MODULE
-- ================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  website_id UUID REFERENCES websites(id) ON DELETE
  SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_name VARCHAR(255),
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    properties JSONB DEFAULT '{}',
    url VARCHAR(2048),
    referrer VARCHAR(2048),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    ip_address INET,
    country VARCHAR(2),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_events_business_id ON events(business_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
-- ================================
CREATE TABLE IF NOT EXISTS funnel_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  website_id UUID REFERENCES websites(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INT NOT NULL,
  event_conditions JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_funnel_steps_website_id ON funnel_steps(website_id);
-- ================================
-- 8. SUPPORT MODULE
-- ================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  category VARCHAR(100),
  channel VARCHAR(50) DEFAULT 'web',
  assigned_to UUID REFERENCES auth.users(id),
  resolve_sla TIMESTAMP,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_support_tickets_business_id ON support_tickets(business_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
-- ================================
CREATE TABLE IF NOT EXISTS ticket_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]',
  ai_suggested_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_ticket_replies_ticket_id ON ticket_replies(ticket_id);
-- ================================
-- 9. AI MEMORY SYSTEM
-- ================================
CREATE TABLE IF NOT EXISTS ai_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  priority INT DEFAULT 0,
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(business_id, category, key)
);
CREATE INDEX idx_ai_memory_business_id ON ai_memory(business_id);
CREATE INDEX idx_ai_memory_category ON ai_memory(business_id, category);
-- ================================
CREATE TABLE IF NOT EXISTS ai_execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  agent_type VARCHAR(100) NOT NULL,
  prompt TEXT,
  output TEXT,
  status VARCHAR(50) DEFAULT 'completed',
  tokens_used INT,
  cost DECIMAL(10, 4),
  execution_time_ms INT,
  approved BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_ai_execution_logs_business_id ON ai_execution_logs(business_id);
CREATE INDEX idx_ai_execution_logs_agent_type ON ai_execution_logs(agent_type);
-- ================================
-- 10. RATE LIMITING & QUOTAS
-- ================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  count INT DEFAULT 0,
  window_start TIMESTAMP DEFAULT NOW(),
  window_end TIMESTAMP DEFAULT (NOW() + INTERVAL '1 hour'),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, endpoint, window_start)
);
CREATE INDEX idx_rate_limits_business_id_endpoint ON rate_limits(business_id, endpoint);
-- ================================
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL,
  -- contacts_count, websites_count, videos_count, storage_used, api_calls
  value INT,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_usage_metrics_business_id ON usage_metrics(business_id, metric_type);
-- ================================
-- UTILITIES & HELPERS
-- ================================
-- Helper: Get user's businesses
CREATE OR REPLACE FUNCTION get_user_businesses(user_id UUID) RETURNS TABLE(business_id UUID, role VARCHAR) AS $$ BEGIN RETURN QUERY
SELECT business_users.business_id,
  business_users.role
FROM business_users
WHERE business_users.user_id = $1
  AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Helper: Check user has business access
CREATE OR REPLACE FUNCTION user_has_business_access(
    p_business_id UUID,
    p_user_id UUID,
    p_min_role VARCHAR DEFAULT 'viewer'
  ) RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
    SELECT 1
    FROM business_users
    WHERE business_id = p_business_id
      AND user_id = p_user_id
      AND status = 'active'
      AND (
        CASE
          p_min_role
          WHEN 'admin' THEN role = 'admin'
          WHEN 'editor' THEN role IN ('admin', 'editor', 'manager')
          WHEN 'manager' THEN role IN ('admin', 'editor', 'manager')
          ELSE TRUE
        END
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ================================
-- STORAGE BUCKETS
-- ================================
-- Create storage buckets (via Supabase UI or API)
-- - businesses-logos
-- - website-assets
-- - videos
-- - video-clips
-- - invoices
-- - attachments
-- Set public access for public website assets
-- ALTER TABLE storage.objects SET PUBLIC WHERE bucket_id = 'website-assets' AND name LIKE 'public/%';