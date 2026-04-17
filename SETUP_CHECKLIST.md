# OGMJ BRANDS — SETUP CHECKLIST & QUICK REFERENCE

**Last Updated**: April 17, 2026  
**Completion Status**: 0% (Ready to start)

---

## 📋 PHASE 1 SETUP CHECKLIST

### Stage 1: Infrastructure (Week 1)

#### Supabase Project
- [ ] Create Supabase account at supabase.com
- [ ] Create new project (Region: Africa if available)
- [ ] Get Project URL and API keys
- [ ] Enable Auth (Email, Google, GitHub)
- [ ] Create Storage buckets:
  - [ ] `businesses-logos`
  - [ ] `website-assets`
  - [ ] `videos`
  - [ ] `video-clips`
  - [ ] `invoices`
  - [ ] `attachments`

#### Database Migrations
- [ ] Deploy 001_initial_schema.sql (creates tables)
- [ ] Deploy 002_rls_policies.sql (security policies)
- [ ] Verify all tables created: `SELECT * FROM information_schema.tables WHERE table_schema='public';`
- [ ] Test RLS: Create test user, verify they only see their data

#### Local Development
- [ ] Clone repository
- [ ] Copy `.env.example` → `.env.local`
- [ ] Add Supabase credentials
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Verify app loads at http://localhost:3000

---

### Stage 2: Authentication (Week 1-2)

#### Auth Pages
- [ ] Create `/app/(auth)/login/page.tsx`
- [ ] Create `/app/(auth)/signup/page.tsx`
- [ ] Create `/app/(auth)/forgot-password/page.tsx`
- [ ] Create `/app/(auth)/reset-password/[token]/page.tsx`
- [ ] Test email/password signup
- [ ] Test OAuth callback
- [ ] Verify email verification flow

#### Auth API Routes
- [ ] `POST /api/auth/signup` - User registration
- [ ] `POST /api/auth/login` - Email/password login
- [ ] `POST /api/auth/logout` - Session cleanup
- [ ] `POST /api/auth/forgot-password` - Reset request
- [ ] `POST /api/auth/reset-password` - Password confirmation
- [ ] Test all endpoints

#### Protected Routes
- [ ] Create middleware to check auth
- [ ] Redirect unauthenticated users to login
- [ ] Redirect authenticated users away from /auth pages
- [ ] Test redirect flows

---

### Stage 3: Business Setup (Week 2)

#### Workspace Management
- [ ] Create business creation flow
- [ ] `POST /api/businesses` - Create business
- [ ] `GET /api/businesses` - List user's businesses
- [ ] `GET /api/businesses/:id` - Get business details
- [ ] Onboarding wizard (welcome → business setup → team → payment)

#### Team Management
- [ ] `POST /api/businesses/:id/invite` - Invite user
- [ ] `GET /api/businesses/:id/members` - List team
- [ ] `PATCH /api/businesses/:id/members/:uid` - Update role
- [ ] `DELETE /api/businesses/:id/members/:uid` - Remove member
- [ ] Invitation email template
- [ ] Invitation acceptance page

#### Dashboard Layout
- [ ] Create main layout with sidebar
- [ ] Create navigation menu
- [ ] Create top header with user profile
- [ ] Create business switcher
- [ ] Responsive mobile layout

---

### Stage 4: CRM Core (Week 2-3)

#### Contacts Management
- [ ] `POST /api/contacts` - Create contact
- [ ] `GET /api/contacts` - List contacts (with pagination)
- [ ] `GET /api/contacts/:id` - Contact detail
- [ ] `PUT /api/contacts/:id` - Update contact
- [ ] `DELETE /api/contacts/:id` - Delete contact
- [ ] Contact table view with sorting/filtering
- [ ] Contact creation form
- [ ] Contact detail page with full history

#### Deals Pipeline
- [ ] `POST /api/deals` - Create deal
- [ ] `GET /api/deals` - List deals (by status/stage)
- [ ] `GET /api/deals/:id` - Deal detail
- [ ] `PUT /api/deals/:id` - Update deal
- [ ] Pipeline/Kanban view
- [ ] Deal value calculation
- [ ] Close rate analytics

#### Interactions
- [ ] Create interaction on contact
- [ ] Log email/call/meeting
- [ ] Add notes to interactions
- [ ] Timeline view of all interactions
- [ ] Next follow-up tracking

---

### Stage 5: Payments (Week 3)

#### Subscription Plans
- [ ] Create 3 tiers (Starter, Professional, Enterprise)
- [ ] Add features for each plan
- [ ] Create pricing page
- [ ] Display plans in settings

