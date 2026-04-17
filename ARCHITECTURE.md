# OGMJ BRANDS — Complete SaaS Architecture & Specification

**Build Status**: Phase 1 MVP (Production-Ready)  
**Last Updated**: April 17, 2026  
**Platform Version**: 1.0.0

---

## 📋 EXECUTIVE OVERVIEW

OGMJ BRANDS is a **global, multi-tenant, AI-powered business growth operating system** where users manage their entire business from one unified platform.

### Core Value Proposition
- **Self-service automation** without manual dependencies
- **AI-driven growth** with intelligent agents
- **Multi-tenant isolation** with enterprise security
- **Modular architecture** for independent feature scaling
- **Global payments** (Paystack + Flutterwave)
- **Production-grade** from day one

### MVP Scope (Phase 1)
- ✅ Multi-tenant auth & workspace management
- ✅ Dashboard & command center
- ✅ Website/app builder (AI-assisted)
- ✅ CRM system
- ✅ Payments (subscriptions + one-time)
- ✅ Video transcription + clipping
- ✅ Basic analytics
- ✅ Support ticketing
- ✅ Rate limiting & audit logs

### Success Metrics
- **Deployment Time**: <2 minutes
- **TTFB**: <200ms
- **Mobile-first**: 100% responsive
- **RLS-enforced**: 0 data leakage
- **99.9% uptime** target

---

## 🏗 ARCHITECTURE LAYERS & FLOW

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                      │
│  Next.js (App Router) │ React 19 │ TypeScript        │
│  Tailwind │ Framer Motion │ shadcn/ui              │
└────────────────────┬──────────────────────────────────┘
                     │ API/GraphQL (tRPC)
┌────────────────────▼──────────────────────────────────┐
│              API & ORCHESTRATION LAYER                │
│  Next.js API Routes │ tRPC │ Edge Functions           │
│  Rate Limiting │ Auth Guards │ Logging                │
└────────────────────┬──────────────────────────────────┘
                     │ SQL
┌────────────────────▼──────────────────────────────────┐
│           DATA & AI SERVICE LAYER                     │
│  Supabase (Auth, Postgres, Storage, Functions)        │
│  RLS Enforcement │ RBAC Policies │ AI Memory          │
├────────────────────────────────────────────────────────┤
│ Postgres │ Auth │ Storage │ Edge Functions │ Realtime │
└────────────────────┬──────────────────────────────────┘
                     │ External Services
┌────────────────────▼──────────────────────────────────┐
│            EXTERNAL INTEGRATION LAYER                 │
│  OpenAI │ Whisper │ Paystack │ Flutterwave          │
│  Meta API │ YouTube API │ GitHub Actions │ Sentry    │
└─────────────────────────────────────────────────────────┘
```

### Core Service Flow (System Operation)

```
USER INPUT
    ↓
[Auth Check] → [RLS Verification] → [Rate Limit Check]
    ↓
[Business Logic Layer]
    ├─ Workspace Service
    ├─ CRM Service
    ├─ Builder Service
    ├─ Video Service
    ├─ AI Agents Service
    ├─ Automation Service
    ├─ Analytics Service
    └─ Payments Service
    ↓
[Database Operations]
    ├─ Insert/Update/Delete (with audit log)
    ├─ RLS Row-Level Security Check
    └─ Trigger Business Rules
    ↓
[Response] → [Logging] → [Cache Invalidation]
```

---

## 🗄 DATABASE SCHEMA (PHASE 1 MVP)

### Core Schema Architecture
- **Every table has `business_id`** (multi-tenant isolation)
- **Every table has `created_at`, `updated_at`** (audit trail)
- **Sensitive tables have `created_by`, `updated_by`** (user tracking)
- **All tables use UUIDs** (primary keys)

### 1. Identity & Access Tables

#### `users` (Managed by Supabase Auth)
```sql
-- Supabase Auth integration
-- Auth UID becomes user reference
-- Email + password + OAuth (Google, GitHub)
```

#### `businesses`
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255),
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

CREATE INDEX idx_businesses_created_by ON businesses(created_by);
CREATE INDEX idx_businesses_slug ON businesses(slug);
```

#### `business_users` (Team Members)
```sql
CREATE TABLE business_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  -- Roles: admin, editor, viewer, manager
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP,
  invited_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'active',
  -- Status: pending, active, inactive
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

CREATE INDEX idx_business_users_business_id ON business_users(business_id);
CREATE INDEX idx_business_users_user_id ON business_users(user_id);
```

#### `invitations`
```sql
CREATE TABLE invitations (
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
```

