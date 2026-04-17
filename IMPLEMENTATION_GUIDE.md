# OGMJ BRANDS — PHASE 1 IMPLEMENTATION GUIDE

**Status**: Ready for Development  
**Version**: 1.0.0-MVP  
**Last Updated**: April 17, 2026

---

## 🚀 QUICK START

### 1. Environment Setup

```bash
# Clone repository
git clone https://github.com/ogmj/brands.git
cd ogmj-brands

# Install dependencies
npm install @supabase/supabase-js@^2.103.3

# Setup environment
cp .env.example .env.local
```

### 2. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyxxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxx

# Payments
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
FLUTTERWAVE_SECRET_KEY=sk_live_xxxxx
FLUTTERWAVE_PUBLIC_KEY=pk_live_xxxxx

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 3. Database Setup

```bash
# Create Supabase project at supabase.com

# Run migrations
supabase migration up

# Or apply SQL directly via Supabase dashboard:
# 1. Go to SQL Editor
# 2. Copy contents from supabase/migrations/001_initial_schema.sql
# 3. Run query
# 4. Repeat for 002_rls_policies.sql
```

### 4. Local Development

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000

# View Supabase Dashboard
supabase link --project-ref xxxxx
supabase status
```

---

## 📁 PROJECT STRUCTURE

```
ogmj-brands/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── (onboarding)/             # Onboarding flow
│   │   ├── welcome/
│   │   └── business-setup/
│   ├── (dashboard)/              # Main app
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── crm/
│   │   ├── builder/
│   │   ├── videos/
│   │   ├── analytics/
│   │   ├── support/
│   │   └── settings/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── businesses/
│   │   ├── contacts/
│   │   ├── deals/
│   │   ├── websites/
│   │   ├── videos/
│   │   ├── payments/
│   │   ├── webhooks/
│   │   └── analytics/
│   └── layout.tsx                # Root layout
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # Layout components
│   ├── forms/                    # Form components
│   ├── crm/                      # CRM-specific components
│   ├── builder/                  # Builder components
│   ├── videos/                   # Video components
│   └── analytics/                # Analytics components
├── lib/                          # Utilities & services
│   ├── auth.ts                   # Authentication
│   ├── types.ts                  # TypeScript types
│   ├── supabase/
│   │   ├── client.ts             # Supabase client
│   │   └── database.types.ts     # Generated types
│   ├── services/
│   │   ├── business.ts           # Business logic
│   │   ├── crm.ts                # CRM logic
│   │   ├── builder.ts            # Builder logic
│   │   ├── payments.ts           # Payments logic
│   │   └── videos.ts             # Video logic
│   ├── hooks/                    # React hooks
│   ├── utils/                    # Utility functions
│   └── constants.ts              # Constants
├── public/                       # Static assets
├── supabase/                     # Supabase config
│   ├── migrations/               # Database migrations
│   ├── config.toml               # Supabase config
│   └── seed.sql                  # Seed data
├── .github/
│   └── workflows/                # GitHub Actions
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 DEVELOPMENT WORKFLOW

### Creating a New Feature

```
1. Create TypeScript types in lib/types.ts
2. Create database table (migration) in supabase/migrations/
3. Create RLS policies in supabase/migrations/002_rls_policies.sql
4. Create service/logic in lib/services/
5. Create API route(s) in app/api/
6. Create components in components/
7. Create page(s) in app/(dashboard)/
8. Test end-to-end
```

### Example: Adding Contact Status Update

#### 1. Types (lib/types.ts)
Already defined: `ContactStatus = "lead" | "prospect" | "customer" | "inactive"`

#### 2. Database
Already created: `contacts.status` column

#### 3. RLS Policies
Already created: `contacts_update_policy`

#### 4. Service (lib/services/crm.ts)
```typescript
// Add to crm.ts
export async function updateContactStatus(
  businessId: string,
  contactId: string,
  status: ContactStatus
): Promise<APIResponse<Contact>> {
  return updateContact(businessId, contactId, { status });
}
```

#### 5. API Route (app/api/contacts/[id]/status/route.ts)
```typescript
import { updateContactStatus } from "@/lib/services/crm";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { businessId, status } = await request.json();
  const result = await updateContactStatus(businessId, params.id, status);
  return Response.json(result);
}
```

