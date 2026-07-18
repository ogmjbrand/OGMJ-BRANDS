// Domain-specific types for the OGMJ Brands database schema

// Lead Management Types
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted' | 'lost'
export type LeadTemperature = 'hot' | 'warm' | 'cold'

// Appointment Types
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'

// Email Sequence Types
export type SequenceStatus = 'draft' | 'active' | 'paused' | 'archived'

// Product Types
export type ProductType = 'physical' | 'digital' | 'service' | 'subscription' | 'course'
export type ProductStatus = 'draft' | 'active' | 'out_of_stock' | 'archived'

// Messaging Types
export type MessageType = 'text' | 'image' | 'file' | 'system' | 'mention'

// Workspace Types
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'

// UI Component State Types
export interface Lead {
  id: string
  business_id: string
  contact_id: string
  status: LeadStatus
  temperature: LeadTemperature
  lead_score: number
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  business_id: string
  contact_id: string
  status: AppointmentStatus
  title: string
  description?: string
  start_time: string
  end_time: string
  location?: string
  created_at: string
  updated_at: string
}

export interface EmailSequence {
  id: string
  business_id: string
  name: string
  description?: string
  status: SequenceStatus
  total_enrolled?: number
  total_completed?: number
  total_unsubscribed?: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  business_id: string
  name: string
  description?: string
  type: ProductType
  status: ProductStatus
  price: number
  currency: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  business_id: string
  conversation_id: string
  sender_id: string
  type: MessageType
  content: string
  created_at: string
}

export interface Conversation {
  id: string
  business_id: string
  title: string | null
  created_at: string
  updated_at: string
}

// Feature Flag Type
export interface FeatureFlag {
  id: string
  name: string
  enabled: boolean
  plan: string
}