### 2. Core Platform Tables

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  -- CREATE, UPDATE, DELETE, LOGIN, EXPORT, etc.
  resource_type VARCHAR(100) NOT NULL,
  -- Table name or resource
  resource_id UUID,
  changes JSONB,
  -- Before/after values for updates
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_business_id ON audit_logs(business_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

#### `api_keys` (For external integrations)
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  prefix VARCHAR(20) NOT NULL,
  -- For display: "sk_live_xxx"
  environment VARCHAR(20) DEFAULT 'development',
  -- development, production
  permissions JSONB NOT NULL DEFAULT '{}',
  rate_limit INT DEFAULT 1000,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_api_keys_business_id ON api_keys(business_id);
```

### 3. CRM Module Tables

#### `contacts`
```sql
CREATE TABLE contacts (
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
  -- lead, prospect, customer, inactive, archived
  source VARCHAR(100),
  -- website, referral, email, social, api, manual
  last_contact_at TIMESTAMP,
  next_followup_at TIMESTAMP,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_contacts_business_id ON contacts(business_id);
CREATE INDEX idx_contacts_email ON contacts(business_id, email);
CREATE INDEX idx_contacts_status ON contacts(business_id, status);
```

#### `deals`
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  value DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  status VARCHAR(50) DEFAULT 'open',
  -- open, in_progress, won, lost
  stage VARCHAR(50) DEFAULT 'prospecting',
  -- prospecting, qualification, proposal, negotiation, decision
  probability INT DEFAULT 0,
  -- 0-100
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
```

#### `interactions`
```sql
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  -- email, call, meeting, note, task
  subject VARCHAR(255),
  body TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX idx_interactions_business_id ON interactions(business_id);
```

### 4. Builder Module Tables

#### `websites`
```sql
CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  domain VARCHAR(255) UNIQUE,
  custom_domain VARCHAR(255) UNIQUE,
  ssl_certificate TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  -- draft, published, archived
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
```

#### `pages`
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  path VARCHAR(255),
  layout_id VARCHAR(100),
  sections JSONB NOT NULL DEFAULT '[]',
  -- Array of component blocks
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
```

#### `components` (Reusable components)
```sql
CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  -- button, card, form, gallery, etc.
  props JSONB NOT NULL DEFAULT '{}',
  styles JSONB NOT NULL DEFAULT '{}',
  code TEXT,
  thumbnail_url TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  visibility VARCHAR(20) DEFAULT 'private',
  -- private, team, public
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_components_business_id ON components(business_id);
```

### 5. Payment Tables

#### `subscription_plans`
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  billing_period VARCHAR(20) DEFAULT 'monthly',
  -- monthly, yearly, one_time
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

CREATE INDEX idx_subscription_plans_status ON subscription_plans(status);
```

#### `subscriptions`
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50) DEFAULT 'active',
  -- active, paused, cancelled, expired
  currency VARCHAR(3) DEFAULT 'NGN',
  amount DECIMAL(10, 2) NOT NULL,
  billing_period VARCHAR(20) DEFAULT 'monthly',
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  cancel_at DATE,
  cancelled_at TIMESTAMP,
  payment_method VARCHAR(50),
  -- paystack, flutterwave
  reference_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_business_id ON subscriptions(business_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

#### `transactions`
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  type VARCHAR(50) NOT NULL,
  -- subscription_charge, one_time, refund
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  status VARCHAR(50) DEFAULT 'pending',
  -- pending, completed, failed, refunded
  payment_provider VARCHAR(50),
  -- paystack, flutterwave
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
```

### 6. Video Module Tables

#### `videos`
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  source_url TEXT,
  source_type VARCHAR(50),
  -- upload, url, youtube
  file_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INT,
  file_size_bytes BIGINT,
  status VARCHAR(50) DEFAULT 'processing',
  -- uploading, processing, ready, failed
  transcription TEXT,
  transcript_status VARCHAR(50) DEFAULT 'pending',
  -- pending, processing, ready, failed
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_videos_business_id ON videos(business_id);
CREATE INDEX idx_videos_status ON videos(status);
```

#### `video_clips`
```sql
CREATE TABLE video_clips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  start_time_seconds INT NOT NULL,
  end_time_seconds INT NOT NULL,
  duration_seconds INT GENERATED ALWAYS AS (end_time_seconds - start_time_seconds) STORED,
  aspect_ratio VARCHAR(10) DEFAULT '16:9',
  -- 16:9, 9:16, 1:1
  file_url TEXT,
  thumbnail_url TEXT,
  has_captions BOOLEAN DEFAULT FALSE,
  caption_file_url TEXT,
  highlighted_keywords TEXT[],
  viral_score DECIMAL(3, 2) DEFAULT 0,
  -- 0-1 scale
  status VARCHAR(50) DEFAULT 'pending',
  -- pending, processing, ready, failed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_video_clips_video_id ON video_clips(video_id);
CREATE INDEX idx_video_clips_business_id ON video_clips(business_id);
```

### 7. Analytics Tables

#### `events`
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  website_id UUID REFERENCES websites(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  -- page_view, click, form_submit, purchase, etc.
  event_name VARCHAR(255),
  user_id VARCHAR(255),
  -- Anonymous or authenticated
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
CREATE INDEX idx_events_website_id ON events(website_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
```

#### `funnel_steps`
```sql
CREATE TABLE funnel_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  website_id UUID REFERENCES websites(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INT NOT NULL,
  event_conditions JSONB NOT NULL,
  -- Array of event filters
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_funnel_steps_website_id ON funnel_steps(website_id);
```

### 8. Support System Tables

#### `support_tickets`
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  -- low, medium, high, urgent
  status VARCHAR(50) DEFAULT 'open',
  -- open, in_progress, waiting, resolved, closed
  category VARCHAR(100),
  channel VARCHAR(50) DEFAULT 'web',
  -- web, email, whatsapp, twitter
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
```

#### `ticket_replies`
```sql
CREATE TABLE ticket_replies (
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
```

### 9. AI Memory Tables

#### `ai_memory` (Brand & Business Context)
```sql
CREATE TABLE ai_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  -- brand_voice, audience, products, competitors, preferences, restrictions
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  priority INT DEFAULT 0,
  -- Higher = more important
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(business_id, category, key)
);

CREATE INDEX idx_ai_memory_business_id ON ai_memory(business_id);
CREATE INDEX idx_ai_memory_category ON ai_memory(business_id, category);
```

#### `ai_execution_logs` (Agent Results)
```sql
CREATE TABLE ai_execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  agent_type VARCHAR(100) NOT NULL,
  -- growth_strategy, content, seo, ads, crm_messaging, etc.
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
```

---

## 🔐 RLS & RBAC Model

### RLS Policies (PostgreSQL Row-Level Security)

All RLS policies follow this pattern:
1. **Auth Check**: Is user authenticated?
2. **Business Check**: Does user have access to this business?
3. **Role Check**: Does user's role allow this action?
4. **Row Check**: Is the row for this user's business?

#### Core RLS Policy Template
```sql
-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
-- ... (all tables)

-- Helper function: Check user business access
CREATE OR REPLACE FUNCTION auth.user_has_business_access(
  p_business_id UUID,
  p_min_role VARCHAR DEFAULT 'viewer'
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM business_users
    WHERE business_id = p_business_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND (
        CASE p_min_role
          WHEN 'admin' THEN role = 'admin'
          WHEN 'editor' THEN role IN ('admin', 'editor')
          WHEN 'manager' THEN role IN ('admin', 'editor', 'manager')
          ELSE TRUE
        END
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Get user's businesses
CREATE OR REPLACE FUNCTION auth.user_business_ids()
RETURNS TABLE(business_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT business_users.business_id
  FROM business_users
  WHERE user_id = auth.uid() AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### RLS Policy: businesses
```sql
-- Users can view businesses they're members of
CREATE POLICY "businesses_view_policy"
  ON businesses FOR SELECT
  USING (auth.user_has_business_access(id, 'viewer'));

-- Users can create businesses (they become admin)
CREATE POLICY "businesses_create_policy"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update their business
CREATE POLICY "businesses_update_policy"
  ON businesses FOR UPDATE
  USING (auth.user_has_business_access(id, 'admin'));

-- Admins can delete (with cascade)
CREATE POLICY "businesses_delete_policy"
  ON businesses FOR DELETE
  USING (auth.user_has_business_access(id, 'admin'));
```

#### RLS Policy: contacts
```sql
-- Users can see contacts for their businesses
CREATE POLICY "contacts_view_policy"
  ON contacts FOR SELECT
  USING (auth.user_has_business_access(business_id, 'viewer'));

-- Users can create contacts
CREATE POLICY "contacts_create_policy"
  ON contacts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.user_has_business_access(business_id, 'editor')
  );

-- Users can update their contacts
CREATE POLICY "contacts_update_policy"
  ON contacts FOR UPDATE
  USING (
    auth.user_has_business_access(business_id, 'editor')
  );

-- Editors can delete
CREATE POLICY "contacts_delete_policy"
  ON contacts FOR DELETE
  USING (
    auth.user_has_business_access(business_id, 'admin')
  );
```

### RBAC Roles & Permissions

```
ADMIN
├─ All CRUD operations
├─ User management (invite, remove, role change)
├─ Billing & subscription
├─ API keys
├─ Integrations
└─ Audit logs

EDITOR (Manager)
├─ Create/Edit/Delete content
├─ Create/Edit contacts & deals
├─ Create/Build websites
├─ Generate content & videos
├─ View analytics
├─ Cannot: invite users, manage billing, access settings

VIEWER
├─ View-only access
├─ View dashboard & analytics
├─ View contacts & deals (read-only)
├─ Cannot: Create/Edit/Delete anything
└─ Cannot: Generate content, create videos

MEMBER
├─ Same as EDITOR
└─ Default role for invited users
```

---

## 🔌 API MAP (Phase 1 MVP)

### Architecture: tRPC + Next.js API Routes

#### Authentication Endpoints
```
POST   /api/auth/signup              → Register new user
POST   /api/auth/login               → Email/password login
POST   /api/auth/oauth/callback      → OAuth redirect
POST   /api/auth/logout              → Clear session
POST   /api/auth/refresh             → Refresh token
GET    /api/auth/me                  → Current user profile
POST   /api/auth/verify-email        → Email verification
POST   /api/auth/forgot-password     → Reset password
POST   /api/auth/reset-password      → Confirm password reset
```

#### Workspace & Business Endpoints
```
POST   /api/businesses                → Create business
GET    /api/businesses                → List user's businesses
GET    /api/businesses/:id            → Get business details
PUT    /api/businesses/:id            → Update business
DELETE /api/businesses/:id            → Delete business
POST   /api/businesses/:id/invite     → Invite team member
GET    /api/businesses/:id/members    → List team members
PATCH  /api/businesses/:id/members/:uid  → Update member role
DELETE /api/businesses/:id/members/:uid  → Remove member
```

#### CRM Endpoints
```
POST   /api/contacts                  → Create contact
GET    /api/contacts                  → List contacts (paginated)
GET    /api/contacts/:id              → Get contact
PUT    /api/contacts/:id              → Update contact
DELETE /api/contacts/:id              → Delete contact
POST   /api/contacts/bulk-import      → Import CSV
GET    /api/contacts/:id/interactions → Get contact history
POST   /api/deals                     → Create deal
GET    /api/deals                     → List deals
PUT    /api/deals/:id                 → Update deal
```

#### Builder Endpoints
```
POST   /api/websites                  → Create website
GET    /api/websites                  → List websites
GET    /api/websites/:id              → Get website
PUT    /api/websites/:id              → Update website
DELETE /api/websites/:id              → Delete website
POST   /api/websites/:id/publish      → Publish website
POST   /api/pages                     → Create page
PUT    /api/pages/:id                 → Update page
DELETE /api/pages/:id                 → Delete page
POST   /api/components                → Create component
GET    /api/components                → List components
```

#### Payments Endpoints
```
GET    /api/payments/plans            → List subscription plans
POST   /api/payments/subscribe        → Create subscription
GET    /api/payments/subscription     → Get current subscription
POST   /api/payments/cancel           → Cancel subscription
POST   /api/payments/update-method    → Update payment method
GET    /api/payments/invoices         → List invoices
POST   /api/webhooks/paystack         → Paystack webhook
POST   /api/webhooks/flutterwave      → Flutterwave webhook
```

#### Video Endpoints
```
POST   /api/videos/upload             → Upload video
GET    /api/videos                    → List videos
GET    /api/videos/:id                → Get video details
DELETE /api/videos/:id                → Delete video
POST   /api/videos/:id/transcribe     → Start transcription
POST   /api/video-clips                → Create clip
GET    /api/video-clips/:id           → Get clip
DELETE /api/video-clips/:id           → Delete clip
```

#### Analytics Endpoints
```
GET    /api/analytics/dashboard       → Dashboard metrics
GET    /api/analytics/events          → Event data
GET    /api/analytics/funnel          → Funnel analysis
GET    /api/analytics/revenue         → Revenue metrics
POST   /api/events/track              → Track event (public)
```

#### Support Endpoints
```
POST   /api/tickets                   → Create support ticket
GET    /api/tickets                   → List tickets
GET    /api/tickets/:id               → Get ticket
PUT    /api/tickets/:id               → Update ticket
POST   /api/tickets/:id/reply         → Reply to ticket
GET    /api/tickets/:id/replies       → Get all replies
POST   /api/knowledge-base            → Create KB article
```

#### Admin Endpoints
```
GET    /api/admin/audit-logs          → View audit logs
GET    /api/admin/api-keys            → List API keys
POST   /api/admin/api-keys            → Create API key
DELETE /api/admin/api-keys/:id        → Delete API key
GET    /api/admin/rate-limits         → Check rate limits
```

---

## 🎨 UI ROUTES & PAGES

### App Structure

```
/app
├── (auth)
│   ├── login
│   ├── signup
│   ├── forgot-password
│   ├── reset-password/[token]
│   └── verify-email/[token]
├── (onboarding)
│   ├── welcome
│   ├── business-setup
│   ├── team-invite
│   └── payment-setup
├── (dashboard)
│   ├── dashboard
│   ├── layout.tsx
│   ├── crm
│   │   ├── contacts
│   │   ├── deals
│   │   └── interactions
│   ├── builder
│   │   ├── websites
│   │   ├── pages
│   │   └── [website_id]/editor
│   ├── videos
│   │   ├── library
│   │   ├── upload
│   │   └── [video_id]/clips
│   ├── analytics
│   │   ├── overview
│   │   ├── funnel
│   │   └── revenue
│   ├── support
│   │   ├── tickets
│   │   └── knowledge-base
│   ├── settings
│   │   ├── business
│   │   ├── team
│   │   ├── billing
│   │   └── api-keys
│   └── commands
│       ├── growth-strategy
│       ├── content
│       ├── seo
│       ├── ads
│       └── competitor-research
└── (public)
    ├── landing
    ├── pricing
    ├── docs
    └── [business]/preview
```

### Page Details

#### Authentication Pages
- **`/login`** - Email + OAuth login
- **`/signup`** - Registration
- **`/forgot-password`** - Password reset request
- **`/reset-password/[token]`** - Password confirmation
- **`/verify-email/[token]`** - Email verification

#### Onboarding Flow
- **`/onboarding/welcome`** - Welcome screen
- **`/onboarding/business-setup`** - Business details form
- **`/onboarding/team-invite`** - Invite team members
- **`/onboarding/payment-setup`** - Choose plan + payment method

#### Dashboard
- **`/dashboard`** - Main command center (analytics overview)

#### CRM Module
- **`/dashboard/crm/contacts`** - Contact list + table view
- **`/dashboard/crm/contacts/[id]`** - Contact detail + full interaction history
- **`/dashboard/crm/deals`** - Deals pipeline view
- **`/dashboard/crm/deals/[id]`** - Deal detail

#### Builder Module
- **`/dashboard/builder/websites`** - List websites
- **`/dashboard/builder/websites/[id]`** - Website settings
- **`/dashboard/builder/websites/[id]/pages`** - List pages
- **`/dashboard/builder/websites/[id]/editor`** - Visual page editor
- **`/dashboard/builder/components`** - Reusable components library

#### Video Module
- **`/dashboard/videos`** - Video library + list
- **`/dashboard/videos/upload`** - Upload or URL input
- **`/dashboard/videos/[id]`** - Video details + transcription
- **`/dashboard/videos/[id]/clips`** - Clips for video
- **`/dashboard/videos/[id]/editor`** - Clip editor interface

#### Analytics
- **`/dashboard/analytics`** - Dashboard overview
- **`/dashboard/analytics/events`** - Event detailed analysis
- **`/dashboard/analytics/funnel`** - Funnel visualization
- **`/dashboard/analytics/revenue`** - Revenue & subscription metrics

#### Support
- **`/dashboard/support/tickets`** - Support ticket list
- **`/dashboard/support/tickets/[id]`** - Ticket detail + conversation
- **`/dashboard/support/knowledge-base`** - Knowledge base articles

#### Settings
- **`/dashboard/settings`** - Settings hub
- **`/dashboard/settings/business`** - Business info + logo + domain
- **`/dashboard/settings/team`** - Team members + roles
- **`/dashboard/settings/billing`** - Subscription + invoices
- **`/dashboard/settings/api-keys`** - API key management

#### AI Commands
- **`/dashboard/commands`** - Command center hub
- **`/dashboard/commands/growth-strategy`** - Growth strategy agent
- **`/dashboard/commands/content`** - Content generation
- **`/dashboard/commands/seo`** - SEO analysis
- **`/dashboard/commands/ads`** - Ad copywriting
- **`/dashboard/commands/competitor-research`** - Competitor analysis

---

## 🧩 COMPONENT SYSTEM

### Dark Luxury Design System
- **Primary**: `#D4AF37` (Gold)
- **Dark**: `#07070A` (Almost black)
- **Surface**: `#0E1116` (Deep gray)
- **Text**: `#FFFFFF` (White)
- **Accent**: `#FF6B6B` (Red for CTAs)

### Core Components (shadcn/ui + Custom)

#### Layout
- `Layout` - Main wrapper
- `Sidebar` - Navigation sidebar
- `Header` - Top navigation
- `Footer` - Footer component
- `Container` - Content wrapper

#### Forms
- `Input` - Text input
- `TextArea` - Multi-line text
- `Select` - Dropdown
- `Checkbox` - Checkbox
- `Radio` - Radio button
- `Form` - Form container with validation
- `FormField` - Labeled form field
- `Button` - Primary/secondary buttons
- `DatePicker` - Date selection

#### Data Display
- `Table` - Data table
- `DataGrid` - Advanced table with sorting, filtering
- `Card` - Content card
- `Badge` - Status badge
- `Tag` - Removable tag
- `Tooltip` - Hover info
- `Dialog` - Modal dialog
- `Sheet` - Slide-out panel

#### Navigation
- `Tabs` - Tab navigation
- `Breadcrumb` - Breadcrumb trail
- `Pagination` - Page navigation
- `Stepper` - Multi-step form

#### Feedback
- `Toast` - Notification toast
- `Alert` - Alert message
- `ProgressBar` - Progress indicator
- `Skeleton` - Loading skeleton

#### Custom Business Components
- `ContactCard` - Contact display
- `DealCard` - Deal pipeline card
- `WebsitePreview` - Website preview
- `VideoClipPreview` - Video clip preview
- `EventTimeline` - Interaction timeline
- `FunnelChart` - Funnel visualization
- `RevenueChart` - Revenue chart
- `TicketPriority` - Priority indicator

### Framer Motion Animations
```typescript
// All animations use Spring physics for smoothness
const springConfig = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

// Standard animations:
- Fade In/Out
- Slide In/Out
- Scale In/Out
- Stagger List
- Hover Effects
```

---

## ⚙️ MODULE LOGIC (End-to-End)

### 1. Authentication Module

#### User Registration Flow
```
User Input (email, password, name)
    ↓
[Validation] - Email format, password strength
    ↓
[Check Duplicate] - Email already exists?
    ↓
[Create User] - Supabase Auth signup
    ↓
[Create Audit Log] - Log registration
    ↓
[Send Verification Email] - Link to verify
    ↓
[Return] - Session token + user profile
```

#### Implementation
```typescript
// lib/auth.ts
export async function signUp(email: string, password: string, name: string) {
  const { data: user, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) throw error;

  await recordAuditLog({
    action: "USER_SIGNUP",
    resource_type: "user",
    status: "success",
  });

  return { user, requiresEmailVerification: true };
}
```

### 2. Multi-Tenant Business Module

#### Business Creation Flow
```
User Creates Business
    ↓
[Validate Input] - Business name, industry, etc.
    ↓
[Generate Slug] - URL-safe slug
    ↓
[Insert Business] - Into `businesses` table
    ↓
[Add User as Admin] - Insert into `business_users`
    ↓
[Create Audit Log]
    ↓
[Initialize Default Data] - Empty CRM, settings
    ↓
[Return] - Business ID + access token
```

#### Implementation
```typescript
// app/actions/business.ts
export async function createBusiness(formData: CreateBusinessInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Create business
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      name: formData.name,
      slug: generateSlug(formData.name),
      industry: formData.industry,
      created_by: user!.id,
    })
    .select()
    .single();

  if (businessError) throw businessError;

  // Add creator as admin
  const { error: memberError } = await supabase
    .from("business_users")
    .insert({
      business_id: business.id,
      user_id: user!.id,
      role: "admin",
      status: "active",
      joined_at: new Date(),
    });

  if (memberError) throw memberError;

  // Audit log
  await recordAuditLog({
    business_id: business.id,
    action: "BUSINESS_CREATED",
    resource_type: "business",
    resource_id: business.id,
  });

  return business;
}
```

### 3. CRM Module

#### Contact Management Flow
```
Import/Create Contact
    ↓
[Validate Data] - Email, phone, etc.
    ↓
[Check Duplicate] - By email
    ↓
[Insert Contact] - Into `contacts` table
    ↓
[Assign Tags] - Auto-tagging if applicable
    ↓
[Trigger Webhooks] - Notify integrations
    ↓
[Log Action]
    ↓
[Return] - Contact with ID
```

#### Deal Tracking Flow
```
Deal Created/Updated
    ↓
[Validate Amount & Stage]
    ↓
[Update Deal] - Change status/probability
    ↓
[Calculate Pipeline Value]
    ↓
[Log Interaction]
    ↓
[Update Contact Lead Score]
    ↓
[Trigger Alerts] - If high-value deal
    ↓
[Emit Event] - For analytics
```

### 4. Builder Module

#### Page Creation Flow
```
User Creates Page
    ↓
[Select Template] - Or start blank
    ↓
[Initialize Sections] - Empty array or template sections
    ↓
[Insert Page Record]
    ↓
[Return Editor UI]
    ↓
[Editor: User Adds Components]
    ↓
[Component: Store in sections JSONB]
    ↓
[User Publishes]
    ↓
[Render Static HTML]
    ↓
[Deploy to Vercel]
    ↓
[Return Published URL]
```

#### Component Rendering
```typescript
// components/builder/SectionRenderer.tsx
export function SectionRenderer({ sections }: { sections: BuilderSection[] }) {
  return (
    <div>
      {sections.map((section) => {
        const ComponentToRender = componentMap[section.type];
        return (
          <ComponentToRender
            key={section.id}
            data={section.data}
            styles={section.styles}
          />
        );
      })}
    </div>
  );
}
```

### 5. Payments Module

#### Subscription Flow (Paystack)
```
User Selects Plan
    ↓
[Initialize Paystack Session]
    ↓
[Get Authorization URL]
    ↓
[Redirect to Paystack]
    ↓
[User Authorizes Payment]
    ↓
[Paystack Redirects Back]
    ↓
[Verify Transaction]
    ↓
[Create Subscription Record]
    ↓
[Set Access Limits]
    ↓
[Send Confirmation Email]
    ↓
[Complete]
```

#### Webhook Verification (Secure)
```typescript
// app/api/webhooks/paystack.ts
export async function POST(request: Request) {
  const body = await request.text();
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

  const headerHash = request.headers.get("x-paystack-signature");
  if (hash !== headerHash) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const reference = event.data.reference;
    await updateSubscription(reference, "active");
  }

  return new Response("OK", { status: 200 });
}
```

### 6. Video Module

#### Video Upload & Processing
```
User Uploads Video
    ↓
[Validate File] - Size, format (mp4, webm)
    ↓
[Upload to Storage] - Supabase Storage
    ↓
[Create Video Record] - status: "processing"
    ↓
[Trigger Edge Function]
    ↓
[Edge Function: Generate Thumbnail]
    ↓
[Transcribe with Whisper] - OpenAI API
    ↓
[Store Transcription]
    ↓
[Detect Viral Moments] - AI analysis
    ↓
[Update status to "ready"]
    ↓
[Emit notification]
```

#### Clip Creation & Export
```
User Creates Clip (Start: 15s, End: 45s)
    ↓
[Validate Duration] - 15-60 seconds
    ↓
[Queue FFmpeg Job]
    ↓
[FFmpeg: Extract Segment]
    ↓
[FFmpeg: Apply Aspect Ratio] - 9:16 for short-form
    ↓
[FFmpeg: Add Captions] - Auto from transcript
    ↓
[FFmpeg: Add Branding] - Logo overlay
    ↓
[Upload Clip] - Back to Storage
    ↓
[Calculate Viral Score] - Keywords, duration
    ↓
[Return Clip URL + Preview]
```

---

## 🔄 AUTOMATION WORKFLOW ENGINE

### Workflow Triggers

```
TRIGGERS:
1. Lead Created
   - New contact added
   - Condition: lead_score >= 50

2. Payment Success
   - Subscription confirmed
   - Condition: amount >= threshold

3. Video Uploaded
   - New video in library
   - Condition: duration >= 60sec

4. Scheduled Time
   - Cron: every Monday 9am
   - Timezone: business timezone

5. Webhook Event
   - External system POST
   - Condition: event type matches
```

### Workflow Actions

```
ACTIONS:
1. Send Email
   - Template selection
   - Variable substitution: {{contact.name}}

2. Send WhatsApp
   - Twilio integration
   - Message template

3. Create Task
   - For team member
   - Due date, priority

4. Generate Content
   - AI Agent
   - Template + context

5. Generate Video Clip
   - From uploaded video
   - Parameters: aspect_ratio, duration

6. Schedule Post
   - Social media post
   - Platform: Meta, YouTube, Twitter

7. Update CRM
   - Change deal stage
   - Update contact field
```

### Workflow Execution Logic

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  -- Array of action objects
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id),
  business_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  -- pending, running, completed, failed
  execution_data JSONB,
  errors JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Workflow Trigger Handler

```typescript
// Edge Function: Handle workflow triggers
export async function handleWorkflowTrigger(
  businessId: string,
  triggerType: string,
  triggerData: any
) {
  const workflows = await getWorkflowsByTrigger(businessId, triggerType);

  for (const workflow of workflows) {
    if (evaluateConditions(workflow.trigger_conditions, triggerData)) {
      await executeWorkflow(workflow, triggerData);
    }
  }
}

async function executeWorkflow(workflow: Workflow, triggerData: any) {
  const execution = await createExecution(workflow.id);

  try {
    for (const action of workflow.actions) {
      await executeAction(action, triggerData);
    }
    await updateExecution(execution.id, "completed");
  } catch (error) {
    await updateExecution(execution.id, "failed", { error: error.message });
  }
}
```

---

## 🎬 VIDEO PIPELINE ARCHITECTURE

### Tech Stack
- **Upload**: Supabase Storage
- **Transcoding**: FFmpeg (Edge Function)
- **Transcription**: OpenAI Whisper
- **Face Tracking**: Python ML model (optional)
- **Captions**: Auto-generated + manual
- **Export**: Multi-format (mp4, webm, gif)

### Processing Pipeline

```
┌─────────────────────────────────────────┐
│      Video Uploaded (User)              │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Store in Storage   │
        │  Update DB: pending │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────────┐
        │  Trigger Edge Function      │
        │  (async background job)     │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼────────────┐
        │  Generate Thumbnail   │
        │  (First frame or @5s) │
        └──────────┬────────────┘
                   │
        ┌──────────▼──────────────┐
        │  Transcribe (Whisper)   │
        │  Extract timing + words │
        └──────────┬──────────────┘
                   │
        ┌──────────▼─────────────────────┐
        │  AI Analysis (Viral Detection) │
        │  Keyword extraction            │
        │  Emotion analysis              │
        └──────────┬─────────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │  Store Results              │
        │  Update video record: ready │
        └──────────┬──────────────────┘
                   │
              [Complete]
```

### Clip Generation with FFmpeg

```bash
# Extract segment with branding + captions
ffmpeg \
  -i input_video.mp4 \
  -ss 15 -to 45 \
  -c:v libx264 \
  -c:a aac \
  -filter_complex \
  "scale=1080:1920,
   drawtext=text='${BRAND_TEXT}':fontsize=30:fontcolor=white:x=10:y=10,
   subtitles=captions.vtt:force_style='FontSize=20'" \
  -y output_clip.mp4
```

### Viral Scoring Algorithm

```typescript
function calculateViralScore(video: VideoData): number {
  let score = 0;

  // Duration impact (shorter = more viral)
  if (video.duration_seconds < 30) score += 0.3;
  else if (video.duration_seconds < 60) score += 0.2;
  else score += 0.1;

  // Keyword prominence
  const highValueKeywords = video.keywords.filter(k => k.value > 0.8);
  score += Math.min(highValueKeywords.length * 0.2, 0.3);

  // Emotional resonance (from transcript)
  const emotionScore = analyzeEmotion(video.transcript);
  score += emotionScore * 0.2;

  // Historical performance (if exists)
  if (video.previous_viral_ratio > 0.7) {
    score += 0.2;
  }

  return Math.min(score, 1);
}
```

---

## 💳 PAYMENTS SYSTEM (Paystack + Flutterwave)

### Payment Methods Comparison

| Feature | Paystack | Flutterwave |
|---------|----------|-------------|
| Supported Countries | 30+ | 40+ |
| Currencies | NGN, GHS, ZAR, USD, EUR | NGN, GHS, USD, EUR, GBP, XOF |
| Settlement | Direct | Direct |
| Fees | ~1.5% + ₦100 | ~1.4% + ₦50 |
| Webhooks | ✅ | ✅ |
| Recurring | ✅ | ✅ |
| 3D Secure | ✅ | ✅ |

### Implementation Strategy
- **Primary**: Paystack (cheaper, simpler)
- **Fallback**: Flutterwave (more geo coverage)
- **User Choice**: Let customers select at checkout

### Subscription Flow (Paystack)

```typescript
// 1. Initialize Payment
export async function initializePayment(
  businessId: string,
  planId: string,
  email: string
) {
  const plan = await getPlan(planId);

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
    body: JSON.stringify({
      amount: Math.round(plan.price * 100), // Convert to kobo
      email,
      reference: `SUB_${businessId}_${Date.now()}`,
      metadata: { businessId, planId },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
    }),
  });

  const data = await response.json();
  return { authorizationUrl: data.data.authorization_url };
}

// 2. Verify Payment
export async function verifyPayment(reference: string) {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const data = await response.json();
  
  if (data.data.status === "success") {
    const { businessId, planId } = data.data.metadata;
    await createSubscription(businessId, planId, reference);
    return { success: true };
  }

  return { success: false };
}

// 3. Create Subscription Record
async function createSubscription(
  businessId: string,
  planId: string,
  reference: string
) {
  const plan = await getPlan(planId);
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await supabase.from("subscriptions").insert({
    business_id: businessId,
    plan_id: planId,
    status: "active",
    currency: plan.currency,
    amount: plan.price,
    billing_period: plan.billing_period,
    current_period_start: now,
    current_period_end: periodEnd,
    payment_method: "paystack",
    reference_id: reference,
  });
}
```

### Webhook Verification (Secure)

```typescript
// app/api/webhooks/paystack.ts
import crypto from "crypto";

export async function POST(request: Request) {
  // Get raw body for signature verification
  const body = await request.text();

  // Verify signature
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

  const headerHash = request.headers.get("x-paystack-signature");
  if (hash !== headerHash) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event = JSON.parse(body);

  // Handle events
  switch (event.event) {
    case "charge.success":
      await handleChargeSuccess(event.data);
      break;
    case "charge.failed":
      await handleChargeFailed(event.data);
      break;
    case "subscription.create":
      await handleSubscriptionCreate(event.data);
      break;
    case "subscription.disable":
      await handleSubscriptionDisable(event.data);
      break;
  }

  return new Response("OK", { status: 200 });
}

async function handleChargeSuccess(data: any) {
  const { reference, metadata } = data;

  // Update transaction status
  await supabase
    .from("transactions")
    .update({ status: "completed" })
    .eq("provider_reference", reference);

  // Update subscription
  await supabase
    .from("subscriptions")
    .update({ status: "active" })
    .eq("reference_id", reference);

  // Log audit
  await recordAuditLog({
    business_id: metadata.businessId,
    action: "PAYMENT_COMPLETED",
    resource_type: "transaction",
    status: "success",
  });
}
```

### Multi-Currency Support

```typescript
// lib/currency.ts
export const CURRENCIES = {
  NGN: { name: "Nigerian Naira", symbol: "₦", rate: 1 },
  USD: { name: "US Dollar", symbol: "$", rate: 0.0013 },
  EUR: { name: "Euro", symbol: "€", rate: 0.0012 },
  GBP: { name: "British Pound", symbol: "£", rate: 0.001 },
};

export function convertCurrency(amount: number, from: string, to: string) {
  const baseAmount = amount * CURRENCIES[from].rate;
  return baseAmount / CURRENCIES[to].rate;
}
```

### Invoicing

```typescript
export async function generateInvoice(transactionId: string) {
  const transaction = await getTransaction(transactionId);
  const subscription = await getSubscription(transaction.subscription_id);
  const business = await getBusiness(subscription.business_id);

  const invoice = {
    number: `INV-${transaction.id.slice(0, 8).toUpperCase()}`,
    date: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    billTo: business,
    items: [
      {
        description: subscription.plan.name,
        quantity: 1,
        unitPrice: subscription.amount,
        total: subscription.amount,
      },
    ],
    subtotal: subscription.amount,
    tax: 0,
    total: subscription.amount,
  };

  // Generate PDF
  const pdf = await generatePDF(invoice);
  
  // Store in Storage
  const { data } = await supabase.storage
    .from("invoices")
    .upload(`${subscription.business_id}/${invoice.number}.pdf`, pdf);

  // Update transaction
  await supabase
    .from("transactions")
    .update({ invoice_url: data.path })
    .eq("id", transactionId);

  return data.path;
}
```

---

## 🚀 DEPLOYMENT & DEVOPS

### Infrastructure Stack

```
┌────────────────────────────────────┐
│  Vercel (Frontend + API Routes)   │
│  - Next.js deployment              │
│  - Auto-scaling                    │
│  - CDN + Edge Functions            │
│  - GitHub deployment               │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Supabase (Backend)                │
│  - PostgreSQL                      │
│  - Auth system                     │
│  - Storage (videos, files)         │
│  - Edge Functions (processing)     │
│  - Realtime subscriptions          │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  External Services                 │
│  - OpenAI (GPT, Whisper)          │
│  - Paystack/Flutterwave (Payments)│
│  - GitHub Actions (CI/CD)         │
│  - Sentry (Error tracking)        │
└────────────────────────────────────┘
```

### Environment Variables

```bash
# .env.local (Local Development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# APIs
OPENAI_API_KEY=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_PUBLIC_KEY=

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel
        uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Run E2E Tests
        run: npm run test:e2e
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

### Database Migrations (Supabase)

```bash
# Generate migration
supabase migration new add_video_tables

# Apply migration
supabase migration up

# Rollback
supabase migration down
```

### Monitoring & Error Tracking

```typescript
// lib/monitoring.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Postgres(),
    new Sentry.Integrations.Apollo(),
  ],
});

