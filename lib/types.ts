/**
 * OGMJ BRANDS — TypeScript Type Definitions
 * Last Updated: April 17, 2026
 */

// ================================
// CORE TYPES
// ================================

export type UserRole = "admin" | "editor" | "viewer" | "manager" | "member";
export type BusinessStatus = "active" | "inactive" | "archived";
export type InvitationStatus = "pending" | "active" | "inactive";

export type Currency = "NGN" | "USD" | "EUR" | "GBP";
export type PaymentProvider = "paystack" | "flutterwave";
export type BillingPeriod = "monthly" | "yearly" | "one_time";
export type SubscriptionStatus = "active" | "paused" | "cancelled" | "expired";

export type ContactStatus = "lead" | "prospect" | "customer" | "inactive" | "archived";
export type ContactSource = "website" | "referral" | "email" | "social" | "api" | "manual";

export type DealStatus = "open" | "in_progress" | "won" | "lost";
export type DealStage = "prospecting" | "qualification" | "proposal" | "negotiation" | "decision";

export type InteractionType = "email" | "call" | "meeting" | "note" | "task";

export type WebsiteStatus = "draft" | "published" | "archived";
export type PageStatus = "draft" | "published";
export type ComponentVisibility = "private" | "team" | "public";

export type VideoStatus = "uploading" | "processing" | "ready" | "failed";
export type VideoTranscriptStatus = "pending" | "processing" | "ready" | "failed";
export type VideoSourceType = "upload" | "url" | "youtube";

export type VideoClipStatus = "pending" | "processing" | "ready" | "failed";
export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3";

export type SupportTicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";
export type SupportChannel = "web" | "email" | "whatsapp" | "twitter";

export interface User {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  timezone?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  created_at?: string;
  updated_at?: string;
  user_metadata?: Record<string, any>;
}

export type AIMemoryCategory =
  | "brand_voice"
  | "audience"
  | "products"
  | "competitors"
  | "preferences"
  | "restrictions"
  | "campaign_history";

export type AIAgentType =
  | "growth_strategy"
  | "content"
  | "seo"
  | "ads"
  | "crm_messaging"
  | "competitor_research"
  | "analytics"
  | "brand_development";

export type WorkflowTriggerType =
  | "lead_created"
  | "payment_success"
  | "video_uploaded"
  | "scheduled_time"
  | "webhook"
  | "manual";

export type WorkflowActionType =
  | "send_email"
  | "send_whatsapp"
  | "create_task"
  | "generate_content"
  | "generate_video_clip"
  | "schedule_post"
  | "update_crm";

// ================================
// DATABASE ENTITY TYPES
// ================================

