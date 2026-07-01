# OGMJ BRANDS — Phase 1 Week 2 Integration Guide

**Last Updated:** July 1, 2026  
**Status:** Week 1 Foundation Complete → Week 2 Implementation Ready

## Overview

This guide documents the new foundation services created in Week 1 and provides comprehensive integration patterns for Week 2 implementation. All services are production-ready and follow enterprise architecture patterns.

## 📦 Week 1 Deliverables

### 1. Error Handling Service (`lib/services/error.service.ts`)

**Purpose:** Standardized error handling across all layers (API, services, middleware)

**Key Components:**
- `AppError` class with code, statusCode, message, details, requestId, timestamp
- 15+ error codes covering authentication, validation, database, external services, server errors
- `handleError()` function for converting any error type to standardized format
- Factory functions for common error types

**Usage Pattern:**
```typescript
import { AppError, handleError, createNotFoundError } from '@/lib/services'

// Throw application error
if (!item) {
  throw createNotFoundError('Contact not found', { id })
}

// Catch and handle
try {
  // some operation
} catch (error) {
  const appError = handleError(error, { context: 'operation' })
  console.error(appError)
}
```

### 2. Logging Service (`lib/services/logger.service.ts`)

**Purpose:** Structured logging with environment-aware output (console in dev, monitoring in production)

**Key Components:**
- LoggerService singleton with 5 log levels: DEBUG, INFO, WARN, ERROR, FATAL
- Structured context tracking with operation tracking
- Automatic caller detection (file:line:column)
- Development console output with colors
- Production-ready for Sentry integration

**Usage Pattern:**
```typescript
import { logger } from '@/lib/services'

// Log with context
logger.info('Contact created', {
  contactId: contact.id,
  email: contact.email,
  businessId,
})

// Automatic formatting
logger.error('Database error', { query: sql, error: err.message })
```

### 3. Validation Schemas (`lib/services/validators/schemas.ts`)

**Purpose:** Zod-based input validation with TypeScript type inference

**Key Schemas:**
- `contactSchema` - Name, email, phone, status, source validation
- `dealSchema` - Title, value, status, pipeline stage, probability validation
- `invoiceSchema` - Amount, currency, status, due date validation
- `sequenceSchema` - Name, type, status, trigger, automation rules
- `businessSchema` - Name, subscription plan, status validation

**Usage Pattern:**
```typescript
import { contactSchema, validateInput, type Contact } from '@/lib/services'

// Validate and parse
const validatedContact = await validateInput(contactSchema, body)

// TypeScript inference
const contact: Contact = validatedContact // ✅ Type-safe
```

### 4. Global State Store (`lib/store/useAppStore.ts`)

**Purpose:** Zustand-based centralized state management replacing React Context

**Key States:**
- **Auth State:** user, isLoading, isAuthenticated + setters
- **Business State:** currentBusiness, businesses list + setters
- **UI State:** theme, sidebarOpen, notifications + setters

**Usage Pattern:**
```typescript
import { useAuth, useBusiness, useUI } from '@/lib/store/useAppStore'

// In components
function Header() {
  const { user, isAuthenticated } = useAuth()
  const { currentBusiness } = useBusiness()
  const { theme, toggleSidebar } = useUI()
  
  return (
    // Component JSX
  )
}
```

### 5. Real-Time Data Hooks (`lib/hooks/useRealtimeData.ts`)

**Purpose:** Supabase real-time subscriptions for live data updates

**Key Hooks:**
- `useRealtimeData<T>()` - Subscribe to table changes with INSERT/UPDATE/DELETE events
- `useRealtimeSingle<T>()` - Subscribe to single record updates
- `useRealtimeCount()` - Real-time count tracking

**Usage Pattern:**
```typescript
import { useRealtimeData } from '@/lib/hooks/useRealtimeData'

function ContactsList() {
  const { data: contacts, loading, error, refresh } = useRealtimeData(
    'contacts',
    businessId,
    {
      onInsert: (newContact) => console.log('New contact:', newContact),
      onUpdate: (updated) => console.log('Contact updated:', updated),
    }
  )
  
  return contacts.map(c => <Contact key={c.id} {...c} />)
}
```

### 6. Dashboard Widgets (`components/dashboard/DashboardWidget.tsx`)

