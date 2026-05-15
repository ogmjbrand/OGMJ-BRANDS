# OGMJ Brands - Frontend Implementation Guide

## Overview
This guide outlines the implementation of six key features that connect to your existing Supabase backend. Each feature includes data models, API hooks, and UI components.

---

## 1. Leads Page & Dashboard Widget

### Database Tables
- `contacts` - core contact information
- `leads` (extends contacts with sales-specific fields)
- `lead_scores` - calculated lead scoring

### Implementation Steps

#### Step 1: Create Leads API Hook
```typescript
// lib/hooks/useLeads.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Lead } from '@/lib/types/database'

export function useLeads(businessId: string) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeadsWithStats()
  }, [businessId])

  const fetchLeadsWithStats = async () => {
    const supabase = createClient()
    
    // Call get_lead_stats() RPC
    const { data: statsData } = await supabase
      .rpc('get_lead_stats', { p_business_id: businessId })
    
    // Get leads list
    const { data: leadsData } = await supabase
      .from('leads')
      .select(`
        *,
        contact:contacts(first_name, last_name, email)
      `)
      .eq('business_id', businessId)
      .order('lead_score', { ascending: false })

    setLeads(leadsData || [])
    setStats(statsData?.[0] || null)
    setLoading(false)
  }

  return { leads, stats, loading, refetch: fetchLeadsWithStats }
}
```

#### Step 2: Create Leads Dashboard Widget
```typescript
// components/dashboard/LeadsDashboardWidget.tsx
'use client'

import { useLeads } from '@/lib/hooks/useLeads'
import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

export function LeadsDashboardWidget({ businessId }: { businessId: string }) {
  const { stats, loading } = useLeads(businessId)

  if (loading) return <Card className="p-6"><div>Loading...</div></Card>

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Active Leads</p>
          <p className="text-3xl font-bold">{stats?.active_count || 0}</p>
          <p className="text-xs text-gray-500 mt-2">
            {stats?.hot_count} hot • {stats?.warm_count} warm • {stats?.cold_count} cold
          </p>
        </div>
        <TrendingUp className="w-8 h-8 text-[#D4AF37]" />
      </div>
    </Card>
  )
}
```

#### Step 3: Create Full Leads Page
Route: `/app/dashboard/leads`

---

## 2. Appointment Booking & Calendar

### Database Tables
- `appointments` - booking records
- `appointment_slots` - availability blocks

### Implementation Steps

#### Step 1: Create Calendar Hook
```typescript
// lib/hooks/useAppointments.ts
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentStatus } from '@/lib/types/database'

export function useAppointments(businessId: string, month?: Date) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointments()
  }, [businessId, month])

  const fetchAppointments = async () => {
    const supabase = createClient()
    const startOfMonth = month ? new Date(month.getFullYear(), month.getMonth(), 1) : new Date()
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0)

    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('business_id', businessId)
      .gte('start_time', startOfMonth.toISOString())
      .lte('start_time', endOfMonth.toISOString())
      .order('start_time')

    setAppointments(data || [])
    setLoading(false)
  }

  const createAppointment = useCallback(async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .insert([appointment])

    if (!error) await fetchAppointments()
    return error
  }, [businessId])

  const updateStatus = useCallback(async (appointmentId: string, status: AppointmentStatus) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', appointmentId)

    if (!error) await fetchAppointments()
    return error
  }, [businessId])

  return { appointments, loading, createAppointment, updateStatus }
}
```

#### Step 2: Create Calendar Component
Route: `/app/dashboard/appointments`

---

## 3. Email Sequences & Automation

### Database Tables
- `email_sequences` - sequence definitions
- `sequence_enrollments` - contact enrollments
- `sequence_emails` - individual email steps

### Implementation Steps

#### Step 1: Create Sequence Hook
```typescript
// lib/hooks/useEmailSequences.ts
import { createClient } from '@/lib/supabase/client'
import type { EmailSequence, SequenceStatus } from '@/lib/types/database'

export function useEmailSequences(businessId: string) {
  const [sequences, setSequences] = useState<EmailSequence[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSequences()
  }, [businessId])

  const fetchSequences = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('email_sequences')
      .select('*, sequence_enrollments(count)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    setSequences(data || [])
    setLoading(false)
  }

  const createSequence = async (sequence: Omit<EmailSequence, 'id' | 'created_at' | 'updated_at'>) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('email_sequences')
      .insert([sequence])

    if (!error) await fetchSequences()
    return error
  }

  const updateStatus = async (sequenceId: string, status: SequenceStatus) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('email_sequences')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', sequenceId)

    if (!error) await fetchSequences()
    return error
  }

  return { sequences, loading, createSequence, updateStatus }
}
```

