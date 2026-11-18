import { z } from 'zod'
import { ENQUIRY_BUDGET_OPTIONS, ENQUIRY_SERVICE_OPTIONS } from '@/lib/marketing/agency'

const serviceValues = ENQUIRY_SERVICE_OPTIONS.map((option) => option.value) as [string, ...string[]]
const budgetValues = ENQUIRY_BUDGET_OPTIONS.map((option) => option.value) as [string, ...string[]]

const trimmed = (max: number) => z.string().trim().max(max)

/**
 * Server-side validation for /api/agency-enquiry.
 * `website_url_confirm` is a honeypot: humans never see or fill it.
 */
export const agencyEnquirySchema = z.object({
  name: trimmed(120).min(2, 'Please enter your name'),
  email: trimmed(200).email('Please enter a valid email address'),
  company: trimmed(160).optional().default(''),
  website: trimmed(300).optional().default(''),
  country: trimmed(80).optional().default(''),
  service: z.enum(serviceValues, { errorMap: () => ({ message: 'Please choose a service' }) }),
  budget: z.enum(budgetValues).optional().default('not-sure'),
  message: trimmed(4000).min(10, 'Please tell us a little about your business (at least 10 characters)'),
  // Honeypot. The route checks it before validation and silently drops bot submissions.
  website_url_confirm: z.string().max(500).optional().default(''),
})

export type AgencyEnquiry = z.infer<typeof agencyEnquirySchema>

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function labelFor(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}
