# OGMJ BRANDS — From Idea To Empire

**AI Business Operating System** | **Next.js 14** | **Supabase** | **Enterprise Architecture**

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Open http://localhost:3000
```

## 📋 Project Overview

OGMJ BRANDS is a comprehensive AI-powered business operating system built with Next.js 14, React 18, TypeScript, and Supabase. The project is organized in **8 implementation phases** spanning **19 weeks**, with Phase 1 Week 1 foundation services now complete.

### Current Status: Phase 1 Week 1 Complete ✅

**Foundation Services Delivered:**
- ✅ Error Handling Service (AppError, 15+ error codes)
- ✅ Logging Service (5 log levels, structured context)
- ✅ Validation Schemas (Zod, 5+ schemas)
- ✅ API Response Utilities (standardized responses, pagination)
- ✅ Global State Store (Zustand, Auth/Business/UI)
- ✅ Real-Time Data Hooks (Supabase subscriptions)
- ✅ Dashboard Widgets (CVA variants, responsive grid)

## 📚 Documentation

### Quick Start (New Developers)
1. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - One-page cheat sheet for all services
2. **[SETUP_DEPLOYMENT_GUIDE.md](SETUP_DEPLOYMENT_GUIDE.md)** - Setup instructions and verification

### Integration & Implementation
3. **[WEEK_2_INTEGRATION_GUIDE.md](WEEK_2_INTEGRATION_GUIDE.md)** - 30-page integration guide with best practices
4. **[CODE_EXAMPLES.md](CODE_EXAMPLES.md)** - Before/after code patterns for 6 scenarios
5. **[WEEK_1_COMPLETION_REPORT.md](WEEK_1_COMPLETION_REPORT.md)** - Detailed completion report

### Architecture & Reference
6. **[ARCHITECTURE_DESIGN.md](ARCHITECTURE_DESIGN.md)** - System architecture, data flows, security
7. **[DATABASE_SCHEMA_REFERENCE.md](DATABASE_SCHEMA_REFERENCE.md)** - Complete database schema (48 tables)
8. **[PHASE_1_IMPLEMENTATION_GUIDE.md](PHASE_1_IMPLEMENTATION_GUIDE.md)** - Original Phase 1 planning

### Audit & Analysis
9. **[OGMJ_EMPIRE_AUDIT_REPORT.md](OGMJ_EMPIRE_AUDIT_REPORT.md)** - Full codebase audit with 19-week roadmap

## 🏗️ Architecture

### Foundation Services

```typescript
// Error Handling
import { AppError, handleError, createNotFoundError } from '@/lib/services'

// Logging
import { logger } from '@/lib/services'

// Validation
import { contactSchema, validateInput, type Contact } from '@/lib/services'

// API Responses
import { apiRouteHandler, successResponse, errorResponse } from '@/lib/services'

// State Management
import { useAuth, useBusiness, useUI } from '@/lib/store/useAppStore'

// Real-Time Data
import { useRealtimeData } from '@/lib/hooks/useRealtimeData'

// UI Components
import { DashboardWidget, MetricWidget, ChartWidget, WidgetGrid } from '@/components/dashboard/DashboardWidget'
```

### Project Structure

```
OGMJ-BRANDS/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth routes (login, signup, verify-email)
│   ├── (marketing)/             # Marketing pages (landing, pricing, blog, etc.)
│   ├── dashboard/               # Dashboard with 15 modules
│   └── api/                     # 42 API endpoints across 12 domains
├── lib/                          # Shared utilities
│   ├── services/                # Foundation services (NEW)
│   │   ├── error.service.ts    # Error handling
│   │   ├── logger.service.ts   # Structured logging
│   │   ├── api.service.ts      # API utilities
│   │   └── validators/         # Zod schemas
│   ├── store/                  # Zustand state management (NEW)
│   ├── hooks/                  # Custom hooks
│   │   └── useRealtimeData.ts  # Real-time subscriptions (NEW)
│   ├── supabase/               # Supabase clients
│   └── utils/                  # Utilities
├── components/                  # React components
│   ├── dashboard/              # Dashboard widgets (NEW)
│   ├── ui/                     # Base UI components
│   └── ...                     # Feature components
├── supabase/                    # Database migrations
└── public/                      # Static assets
```

## 🔌 Key Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14.2.35 | Framework |
| React | 18.3 | UI Library |
| TypeScript | 5 | Type Safety |
| Supabase | 2.43 | Backend/Database |
| Tailwind CSS | 3.4 | Styling |
| Zustand | 4.4 | State Management |
| Zod | 3.22 | Validation |
| Framer Motion | 12.38 | Animations |
| Recharts | 2.10 | Charts |

## 📊 Foundation Services

### 1. Error Handling (`lib/services/error.service.ts`)

```typescript
// Create error
throw createNotFoundError('Contact not found', { id })