#### Paystack Integration
- [ ] Create Paystack account at paystack.co
- [ ] Get Secret & Public keys
- [ ] Create payment initialization endpoint
- [ ] `POST /api/payments/initialize` - Start payment
- [ ] `POST /api/payments/verify` - Verify transaction
- [ ] Create payment modal/redirect
- [ ] Store subscription record
- [ ] Update business usage limits

#### Webhooks
- [ ] Set Paystack webhook URL in dashboard
- [ ] `POST /api/webhooks/paystack` - Handle charge.success
- [ ] Verify webhook signature (HMAC-SHA512)
- [ ] Update subscription status on success
- [ ] Send confirmation email
- [ ] Handle failed payments

#### Flutterwave (Fallback)
- [ ] Create Flutterwave account
- [ ] Add as payment option
- [ ] Implement same flow as Paystack
- [ ] Test both providers

#### Invoicing
- [ ] Generate invoice on transaction
- [ ] Store PDF in storage
- [ ] Email invoice to customer
- [ ] Invoice download link

---

### Stage 6: Builder (Week 4)

#### Website Creation
- [ ] `POST /api/websites` - Create website
- [ ] `GET /api/websites` - List websites
- [ ] Website settings page
- [ ] Custom domain setup
- [ ] SSL certificate

#### Page Editor
- [ ] `POST /api/pages` - Create page
- [ ] `PUT /api/pages/:id` - Update page
- [ ] Drag-and-drop builder UI
- [ ] Component insertion
- [ ] Styling panel
- [ ] Preview mode

#### Components Library
- [ ] Create base components (Button, Card, Form, Gallery)
- [ ] Create component system
- [ ] Props editor
- [ ] Styles editor
- [ ] Component reusability

#### Publishing
- [ ] Generate static HTML
- [ ] Deploy to Vercel
- [ ] Domain connection
- [ ] URL preview

---

### Stage 7: Videos (Week 5)

#### Upload & Storage
- [ ] Create upload form (file or URL)
- [ ] `POST /api/videos/upload` - Handle upload
- [ ] Store in Supabase Storage
- [ ] Generate thumbnail
- [ ] Extract duration

#### Transcription
- [ ] Integrate OpenAI Whisper
- [ ] Trigger transcription job
- [ ] `POST /api/videos/:id/transcribe` - Transcription
- [ ] Store transcript with timestamps
- [ ] Display transcript in UI

#### Clipping
- [ ] `POST /api/video-clips` - Create clip
- [ ] FFmpeg integration for extraction
- [ ] Aspect ratio conversion (9:16, 16:9, 1:1)
- [ ] Caption generation
- [ ] Branding overlay
- [ ] Viral score calculation
- [ ] Clip preview

#### Export
- [ ] Generate clip files
- [ ] Multiple format support
- [ ] Download link
- [ ] Share options

---

### Stage 8: Analytics (Week 5-6)

#### Event Tracking
- [ ] Add tracking script to websites
- [ ] `POST /api/events/track` - Track event (public endpoint)
- [ ] Store: page_view, click, form_submit, purchase
- [ ] User/session identification
- [ ] Device & location info

#### Dashboard Analytics
- [ ] Total visitors (time series)
- [ ] Traffic by page
- [ ] Conversion metrics
- [ ] Top referrers
- [ ] Device breakdown
- [ ] Geographic distribution

#### Funnel Analysis
- [ ] Create funnel steps
- [ ] Calculate conversion rates
- [ ] Identify drop-off points
- [ ] Compare funnels

#### Revenue Dashboard
- [ ] MRR calculation
- [ ] ARR tracking
- [ ] ARPU metric
- [ ] Subscription growth

---

### Stage 9: Support System (Week 6)

#### Ticketing
- [ ] `POST /api/tickets` - Create ticket
- [ ] `GET /api/tickets` - List tickets
- [ ] `PUT /api/tickets/:id` - Update ticket
- [ ] Ticket priority levels
- [ ] SLA tracking

#### Replies
- [ ] `POST /api/tickets/:id/reply` - Add reply
- [ ] Support agent assignment
- [ ] Internal notes (private)
- [ ] Attachment upload

#### Features
- [ ] AI reply suggestions
- [ ] Knowledge base search
- [ ] Ticket search/filtering
- [ ] Priority inbox

---

### Stage 10: Security & Compliance (Week 6-7)

#### Rate Limiting
- [ ] Implement rate limiter (100 req/min per API key)
- [ ] Store in Redis or Supabase
- [ ] Return 429 on limit exceeded
- [ ] Per-endpoint customization

#### Audit Logging
- [ ] Log all sensitive actions
- [ ] Store: action, resource, changes, user, timestamp
- [ ] Viewable admin dashboard
- [ ] Export capability

#### Security Headers
- [ ] Content-Security-Policy
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] Strict-Transport-Security
- [ ] X-XSS-Protection

