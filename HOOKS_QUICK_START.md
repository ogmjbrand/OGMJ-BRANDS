# Quick Start Guide - Feature Implementation

## Overview

This guide shows you how to use the new hooks to quickly implement features for OGMJ Brands.

---

## 1. Using the Leads Hook

### Basic Setup

```typescript
'use client'

import { useLeads } from '@/lib/hooks'

export function LeadsPage({ businessId }: { businessId: string }) {
  const { leads, stats, loading, error } = useLeads(businessId)

  if (loading) return <div>Loading leads...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Leads Management</h1>
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Total Leads</p>
          <p className="text-3xl font-bold">{stats?.total_leads}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Hot Leads</p>
          <p className="text-3xl font-bold text-red-500">{stats?.hot_count}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Warm Leads</p>
          <p className="text-3xl font-bold text-yellow-500">{stats?.warm_count}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Cold Leads</p>
          <p className="text-3xl font-bold text-blue-500">{stats?.cold_count}</p>
        </Card>
      </div>

      <LeadsList leads={leads} />
    </div>
  )
}
```

### Updating Lead Status

```typescript
function LeadCard({ lead, onStatusChange }) {
  const { updateLeadStatus, updateLeadTemperature } = useLeads(businessId)

  const handleStatusChange = async (newStatus) => {
    await updateLeadStatus(lead.id, newStatus)
  }

  const handleTemperatureChange = async (newTemp) => {
    await updateLeadTemperature(lead.id, newTemp)
  }

  return (
    <div>
      <h3>{lead.contact?.first_name} {lead.contact?.last_name}</h3>
      <select value={lead.status} onChange={(e) => handleStatusChange(e.target.value)}>
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="qualified">Qualified</option>
        <option value="unqualified">Unqualified</option>
        <option value="converted">Converted</option>
        <option value="lost">Lost</option>
      </select>
    </div>
  )
}
```

---

## 2. Using the Appointments Hook

### Calendar View Example

```typescript
'use client'

import { useAppointments } from '@/lib/hooks'
import { useState } from 'react'

export function AppointmentsPage({ businessId }: { businessId: string }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { appointments, loading, createAppointment, updateStatus } = 
    useAppointments(businessId, currentMonth)

  const handleBookAppointment = async (appointment) => {
    const error = await createAppointment({
      business_id: businessId,
      contact_id: appointment.contactId,
      title: appointment.title,
      description: appointment.description,
      start_time: appointment.startTime,
      end_time: appointment.endTime,
      location: appointment.location,
      status: 'scheduled',
    })

    if (!error) {
      alert('Appointment booked successfully!')
    }
  }

  return (
    <div>
      <h1>Appointments & Calendar</h1>
      <CalendarView
        appointments={appointments}
        onDateSelect={(date) => showBookingForm(date)}
      />
      <AppointmentsList
        appointments={appointments}
        onStatusChange={(id, status) => updateStatus(id, status)}
      />
    </div>
  )
}
```

---

## 3. Using the Email Sequences Hook

### Sequence Builder

```typescript
'use client'

import { useEmailSequences } from '@/lib/hooks'

export function SequencesPage({ businessId }: { businessId: string }) {
  const { sequences, loading, createSequence, updateStatus, deleteSequence } = 
    useEmailSequences(businessId)

  const handleCreateSequence = async (sequenceData) => {
    const error = await createSequence({
      name: sequenceData.name,
      description: sequenceData.description,
      business_id: businessId,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      id: '',
    })

    if (!error) {
      alert('Sequence created!')
    }
  }

  const handleLaunchSequence = async (sequenceId) => {
    await updateStatus(sequenceId, 'active')
  }

  return (
    <div>
      <h1>Email Sequences</h1>
      <button onClick={() => showCreateModal()}>Create New Sequence</button>

      <div className="mt-6">
        {sequences.map((seq) => (
          <SequenceCard
            key={seq.id}
            sequence={seq}
            onLaunch={() => handleLaunchSequence(seq.id)}
            onDelete={() => deleteSequence(seq.id)}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## 4. Using the Conversations Hook

### Team Inbox

```typescript
'use client'

import { useConversations } from '@/lib/hooks'
import { useEffect } from 'react'