export async function captureException(error: Error, context?: any) {
  Sentry.captureException(error, { extra: context });
}

export async function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  Sentry.captureMessage(message, level);
}
```

---

## 📊 PHASE ROADMAP

### Phase 1: MVP (Weeks 1-8) ✅ CURRENT
**Goal**: Launch self-service platform with core features

- ✅ Multi-tenant auth & workspace
- ✅ Dashboard & analytics
- ✅ Website builder (basic, AI-assisted)
- ✅ CRM (contacts, deals, interactions)
- ✅ Payments (Paystack + Flutterwave)
- ✅ Video transcription + clipping
- ✅ Support ticketing
- ✅ Rate limiting & audit logs

**Deliverables**:
- Live at ogmjbrands.com
- 50+ early adopters
- $5K MRR target
- 99.5% uptime SLA

---

### Phase 2: Intelligence & Automation (Weeks 9-16)
**Goal**: Add AI agents and workflow automation

**Features**:
- Growth Strategy Agent
  - Market analysis
  - Opportunity identification
  - Growth recommendations
  
- Content Agent
  - Blog post generation
  - Social media captions
  - Email templates

- SEO Agent
  - Keyword research
  - Content optimization
  - Competitor analysis

- Ads Agent
  - Ad copy generation
  - Landing page variants
  - CTA optimization

- Automation Workflow Engine
  - Trigger → Condition → Action
  - Multi-step workflows
  - Conditional logic

- AI Memory System
  - Brand voice storage
  - Audience profiles
  - Campaign history
  - Preferences

**Deliverables**:
- 8 AI agents in production
- 1,000+ workflows created by users
- $15K MRR target

---

### Phase 3: Advanced Features (Weeks 17-24)
**Goal**: Enterprise features & market expansion

**Features**:
- A/B Testing
  - Multi-variant testing
  - Statistical analysis
  - Winner selection

- Advanced Builder
  - Custom CSS
  - Database connections
  - API integrations
  - Conditional rendering

- Social Media Integration
  - Meta (Facebook, Instagram)
  - YouTube
  - TikTok
  - Twitter

- Cybersecurity Module
  - SSL certificates
  - Security scans
  - Vulnerability detection
  - Auto-fix recommendations

- Marketplace
  - Templates
  - Plugins
  - Third-party integrations
  - Revenue sharing

**Deliverables**:
- Marketplace with 50+ templates
- 5,000+ active users
- $50K MRR target
- Enterprise tier pricing

---

### Phase 4: Scale & White-Label (Weeks 25-32)
**Goal**: Enterprise & partnership tier

**Features**:
- White-Label System
  - Custom domain
  - Custom branding
  - Custom pricing
  - Multi-level resellers

- Mobile Apps
  - iOS native
  - Android native
  - Offline support
  - Push notifications

- Advanced Analytics
  - ML-powered insights
  - Predictive analytics
  - Custom dashboards
  - Data export (CSV, Excel)

- Enterprise Features
  - SSO (SAML, OAuth)
  - Advanced RBAC
  - Compliance (SOC2, ISO27001)
  - Dedicated support

**Deliverables**:
- iOS + Android apps in stores
- 10,000+ users
- $150K MRR target
- Enterprise contracts signed

---

## 🔐 SECURITY & COMPLIANCE (Phase 1)

### Data Security
- ✅ Encryption in transit (TLS 1.3)
- ✅ Encryption at rest (AES-256)
- ✅ RLS enforcement (PostgreSQL)
- ✅ API key rotation (90 days)
- ✅ Rate limiting (100 req/min per API key)

### Access Control
- ✅ Multi-factor authentication (optional)
- ✅ Session expiry (24 hours)
- ✅ Audit logs (all sensitive actions)
- ✅ IP whitelisting (enterprise)

### Compliance
- ✅ GDPR compliant (data deletion, export)
- ✅ Privacy policy & ToS
- ✅ Penetration testing (quarterly)
- ✅ Vulnerability scanner (continuous)

### Monitoring
- ✅ Real-time alerts (Sentry)
- ✅ Error tracking & reporting
- ✅ Performance monitoring
- ✅ Uptime monitoring (StatusPage)

---

## 📈 SUCCESS METRICS (Phase 1)

### User Metrics
- **Signups**: 100 → 500 → 2,000
- **Daily Active Users**: 10 → 50 → 300
- **Retention (D30)**: 30% → 50% → 60%
- **Churn Rate**: <5% monthly

### Revenue Metrics
- **MRR**: $5K → $15K → $50K
- **ARR**: $60K → $180K → $600K
- **ARPU**: $50 → $100 → $200
- **LTV:CAC Ratio**: >3:1

### Technical Metrics
- **Uptime**: 99.5%
- **TTFB**: <200ms
- **Page Load**: <2s
- **Error Rate**: <0.1%

### Product Metrics
- **Feature Adoption**: 60%+ of features used
- **Support Response**: <2 hours
- **NPS Score**: >50
- **Mobile Users**: 30-40% of total

---

## 🎯 NEXT STEPS (Immediate Actions)

### This Week
1. **Database**: Deploy all Phase 1 tables to Supabase
2. **Auth**: Implement registration + login flows
3. **Workspace**: Multi-tenant setup
4. **API**: tRPC routes for auth & business

### Next Week
1. **Dashboard**: Main layout + navigation
2. **CRM**: Contacts CRUD + table view
3. **Payments**: Paystack integration
4. **Storage**: File upload infrastructure

### Following Week
1. **Builder**: Page builder + component library
2. **Videos**: Upload + transcription
3. **Analytics**: Event tracking setup
4. **Support**: Ticketing system

---

**Status**: Ready for implementation  
**Owner**: Dev Team  
**Last Updated**: April 17, 2026  
**Version**: 1.0.0-MVP