#### 6. Component (components/crm/ContactStatusUpdate.tsx)
```typescript
export function ContactStatusUpdate({ contact }: { contact: Contact }) {
  const [status, setStatus] = useState(contact.status);
  
  async function handleStatusChange(newStatus: ContactStatus) {
    const result = await updateContactStatus(contact.business_id, contact.id, newStatus);
    if (result.success) {
      setStatus(newStatus);
    }
  }
  
  return (
    <Select value={status} onValueChange={handleStatusChange}>
      <SelectItem value="lead">Lead</SelectItem>
      <SelectItem value="prospect">Prospect</SelectItem>
      <SelectItem value="customer">Customer</SelectItem>
      <SelectItem value="inactive">Inactive</SelectItem>
    </Select>
  );
}
```

#### 7. Page Usage (app/(dashboard)/crm/contacts/[id]/page.tsx)
```typescript
export default async function ContactPage({ params }: { params: { id: string } }) {
  const contact = await getContact(params.businessId, params.id);
  
  return (
    <div>
      <h1>{contact.first_name} {contact.last_name}</h1>
      <ContactStatusUpdate contact={contact} />
    </div>
  );
}
```

---

## 📊 API ROUTE STRUCTURE

### Pattern: `/api/[resource]/[action]/route.ts`

#### Example 1: List Contacts
```typescript
// app/api/contacts/route.ts
import { listContacts } from "@/lib/services/crm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  const page = searchParams.get("page");
  
  const result = await listContacts(businessId, { page: parseInt(page || "1") });
  return Response.json(result);
}
```

#### Example 2: Create Contact
```typescript
// app/api/contacts/route.ts
import { createContact } from "@/lib/services/crm";

export async function POST(request: Request) {
  const { businessId, ...input } = await request.json();
  const result = await createContact(businessId, input);
  return Response.json(result, { status: result.success ? 201 : 400 });
}
```

#### Example 3: Update Deal
```typescript
// app/api/deals/[id]/route.ts
import { updateDeal } from "@/lib/services/crm";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { businessId, ...updates } = await request.json();
  const result = await updateDeal(businessId, params.id, updates);
  return Response.json(result);
}
```

---

## 🔐 AUTHENTICATION FLOW

### Sign Up
```typescript
import { signUp } from "@/lib/auth";

const result = await signUp("user@example.com", "password123", "John Doe");
```

### Sign In
```typescript
import { signIn } from "@/lib/auth";

const result = await signIn("user@example.com", "password123");
```

### OAuth (Google)
```typescript
import { signInWithOAuth } from "@/lib/auth";

const { url } = await signInWithOAuth("google");
// Redirect to url
```

### Session Check
```typescript
import { getCurrentUser, getCurrentSession } from "@/lib/auth";

const user = await getCurrentUser();  // Returns User | null
const session = await getCurrentSession();  // Returns Session | null
```

---

## 💳 PAYMENTS INTEGRATION

### Paystack Implementation

```typescript
// lib/services/payments.ts

export async function initializePaystackPayment(
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
      amount: Math.round(plan.price * 100),
      email,
      reference: `SUB_${businessId}_${Date.now()}`,
      metadata: { businessId, planId },
    }),
  });
  
  return response.json();
}

export async function verifyPaystackPayment(reference: string) {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );
  
  return response.json();
}
```

### Webhook Handler

```typescript
// app/api/webhooks/paystack/route.ts
import crypto from "crypto";

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
    const { reference } = event.data;
    // Update subscription in database
  }
  
  return new Response("OK");
}
```

---

## 🎬 VIDEO PROCESSING

### Upload Handler

```typescript
// app/api/videos/upload/route.ts
import { createBrowserClient } from "@/lib/supabase/client";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const businessId = formData.get("businessId") as string;
  
  // Upload to storage
  const supabase = createBrowserClient();
  const { data, error } = await supabase.storage
    .from("videos")
    .upload(`${businessId}/${Date.now()}_${file.name}`, file);
  
  if (error) throw error;
  
  // Create video record
  const { data: video } = await supabase
    .from("videos")
    .insert({
      business_id: businessId,
      title: file.name.replace(/\.[^/.]+$/, ""),
      file_url: data.path,
      status: "processing",
      source_type: "upload",
    })
    .select()
    .single();
  
  // Trigger transcription (Edge Function)
  // await triggerTranscription(video.id);
  
  return Response.json({ success: true, video });
}
```