**Purpose:** Reusable widget component system with CVA variants

**Components:**
- `DashboardWidget` - Base widget with header, loading, error states
- `MetricWidget` - Display numeric metrics with change indicators
- `ChartWidget` - Container for chart visualizations
- `TableWidget` - Sortable/filterable data tables
- `WidgetGrid` - Responsive grid layout (1-4 cols)

**Usage Pattern:**
```typescript
import { MetricWidget, ChartWidget, WidgetGrid } from '@/components/dashboard/DashboardWidget'

function DashboardPage() {
  return (
    <WidgetGrid>
      <MetricWidget
        title="Total Revenue"
        value="$45,231"
        change={{ value: 12, direction: 'up', period: 'vs last month' }}
      />
      <ChartWidget title="Revenue Trend" size="lg">
        {/* Chart content */}
      </ChartWidget>
    </WidgetGrid>
  )
}
```

### 7. API Response Utilities (`lib/services/api.service.ts`)

**Purpose:** Standardized API responses and middleware for Next.js routes

**Key Utilities:**
- `apiRouteHandler()` - Wrapper middleware extracting businessId, error handling, logging
- `successResponse()` / `errorResponse()` - Standardized response builders
- `paginatedResponse()` - Pagination metadata helper
- `validateRequestBody()` - Zod validation middleware
- `extractBusinessId()` - Multi-source business ID extraction

**Usage Pattern:**
```typescript
import {
  apiRouteHandler,
  successResponse,
  errorResponse,
  validateRequestBody,
} from '@/lib/services/api.service'

export async function GET(request: NextRequest) {
  return apiRouteHandler(async (req, requestId, businessId) => {
    // businessId already extracted, business isolation guaranteed
    const data = await fetchData(businessId)
    return successResponse(data, 200, requestId)
  }, request)
}
```

## 🔄 Week 2 Integration Tasks

### Task 1: Middleware Integration
**File:** `middleware.ts`

Add error handling, logging, and business context injection to root middleware:

```typescript
import { logger } from '@/lib/services'
import { AppError } from '@/lib/services'

export async function middleware(request: NextRequest) {
  const requestId = generateRequestId()
  
  logger.info(`[${request.method}] ${request.nextUrl.pathname}`, {
    requestId,
  })
  
  // ... existing middleware logic
}
```

### Task 2: API Route Migration
**Files:** `app/api/**/*.ts`

Migrate existing API routes to use new patterns:

```typescript
// OLD
export async function GET(request: NextRequest) {
  try {
    const businessId = request.headers.get('X-Business-ID')
    // ...
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// NEW
export async function GET(request: NextRequest) {
  return apiRouteHandler(async (req, requestId, businessId) => {
    // businessId handled, errors caught, responses standardized
    const data = await fetchData(businessId)
    return successResponse(data, 200, requestId)
  }, request)
}
```

### Task 3: Component Migration to Zustand
**Files:** `components/**/*.tsx`, `app/**/*.tsx`

Migrate React Context usage to Zustand selectors:

```typescript
// OLD - React Context
import { useBusinessContext } from '@/lib/context/BusinessContext'

function Component() {
  const { business } = useBusinessContext()
}

// NEW - Zustand
import { useBusiness } from '@/lib/store/useAppStore'

function Component() {
  const { currentBusiness } = useBusiness()
}
```

### Task 4: Dashboard Enhancement
**Files:** `app/dashboard/**/*.tsx`

Implement real-time data in dashboard pages:

```typescript
import { useRealtimeData } from '@/lib/hooks/useRealtimeData'
import { MetricWidget, ChartWidget, WidgetGrid } from '@/components/dashboard/DashboardWidget'

export default function AnalyticsDashboard() {
  const { data: metrics, loading } = useRealtimeData('analytics_events', businessId)
  
  return (
    <WidgetGrid>
      <MetricWidget
        title="Revenue"
        value={metrics.length > 0 ? metrics[0].value : 0}
        loading={loading}
      />
    </WidgetGrid>
  )
}
```

### Task 5: Service Integration
**Files:** All service layer files

Use new services in existing domain services:

