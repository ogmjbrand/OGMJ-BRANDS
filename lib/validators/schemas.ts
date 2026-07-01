/**
 * OGMJ BRANDS — Zod Validation Schemas
 * Input validation for all main resources
 * Last Updated: July 1, 2026
 */

import { z } from 'zod'

// ================================
// COMMON SCHEMAS
// ================================

export const UUIDSchema = z.string().uuid('Invalid UUID format')

export const EmailSchema = z.string().email('Invalid email address')

export const CurrencySchema = z.enum(['NGN', 'USD', 'EUR', 'GBP'])

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

// ================================
// CONTACT SCHEMAS
// ================================

export const CreateContactSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: EmailSchema.optional(),
  phone: z.string().max(20).optional(),
  company_name: z.string().max(255).optional(),
  job_title: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  status: z.enum(['lead', 'prospect', 'customer', 'inactive']).default('lead'),
  source: z
    .enum(['website', 'referral', 'email', 'social', 'api', 'manual'])
    .default('manual'),
  assigned_to: UUIDSchema.optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export const UpdateContactSchema = CreateContactSchema.partial()

export const ContactFiltersSchema = z.object({
  status: z.enum(['lead', 'prospect', 'customer', 'inactive']).optional(),
  source: z
    .enum(['website', 'referral', 'email', 'social', 'api', 'manual'])
    .optional(),
  assigned_to: UUIDSchema.optional(),
  search: z.string().optional(),
  ...PaginationSchema.shape,
})

export type CreateContact = z.infer<typeof CreateContactSchema>
export type UpdateContact = z.infer<typeof UpdateContactSchema>
export type ContactFilters = z.infer<typeof ContactFiltersSchema>

// ================================
// DEAL SCHEMAS
// ================================

export const CreateDealSchema = z.object({
  contact_id: UUIDSchema,
  title: z.string().min(1, 'Deal title is required').max(255),
  description: z.string().optional(),
  value: z.number().positive('Deal value must be positive'),
  currency: CurrencySchema.default('USD'),
  status: z.enum(['open', 'in_progress', 'won', 'lost']).default('open'),
  stage: z
    .enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'decision'])
    .default('prospecting'),
  probability: z.number().int().min(0).max(100).default(0),
  expected_close_date: z.string().datetime().optional(),
  assigned_to: UUIDSchema.optional(),
})

export const UpdateDealSchema = CreateDealSchema.partial()

export const DealFiltersSchema = z.object({
  status: z.enum(['open', 'in_progress', 'won', 'lost']).optional(),
  stage: z
    .enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'decision'])
    .optional(),
  assigned_to: UUIDSchema.optional(),
  ...PaginationSchema.shape,
})

export type CreateDeal = z.infer<typeof CreateDealSchema>
export type UpdateDeal = z.infer<typeof UpdateDealSchema>
export type DealFilters = z.infer<typeof DealFiltersSchema>

// ================================
// INVOICE SCHEMAS
// ================================

export const CreateInvoiceSchema = z.object({
  contact_id: UUIDSchema.optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: CurrencySchema.default('USD'),
  tax_amount: z.number().default(0),
  discount_amount: z.number().default(0),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  due_date: z.string().datetime(),
  notes: z.string().optional(),
  line_items: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.number().positive(),
        unit_price: z.number().positive(),
      })
    )
    .optional(),
})

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial()

export const InvoiceFiltersSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  ...PaginationSchema.shape,
})

export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>
export type InvoiceFilters = z.infer<typeof InvoiceFiltersSchema>

// ================================
// SEQUENCE SCHEMAS
// ================================

export const CreateSequenceSchema = z.object({
  name: z.string().min(1, 'Sequence name is required').max(255),
  description: z.string().optional(),
  trigger_type: z.enum(['immediate', 'delay', 'condition', 'date']).default('immediate'),
  trigger_config: z.record(z.any()).optional(),
  status: z.enum(['active', 'inactive', 'draft']).default('draft'),
})

export const UpdateSequenceSchema = CreateSequenceSchema.partial()

export type CreateSequence = z.infer<typeof CreateSequenceSchema>
export type UpdateSequence = z.infer<typeof UpdateSequenceSchema>

// ================================
// BUSINESS SETTINGS SCHEMAS
// ================================

export const UpdateBusinessSettingsSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  website_url: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  billing_email: EmailSchema.optional(),
  settings: z.record(z.any()).optional(),
})

export type UpdateBusinessSettings = z.infer<typeof UpdateBusinessSettingsSchema>

// ================================
// VALIDATION UTILITY
// ================================

export async function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
  return schema.parseAsync(data)
}

export function validateInputSync<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}