---

## 🧪 TESTING

### Unit Tests (Jest)

```typescript
// lib/services/__tests__/crm.test.ts
import { createContact } from "../crm";

jest.mock("@/lib/supabase/client");
jest.mock("@/lib/auth");

describe("CRM Service", () => {
  it("should create a contact", async () => {
    const result = await createContact("business-123", {
      first_name: "John",
      email: "john@example.com",
    });
    
    expect(result.success).toBe(true);
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/crm.spec.ts
import { test, expect } from "@playwright/test";

test("should create and view contact", async ({ page }) => {
  // Sign in
  await page.goto("/login");
  await page.fill("input[name=email]", "test@example.com");
  await page.fill("input[name=password]", "password123");
  await page.click("button:has-text('Sign In')");
  
  // Create contact
  await page.goto("/dashboard/crm/contacts");
  await page.click("button:has-text('Add Contact')");
  await page.fill("input[name=first_name]", "John");
  await page.fill("input[name=email]", "john@example.com");
  await page.click("button:has-text('Create')");
  
  // Verify
  await expect(page.locator("text=John")).toBeVisible();
});
```

---

## 📈 MONITORING & LOGGING

### Sentry Integration

```typescript
// lib/monitoring.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  tracesSampleRate: 1.0,
});

export function captureException(error: Error, context?: any) {
  Sentry.captureException(error, { extra: context });
}
```

### Audit Logging

```typescript
// Automatically logged in business.ts, crm.ts, etc.
await recordAuditLog({
  business_id: businessId,
  user_id: user.id,
  action: "CONTACT_CREATED",
  resource_type: "contact",
  resource_id: contact.id,
  status: "success",
});
```

---

## 🚢 DEPLOYMENT

### Vercel Deployment

```bash
# Connect repository
vercel link

# Deploy
vercel deploy

# Set production environment variables
vercel env add SUPABASE_URL
vercel env add OPENAI_API_KEY
# ... (all env vars)

# Deploy to production
vercel deploy --prod
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## 📋 PHASE 1 CHECKLIST

### Week 1-2: Foundation
- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] RLS policies activated
- [ ] Auth system working
- [ ] Login/Signup pages

### Week 2-3: Business Setup
- [ ] Business creation flow
- [ ] Team invitation system
- [ ] Dashboard layout
- [ ] Navigation sidebar

### Week 3-4: CRM Core
- [ ] Contacts CRUD
- [ ] Deals pipeline
- [ ] Interactions tracking
- [ ] Contact detail page

### Week 4-5: Payments
- [ ] Subscription plans page
- [ ] Paystack integration
- [ ] Flutterwave fallback
- [ ] Invoice generation

### Week 5-6: Builder
- [ ] Website creation
- [ ] Page editor (basic)
- [ ] Component library
- [ ] Publish flow

### Week 6-7: Videos
- [ ] Upload handler
- [ ] Transcription pipeline
- [ ] Clip creation UI
- [ ] Viral scoring

### Week 7-8: Analytics & Support
- [ ] Event tracking
- [ ] Dashboard analytics
- [ ] Support ticketing
- [ ] Rate limiting

### Launch Preparation
- [ ] Security audit
- [ ] Performance testing
- [ ] E2E testing
- [ ] Documentation
- [ ] Launch checklist

---

## 🆘 TROUBLESHOOTING

### Database Connection Error
```bash
# Check Supabase credentials
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection
supabase status
```

### RLS Policy Blocking Requests
```
Error: new row violates row-level security policy
→ Check RLS policies in Supabase dashboard
→ Verify business_id is correct
→ Check user has business_users entry
```

### OAuth Redirect Loop
```
→ Check NEXT_PUBLIC_APP_URL matches Supabase redirect URL
→ Verify OAuth app credentials
→ Check cookies are enabled
```

---

## 📞 SUPPORT RESOURCES

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **OpenAI API**: https://platform.openai.com/docs
- **Paystack Docs**: https://paystack.com/docs/api
- **Sentry Docs**: https://docs.sentry.io

---

**Next Step**: Start with Week 1 tasks. Set up Supabase, run migrations, and test authentication.