```typescript
// lib/services/crm.ts
import { logger, AppError, handleError, validateInput } from '@/lib/services'
import { contactSchema } from '@/lib/services'

export class CRMService {
  async createContact(data: unknown) {
    try {
      const validatedData = await validateInput(contactSchema, data)
      
      logger.info('Creating contact', { email: validatedData.email })
      
      // Implementation
    } catch (error) {
      const appError = handleError(error)
      logger.error('Contact creation failed', { error: appError.message })
      throw appError
    }
  }
}
```

## 📋 Implementation Checklist

### Week 2 Day 1-2: Service Integration
- [ ] Update middleware.ts to use error handling and logging
- [ ] Create 5 example API routes using new patterns
- [ ] Document API response format for frontend team

### Week 2 Day 3-5: Component Updates
- [ ] Migrate React Context to Zustand in all components
- [ ] Implement DashboardWidget system
- [ ] Create real-time hooks for 5 main tables

### Week 2 Day 6-10: Dashboard Enhancement
- [ ] Implement real-time data in Analytics dashboard
- [ ] Enhance CRM dashboard with live contact count
- [ ] Build Leads scoring dashboard
- [ ] Implement Sales Pipeline with real-time updates
- [ ] Add Appointments calendar with real-time sync

### Week 2 Day 11-14: Testing & Optimization
- [ ] Unit tests for error handling
- [ ] Integration tests for API routes
- [ ] Performance optimization (Lighthouse 85+)
- [ ] Accessibility audit (WCAG 2.1 AA)

## 🚀 Best Practices

### Error Handling
- Always use `handleError()` in try-catch blocks
- Throw `AppError` with specific error codes
- Include context in error details for debugging
- Log errors at appropriate levels (WARN for business, ERROR for system)

### Logging
- Use consistent log levels: DEBUG (dev only), INFO (important events), WARN (potential issues), ERROR (failures), FATAL (system critical)
- Always include businessId in context for multi-tenant debugging
- Include requestId for distributed tracing
- Avoid logging sensitive data (passwords, tokens, PII)

### Validation
- Validate all external inputs (API requests, query params)
- Use Zod schemas for type safety
- Provide helpful validation error messages
- Document expected input formats in API docs

### State Management
- Use selector hooks (`useAuth()`, `useBusiness()`, `useUI()`) for performance
- Keep UI state separate from domain data
- Use persist middleware only for non-sensitive data
- Clear sensitive data on logout

### Real-Time Subscriptions
- Always unsubscribe when component unmounts (handled by hook)
- Use business_id filtering to prevent data leaks
- Handle connection failures gracefully
- Implement exponential backoff for retries

### API Design
- Use `apiRouteHandler()` wrapper for all routes
- Extract businessId automatically from headers/params
- Return standardized response format
- Include pagination metadata for list endpoints
- Use appropriate HTTP status codes

## 📚 References

- **Error Codes:** See `ErrorCodes` enum in `lib/services/error.service.ts`
- **Log Levels:** See `LogLevel` type in `lib/services/logger.service.ts`
- **Validation Schemas:** See schemas in `lib/services/validators/schemas.ts`
- **Widget Variants:** See CVA configuration in `components/dashboard/DashboardWidget.tsx`
- **API Patterns:** See examples in `app/api/analytics/dashboard/route.ts`

## 🔧 Troubleshooting

### "Cannot find module '@/lib/services'"
- Ensure all service files are created: error.service.ts, logger.service.ts, validators/schemas.ts, api.service.ts
- Verify services/index.ts exports all modules
- Check tsconfig.json path alias `@` points to root

### Zustand store not persisting
- Verify localStorage is enabled in browser
- Check persist middleware in useAppStore.ts
- Ensure partialize() only includes non-sensitive data

### Real-time updates not working
- Verify Supabase real-time is enabled in project settings
- Check Row-Level Security (RLS) policies allow reads
- Ensure business_id filter is applied correctly
- Check browser console for subscription errors

### API route returns wrong business context
- Verify X-Business-ID header is being sent
- Check extractBusinessId() is trying all sources
- Ensure middleware sets business context on request

## 📞 Support

For questions or issues:
1. Check the implementation guide at PHASE_1_IMPLEMENTATION_GUIDE.md
2. Review existing service documentation
3. Check architecture guide at ARCHITECTURE_DESIGN.md
4. Consult database schema at DATABASE_SCHEMA_REFERENCE.md