// Handle error in try-catch
const appError = handleError(error, { context: 'operation' })
// Returns: AppError with code, statusCode, message, details, requestId, timestamp
```

**Features:**
- Semantic error codes (NOT_FOUND, DUPLICATE_RECORD, VALIDATION_ERROR, etc.)
- Automatic Supabase error detection
- Request tracking with requestId
- Structured error details for debugging

### 2. Logging (`lib/services/logger.service.ts`)

```typescript
// Log with context
logger.info('Contact created', { contactId, email, businessId })
logger.error('Database error', { query, error: err.message })
```

**Features:**
- 5 log levels: DEBUG, INFO, WARN, ERROR, FATAL
- Structured context tracking
- Development: console output with colors
- Production: ready for Sentry integration

### 3. Validation (`lib/services/validators/schemas.ts`)

```typescript
// Type-safe validation
const validated = await validateInput(contactSchema, body)
// validated: Contact (TypeScript knows the type)
```

**Schemas:**
- contactSchema, dealSchema, invoiceSchema, sequenceSchema, businessSchema
- Common fields: email, URL, date, phone validation
- Async validation support

### 4. API Responses (`lib/services/api.service.ts`)

```typescript
export async function GET(request: NextRequest) {
  return apiRouteHandler(async (req, requestId, businessId) => {
    const data = await fetchData(businessId)
    return successResponse(data, 200, requestId)
  }, request)
}
```

**Features:**
- Automatic businessId extraction and validation
- Standardized response format (success/error)
- Pagination helpers with metadata
- Centralized error handling and logging

### 5. State Management (`lib/store/useAppStore.ts`)

```typescript
function Component() {
  const { user, isAuthenticated } = useAuth()
  const { currentBusiness } = useBusiness()
  const { theme, addNotification } = useUI()
  
  return <div>{user?.email}</div>
}
```

**Features:**
- Zustand store with Auth/Business/UI states
- Selector hooks prevent unnecessary re-renders
- localStorage persistence for preferences
- devtools integration for debugging

### 6. Real-Time Data (`lib/hooks/useRealtimeData.ts`)

```typescript
const { data: contacts, loading, error } = useRealtimeData(
  'contacts',
  businessId,
  {
    onInsert: (item) => console.log('New contact:', item),
    onUpdate: (item) => console.log('Updated:', item),
  }
)
```

**Hooks:**
- `useRealtimeData<T>()` - Table subscriptions with INSERT/UPDATE/DELETE
- `useRealtimeSingle<T>()` - Single record subscriptions
- `useRealtimeCount()` - Real-time count tracking

### 7. Dashboard Widgets (`components/dashboard/DashboardWidget.tsx`)

```typescript
<WidgetGrid>
  <MetricWidget title="Revenue" value="$45,231" />
  <ChartWidget title="Trend" size="lg">
    <Chart data={data} />
  </ChartWidget>
</WidgetGrid>
```

**Components:**
- DashboardWidget (base)
- MetricWidget (numeric metrics with change %)
- ChartWidget (visualization container)
- TableWidget (sortable data)
- WidgetGrid (responsive 1-4 column layout)

## 🎯 Next Steps (Week 2)

1. **Read** [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick lookup
2. **Review** [WEEK_2_INTEGRATION_GUIDE.md](WEEK_2_INTEGRATION_GUIDE.md) - Integration patterns
3. **Study** [CODE_EXAMPLES.md](CODE_EXAMPLES.md) - Real code examples
4. **Integrate** - Add services to middleware and API routes
5. **Build** - Enhance dashboard with real-time data

## 🚦 Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # Check TypeScript errors
npm run lint         # Run linter
```

## 📞 Support & Resources

- **Foundation Services:** See QUICK_REFERENCE.md
- **Integration Help:** See WEEK_2_INTEGRATION_GUIDE.md
- **Code Examples:** See CODE_EXAMPLES.md
- **Architecture:** See ARCHITECTURE_DESIGN.md
- **Database Schema:** See DATABASE_SCHEMA_REFERENCE.md

## 📈 Implementation Phases

| Phase | Duration | Focus |
|-------|----------|-------|
| **Phase 1** | Weeks 1-2 | Foundation Services (CURRENT) |
| **Phase 2** | Weeks 3-4 | Executive Command Center |
| **Phase 3** | Weeks 5-6 | CRM Hub & Lead Intelligence |
| **Phase 4** | Weeks 7-8 | Revenue Engine & Automation |
| **Phase 5** | Weeks 9-10 | Content Factory & Video |
| **Phase 6** | Weeks 11-12 | Analytics Brain & AI |
| **Phase 7** | Weeks 13-16 | Agent Coordination System |
| **Phase 8** | Weeks 17-19 | Deployment & Optimization |

---

**Last Updated:** July 1, 2026  
**Status:** Phase 1 Week 1 Complete ✅  
**Next:** Week 2 Integration

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