export function InboxPage({ businessId }: { businessId: string }) {
  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    sendMessage,
    createConversation,
  } = useConversations(businessId)

  const handleSendMessage = async (content) => {
    await sendMessage(content, 'text')
  }

  const handleNewConversation = async () => {
    const newConv = await createConversation('New Discussion')
    if (newConv) {
      setSelectedConversation(newConv)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-4 h-screen">
      {/* Conversations List */}
      <div className="border-r">
        <button onClick={handleNewConversation}>New Conversation</button>
        <div className="mt-4">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`p-3 cursor-pointer ${
                selectedConversation?.id === conv.id ? 'bg-blue-100' : ''
              }`}
            >
              <p className="font-semibold">{conv.subject}</p>
              <p className="text-xs text-gray-500">
                {new Date(conv.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Messages View */}
      <div className="col-span-2 flex flex-col">
        {selectedConversation ? (
          <>
            <h2 className="p-4 border-b font-bold">{selectedConversation.subject}</h2>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
            <MessageInput onSend={handleSendMessage} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 5. Using the Products Hook

### Product Catalog

```typescript
'use client'

import { useProducts } from '@/lib/hooks'

export function ProductsPage({ businessId }: { businessId: string }) {
  const { products, loading, createProduct, updateProduct, deleteProduct } = 
    useProducts(businessId)

  const handleCreateProduct = async (productData) => {
    const error = await createProduct({
      business_id: businessId,
      name: productData.name,
      description: productData.description,
      type: productData.type,
      status: 'draft',
      price: productData.price,
      currency: 'USD',
    })

    if (!error) {
      alert('Product created!')
    }
  }

  return (
    <div>
      <h1>Product Catalog</h1>
      <button onClick={() => showProductModal()}>Add Product</button>

      <div className="grid grid-cols-4 gap-4 mt-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={(data) => updateProduct(product.id, data)}
            onDelete={() => deleteProduct(product.id)}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## 6. Using Feature Flags

### Conditional Rendering

```typescript
'use client'

import { useFeatureFlags } from '@/lib/hooks'

export function DashboardPage({ businessId }: { businessId: string }) {
  const { isFeatureEnabled, hasFeature, loading } = useFeatureFlags(businessId)

  if (loading) return <div>Loading features...</div>

  return (
    <div>
      {hasFeature('leads_management') && (
        <Section title="Leads">
          <LeadsWidget />
        </Section>
      )}

      {hasFeature('appointment_booking') && (
        <Section title="Appointments">
          <AppointmentsWidget />
        </Section>
      )}

      {hasFeature('email_sequences') && (
        <Section title="Email Sequences">
          <SequencesWidget />
        </Section>
      )}

      {hasFeature('team_messaging') && (
        <Section title="Team Inbox">
          <InboxWidget />
        </Section>
      )}

      {hasFeature('product_catalog') && (
        <Section title="Products">
          <ProductsWidget />
        </Section>
      )}

      {hasFeature('advanced_reporting') && (
        <Section title="Advanced Reports">
          <ReportingWidget />
        </Section>
      )}
    </div>
  )
}
```

---

## File Structure

```
app/
  dashboard/
    leads/
      page.tsx          # Leads page
    appointments/
      page.tsx          # Appointments & calendar
    sequences/
      page.tsx          # Email sequences
    inbox/
      page.tsx          # Team messaging
    products/
      page.tsx          # Product catalog

lib/
  hooks/
    useLeads.ts
    useAppointments.ts
    useEmailSequences.ts
    useConversations.ts
    useProducts.ts
    useFeatureFlags.ts
    index.ts

  types/
    database.ts         # Type definitions
```

---

## Common Patterns

### Error Handling

All hooks return `error` which is a string or null:

```typescript
const { error, leads } = useLeads(businessId)

if (error) {
  return <ErrorAlert message={error} />
}
```

### Loading States

All hooks have a `loading` boolean:

```typescript
const { loading, leads } = useLeads(businessId)

if (loading) {
  return <LoadingSpinner />
}
```

### Refetching Data

All hooks have a `refetch` function:

```typescript
const { refetch } = useLeads(businessId)

// After creating/updating
await refetch()
```

---

## Next Steps

1. **Choose a feature** - Start with Leads or Appointments
2. **Create the page** - Use the examples above
3. **Add UI components** - Use your existing Lucide icons and Tailwind
4. **Test** - Verify data loads and CRUD operations work
5. **Deploy** - Once tested, deploy to production

---

## Need Help?

- Check `IMPLEMENTATION_ROADMAP.md` for detailed architecture
- Look at existing components in `/app/dashboard/` for patterns
- All hooks follow the same error/loading/refetch pattern
- Database tables must exist in Supabase before using hooks

**Status**: All hooks are production-ready and tested ✅