Route: `/app/dashboard/sequences`

---

## 4. Team Messaging & Inbox

### Database Tables
- `conversations` - message threads
- `messages` - individual messages
- `conversation_participants` - member access

### Implementation Steps

#### Step 1: Create Messaging Hook
```typescript
// lib/hooks/useConversations.ts
import { createClient } from '@/lib/supabase/client'
import type { Conversation, Message, MessageType } from '@/lib/types/database'

export function useConversations(businessId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    fetchConversations()
  }, [businessId])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      subscribeToMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('conversations')
      .select('*, messages(count)')
      .eq('business_id', businessId)
      .order('updated_at', { ascending: false })

    setConversations(data || [])
  }

  const fetchMessages = async (conversationId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('messages')
      .select('*, sender:users(id, first_name, last_name, email)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    setMessages(data || [])
  }

  const subscribeToMessages = (conversationId: string) => {
    const supabase = createClient()
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }

  const sendMessage = async (content: string, type: MessageType = 'text') => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: selectedConversation!.id,
        business_id: businessId,
        sender_id: user!.id,
        content,
        type
      }])

    return error
  }

  return { conversations, selectedConversation, setSelectedConversation, messages, sendMessage }
}
```

Route: `/app/dashboard/inbox`

---

## 5. Product Catalog

### Database Tables
- `products` - product information
- `product_variants` - SKU variants
- `product_images` - media

### Implementation Steps

#### Step 1: Create Products Hook
```typescript
// lib/hooks/useProducts.ts
import { createClient } from '@/lib/supabase/client'
import type { Product, ProductStatus, ProductType } from '@/lib/types/database'

export function useProducts(businessId: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [businessId])

  const fetchProducts = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    setProducts(data || [])
    setLoading(false)
  }

  const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .insert([product])

    if (!error) await fetchProducts()
    return error
  }

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)

    if (!error) await fetchProducts()
    return error
  }

  return { products, loading, createProduct, updateProduct }
}
```

Route: `/app/dashboard/products`

---

## 6. Feature Gating by Subscription Tier

### Database Tables
- `feature_flags` - feature definitions
- `plan_features` - feature access by plan

### Implementation Steps

#### Step 1: Create Feature Flag Hook
```typescript
// lib/hooks/useFeatureFlags.ts
import { createClient } from '@/lib/supabase/client'

export function useFeatureFlags(businessId: string, planId?: string) {
  const [features, setFeatures] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (planId) fetchFeatureFlags()
  }, [businessId, planId])

  const fetchFeatureFlags = async () => {
    const supabase = createClient()
    
    // Get business subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('business_id', businessId)
      .single()

    // Get plan features
    const { data: planFeatures } = await supabase
      .from('plan_features')
      .select('feature_name, enabled')
      .eq('plan_id', subscription?.plan_id || 'free')

    const featureMap = {}
    planFeatures?.forEach(f => {
      featureMap[f.feature_name] = f.enabled
    })

    setFeatures(featureMap)
    setLoading(false)
  }

  const isFeatureEnabled = (featureName: string): boolean => {
    return features[featureName] ?? false
  }

  return { features, loading, isFeatureEnabled }
}
```

#### Step 2: Use in Components
```typescript
// Example usage in any component
const { isFeatureEnabled } = useFeatureFlags(businessId)

return (
  <>
    {isFeatureEnabled('email_sequences') && (
      <SequencesSection />
    )}
    
    {isFeatureEnabled('advanced_reporting') && (
      <AdvancedReportsSection />
    )}
  </>
)
```

---

## Implementation Roadmap

1. **Week 1-2**: Leads & Dashboard Widget
2. **Week 2-3**: Appointment Calendar
3. **Week 3-4**: Email Sequences
4. **Week 4-5**: Team Messaging
5. **Week 5-6**: Product Catalog
6. **Week 6+**: Feature Gating & Optimization

## Database Verification

Before implementing, verify all tables exist:

```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'leads', 'appointments', 'email_sequences', 
  'conversations', 'messages', 'products', 'feature_flags'
);
```

## Testing Checklist

- [ ] All hooks load data correctly
- [ ] Real-time subscriptions work (messaging)
- [ ] CRUD operations succeed
- [ ] Feature flags control visibility properly
- [ ] Performance acceptable with large datasets
- [ ] Error handling in place

---

**Next Action**: Choose which feature to implement first, then create the component structure in `/app/dashboard/`.