#### SSL/TLS
- [ ] Enable HTTPS (Vercel auto-enables)
- [ ] Custom domain SSL
- [ ] Certificate renewal

---

### Stage 11: Testing & QA (Week 7)

#### Unit Tests
- [ ] Auth service tests
- [ ] Business service tests
- [ ] CRM service tests
- [ ] Payment service tests
- [ ] Coverage: >80%

#### Integration Tests
- [ ] Full signup flow
- [ ] Create business → Add team → Create contact → Create deal
- [ ] Payment flow end-to-end
- [ ] Video upload & transcription

#### E2E Tests (Playwright)
- [ ] User login flow
- [ ] Contact creation
- [ ] Deal pipeline
- [ ] Website builder
- [ ] Payment checkout

#### Manual Testing
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] RLS security (verify user can't see other businesses)
- [ ] Rate limiting (hit endpoint 101 times)
- [ ] Error handling

---

### Stage 12: Launch Prep (Week 7-8)

#### Performance
- [ ] Run Lighthouse audit (target: >90)
- [ ] Optimize images (WebP, responsive)
- [ ] Code splitting & lazy loading
- [ ] Database query optimization
- [ ] <2s page load time

#### Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Create Grafana dashboard
- [ ] Set up uptime monitoring
- [ ] Configure alerts
- [ ] Test alerts

#### Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guide/video tutorials
- [ ] Admin guide
- [ ] FAQ section
- [ ] Troubleshooting guide

#### Go-Live
- [ ] Set DNS to Vercel
- [ ] Enable HTTPS redirect
- [ ] Set up email service (SendGrid/Mailgun)
- [ ] Configure Stripe/Paystack webhooks
- [ ] Smoke test all flows
- [ ] Create status page
- [ ] Prepare launch announcement

---

## 🎯 QUICK REFERENCE GUIDES

### Database Query Examples

```sql
-- Get user's businesses
SELECT b.* FROM businesses b
JOIN business_users bu ON b.id = bu.business_id
WHERE bu.user_id = auth.uid() AND bu.status = 'active';

-- Get contact with interactions
SELECT c.*, 
  (SELECT json_agg(i) FROM interactions i WHERE i.contact_id = c.id) as interactions
FROM contacts c WHERE c.id = $1;

-- Calculate MRR
SELECT 
  SUM(amount) as mrr,
  COUNT(*) as subscription_count
FROM subscriptions
WHERE status = 'active' AND billing_period = 'monthly'
AND business_id = $1;
```

### Common API Patterns

```typescript
// Get business from request
const businessId = request.headers.get("x-business-id");

// Verify user permission
const user = await getCurrentUser();
const { data: bu } = await supabase
  .from("business_users")
  .select("role")
  .eq("business_id", businessId)
  .eq("user_id", user.id)
  .single();

// Return consistent response
return Response.json({
  success: true,
  data: result,
  timestamp: new Date().toISOString(),
});
```

### Form Validation

```typescript
import { z } from "zod";

const contactSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
});

const result = contactSchema.safeParse(data);
if (!result.success) {
  return { errors: result.error.flatten() };
}
```

---

## 📞 HELPFUL LINKS

| Resource | URL |
|----------|-----|
| Supabase Dashboard | https://app.supabase.com |
| Vercel Dashboard | https://vercel.com/dashboard |
| Paystack Dashboard | https://dashboard.paystack.co |
| OpenAI API | https://platform.openai.com |
| Sentry Dashboard | https://sentry.io/projects/ |
| GitHub Actions | https://github.com/ogmj/brands/actions |

---

## 🚨 CRITICAL CHECKLIST

- [ ] **RLS is enabled** on all tables (data security)
- [ ] **Audit logging is working** (compliance)
- [ ] **Rate limiting is configured** (DDoS protection)
- [ ] **Webhook signatures verified** (payment security)
- [ ] **Environment variables not in repo** (.gitignore)
- [ ] **Service role key not exposed** to browser
- [ ] **HTTPS enabled** in production
- [ ] **CORS configured** properly
- [ ] **Database backups scheduled**
- [ ] **Monitoring alerts active**

---

## 📈 SUCCESS METRICS (Phase 1)

**By End of Week 8:**

- ✅ Platform deployed and live
- ✅ 50+ early adopters signed up
- ✅ $5,000 MRR from subscriptions
- ✅ 99.5% uptime
- ✅ <200ms TTFB
- ✅ 0 critical security issues
- ✅ 80%+ test coverage
- ✅ NPS >40

---

**Next Step**: Begin Stage 1 (Supabase Setup)  
**Estimated Duration**: 8 weeks  
**Team Size**: 2-3 developers recommended