export interface Business {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  custom_domain?: string;
  logo_url?: string;
  brand_color: string;
  currency: Currency;
  timezone: string;
  country?: string;
  industry?: string;
  team_size?: number;
  phone?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface BusinessUser {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  invited_at: string;
  joined_at?: string;
  invited_by?: string;
  status: "pending" | "active" | "inactive";
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  business_id: string;
  email: string;
  role: UserRole;
  token: string;
  expires_at: string;
  redeemed_at?: string;
  redeemed_by?: string;
  created_at: string;
  created_by: string;
}

export interface AuditLog {
  id: string;
  business_id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status: "success" | "failed";
  error_message?: string;
  created_at: string;
}

export interface APIKey {
  id: string;
  business_id: string;
  name: string;
  key_hash: string;
  prefix: string;
  environment: "development" | "production";
  permissions: Record<string, boolean>;
  rate_limit: number;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
  created_by: string;
}

// ================================
// CRM TYPES
// ================================

export interface Contact {
  id: string;
  business_id: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  job_title?: string;
  lead_score: number;
  status: ContactStatus;
  source?: ContactSource;
  last_contact_at?: string;
  next_followup_at?: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Deal {
  id: string;
  business_id: string;
  contact_id: string;
  title: string;
  description?: string;
  value: number;
  currency: Currency;
  status: DealStatus;
  stage: DealStage;
  probability: number;
  expected_close_date?: string;
  closed_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Interaction {
  id: string;
  business_id: string;
  contact_id: string;
  deal_id?: string;
  type: InteractionType;
  subject?: string;
  body?: string;
  metadata: Record<string, any>;
  created_at: string;
  created_by?: string;
}

// ================================
// BUILDER TYPES
// ================================

export interface Website {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  description?: string;
  domain?: string;
  custom_domain?: string;
  ssl_certificate?: string;
  status: WebsiteStatus;
  template_id?: string;
  seo_title?: string;
  seo_description?: string;
  analytics_id?: string;
  favicon_url?: string;
  metadata: Record<string, any>;
  published_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Page {
  id: string;
  website_id: string;
  business_id: string;
  title: string;
  slug: string;
  path?: string;
  layout_id?: string;
  sections: BuilderSection[];
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  status: PageStatus;
  published_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface BuilderSection {
  id: string;
  type: string;
  data: Record<string, any>;
  styles: Record<string, any>;
  order: number;
}

export interface Component {
  id: string;
  business_id: string;
  name: string;
  type: string;
  props: Record<string, any>;
  styles: Record<string, any>;
  code?: string;
  thumbnail_url?: string;
  status: "draft" | "published";
  visibility: ComponentVisibility;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// ================================
// PAYMENTS TYPES
// ================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: Currency;
  billing_period: BillingPeriod;
  features: string[];
  max_users: number;
  max_contacts: number;
  max_websites?: number;
  max_storage_gb: number;
  ai_tokens_monthly: number;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  currency: Currency;
  amount: number;
  billing_period: BillingPeriod;
  current_period_start: string;
  current_period_end: string;
  cancel_at?: string;
  cancelled_at?: string;
  payment_method?: PaymentProvider;
  reference_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  business_id: string;
  subscription_id?: string;
  type: "subscription_charge" | "one_time" | "refund";
  amount: number;
  currency: Currency;
  status: "pending" | "completed" | "failed" | "refunded";
  payment_provider?: PaymentProvider;
  provider_reference?: string;
  invoice_number?: string;
  invoice_url?: string;
  receipt_url?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ================================
// VIDEO TYPES
// ================================

export interface Video {
  id: string;
  business_id: string;
  title: string;
  description?: string;
  source_url?: string;
  source_type?: VideoSourceType;
  file_url?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  file_size_bytes?: number;
  status: VideoStatus;
  transcription?: string;
  transcript_status: VideoTranscriptStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface VideoClip {
  id: string;
  business_id: string;
  video_id: string;
  title?: string;
  description?: string;
  start_time_seconds: number;
  end_time_seconds: number;
  duration_seconds: number;
  aspect_ratio: AspectRatio;
  file_url?: string;
  thumbnail_url?: string;
  has_captions: boolean;
  caption_file_url?: string;
  highlighted_keywords: string[];
  viral_score: number;
  status: VideoClipStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// ================================
// ANALYTICS TYPES
// ================================

export interface AnalyticsEvent {
  id: string;
  business_id: string;
  website_id?: string;
  event_type: string;
  event_name?: string;
  user_id?: string;
  session_id?: string;
  properties: Record<string, any>;
  url?: string;
  referrer?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  country?: string;
  city?: string;
  created_at: string;
}

export interface FunnelStep {
  id: string;
  business_id: string;
  website_id?: string;
  name: string;
  description?: string;
  order_index: number;
  event_conditions: Record<string, any>[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// ================================
// SUPPORT TYPES
// ================================

export interface SupportTicket {
  id: string;
  business_id: string;
  contact_id?: string;
  ticket_number: string;
  subject: string;
  description?: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  category?: string;
  channel: SupportChannel;
  assigned_to?: string;
  resolve_sla?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TicketReply {
  id: string;
  ticket_id: string;
  business_id: string;
  body: string;
  is_internal: boolean;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
  }>;
  ai_suggested_reply: boolean;
  created_at: string;
  created_by?: string;
}

// ================================
// AI TYPES
// ================================

export interface AIMemory {
  id: string;
  business_id: string;
  category: AIMemoryCategory;
  key: string;
  value: string;
  priority: number;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AIExecutionLog {
  id: string;
  business_id: string;
  agent_type: AIAgentType;
  prompt: string;
  output: string;
  status: "completed" | "failed" | "pending";
  tokens_used?: number;
  cost?: number;
  execution_time_ms?: number;
  approved: boolean;
  published: boolean;
  metadata: Record<string, any>;
  created_at: string;
  created_by?: string;
}

// ================================
// WORKFLOW TYPES
// ================================

export interface Workflow {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  trigger_type: WorkflowTriggerType;
  trigger_conditions: Record<string, any>;
  actions: WorkflowAction[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  config: Record<string, any>;
  order: number;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  business_id: string;
  status: "pending" | "running" | "completed" | "failed";
  execution_data: Record<string, any>;
  errors?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// ================================
// USAGE & QUOTAS TYPES
// ================================

export interface UsageMetrics {
  id: string;
  business_id: string;
  metric_type:
    | "contacts_count"
    | "websites_count"
    | "videos_count"
    | "storage_used"
    | "api_calls";
  value: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface RateLimit {
  id: string;
  business_id: string;
  endpoint: string;
  count: number;
  window_start: string;
  window_end: string;
  created_at: string;
}

// ================================
// API REQUEST/RESPONSE TYPES
// ================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

// ================================
// FORM INPUT TYPES
// ================================

export interface CreateBusinessInput {
  name: string;
  industry?: string;
  country?: string;
  team_size?: number;
  currency?: Currency;
  timezone?: string;
}

export interface CreateContactInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  source?: ContactSource;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateDealInput {
  contact_id: string;
  title: string;
  value: number;
  currency?: Currency;
  stage?: DealStage;
  expected_close_date?: string;
  description?: string;
}

export interface CreateWebsiteInput {
  name: string;
  description?: string;
  template_id?: string;
}

export interface CreatePageInput {
  website_id: string;
  title: string;
  slug: string;
  layout_id?: string;
}

export interface CreateSupportTicketInput {
  subject: string;
  description: string;
  priority?: SupportTicketPriority;
  category?: string;
  contact_id?: string;
}

// ================================
// INPUT TYPES
// ================================

export interface CreateContactInput {
  business_id: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  job_title?: string;
  lead_score?: number;
  status?: ContactStatus;
  source?: ContactSource;
  last_contact_at?: string;
  next_followup_at?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateDealInput {
  business_id: string;
  contact_id: string;
  title: string;
  description?: string;
  value: number;
  currency?: Currency;
  status?: DealStatus;
  stage?: DealStage;
  probability?: number;
  expected_close_date?: string;
  metadata?: Record<string, any>;
}

export interface CreateBusinessInput {
  name: string;
  slug: string;
  domain?: string;
  custom_domain?: string;
  logo_url?: string;
  brand_color?: string;
  currency?: Currency;
  timezone?: string;
  country?: string;
  industry?: string;
  team_size?: number;
  phone?: string;
  metadata?: Record<string, any>;
}
