-- OGMJ BRANDS — Invoicing Module Schema
-- Last Updated: May 14, 2026

-- ================================
-- 1. INVOICING MODULE
-- ================================

-- Invoice templates table
CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_html TEXT,
  logo_url TEXT,
  footer_text TEXT,
  payment_terms VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(business_id, name)
);
CREATE INDEX idx_invoice_templates_business_id ON invoice_templates(business_id);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  -- draft, sent, viewed, paid, overdue, cancelled
  currency VARCHAR(3) DEFAULT 'NGN',
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  discount_type VARCHAR(20),
  -- percentage, fixed
  total_amount DECIMAL(15, 2) NOT NULL,
  paid_amount DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  template_id UUID REFERENCES invoice_templates(id),
  payment_method VARCHAR(50),
  -- paystack, bank_transfer, check
  reference_id VARCHAR(255),
  sent_at TIMESTAMP,
  viewed_at TIMESTAMP,
  paid_at TIMESTAMP,
  reminder_sent_count INT DEFAULT 0,
  last_reminder_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(business_id, invoice_number)
);
CREATE INDEX idx_invoices_business_id ON invoices(business_id);
CREATE INDEX idx_invoices_contact_id ON invoices(contact_id);
CREATE INDEX idx_invoices_status ON invoices(business_id, status);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(15, 2) NOT NULL,
  total DECIMAL(15, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_business_id ON invoice_line_items(business_id);

-- Invoice payments
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  reference_id VARCHAR(255),
  transaction_id UUID REFERENCES transactions(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_business_id ON invoice_payments(business_id);
CREATE INDEX idx_invoice_payments_payment_date ON invoice_payments(payment_date);

-- Invoice reminders
CREATE TABLE IF NOT EXISTS invoice_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL,
  -- first_due, second_reminder, final_notice
  sent_at TIMESTAMP,
  recipient_email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  -- pending, sent, failed
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_invoice_reminders_invoice_id ON invoice_reminders(invoice_id);
CREATE INDEX idx_invoice_reminders_business_id ON invoice_reminders(business_id);
CREATE INDEX idx_invoice_reminders_status ON invoice_reminders(status);

-- ================================
-- 2. SOCIAL MEDIA SCHEDULING
-- ================================

-- Social accounts
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  -- twitter, instagram, linkedin, facebook, tiktok, youtube
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  connected_at TIMESTAMP DEFAULT NOW(),
  disconnected_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, platform, account_id)
);
CREATE INDEX idx_social_accounts_business_id ON social_accounts(business_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);

-- Social posts
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT [],
  hashtags TEXT [],
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft',
  -- draft, scheduled, published, failed
  platform_post_id VARCHAR(255),
  engagement_stats JSONB DEFAULT '{}',
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  views INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX idx_social_posts_business_id ON social_posts(business_id);
CREATE INDEX idx_social_posts_account_id ON social_posts(social_account_id);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled_at ON social_posts(scheduled_at);
CREATE INDEX idx_social_posts_published_at ON social_posts(published_at);

-- ================================
-- 3. WORKFLOWS & AUTOMATION
-- ================================

-- Workflow definitions
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(100) NOT NULL,
  trigger_config JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  -- draft, active, paused, archived
  is_default BOOLEAN DEFAULT FALSE,
  execution_count INT DEFAULT 0,
  last_executed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(business_id, name)
);
CREATE INDEX idx_workflows_business_id ON workflows(business_id);
CREATE INDEX idx_workflows_status ON workflows(status);

-- Workflow steps/actions
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  action_config JSONB NOT NULL,
  delay_minutes INT DEFAULT 0,
  condition_config JSONB,
  -- optional conditions before executing
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workflow_id, order_index)
);
CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);

-- Workflow executions
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  trigger_entity_type VARCHAR(100),
  trigger_entity_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'running',
  -- running, completed, failed
  completed_steps INT DEFAULT 0,
  total_steps INT,
  error_message TEXT,
  execution_time_ms INT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_business_id ON workflow_executions(business_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);

-- ================================
-- 4. EMAIL TEMPLATES
-- ================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_body TEXT,
  text_body TEXT,
  template_variables JSONB DEFAULT '[]',
  category VARCHAR(50),
  -- transactional, marketing, notification
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(business_id, slug)
);
CREATE INDEX idx_email_templates_business_id ON email_templates(business_id);

-- Email queue for sending
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  subject VARCHAR(255),
  html_body TEXT,
  text_body TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  -- pending, sent, failed, bounced
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  sent_at TIMESTAMP,
  failed_at TIMESTAMP,
  error_message TEXT,
  reference_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_email_queue_business_id ON email_queue(business_id);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_created_at ON email_queue(created_at DESC);

-- ================================
-- STORAGE BUCKETS (Commented - create via UI/API)
-- ================================
-- ALTER TABLE storage.objects SET PUBLIC WHERE bucket_id = 'invoices' AND name LIKE '%/%';
