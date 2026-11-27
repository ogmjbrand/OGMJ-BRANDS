import { NextRequest } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/api'
import { getResendClient, isResendConfigured, RESEND_FROM_EMAIL } from '@/lib/email/resend'
import { SITE } from '@/lib/marketing/content'
import { ENQUIRY_BUDGET_OPTIONS, ENQUIRY_SERVICE_OPTIONS } from '@/lib/marketing/agency'
import { agencyEnquirySchema, escapeHtml, labelFor } from '@/lib/validators/agency-enquiry'
import { clientIpFrom, createIpThrottle } from '@/lib/utils/ip-throttle'

/**
 * POST /api/agency-enquiry — business enquiries from /agency.
 *
 * Unlike a log-only form, this route only reports success when the
 * enquiry was actually delivered to OGMJ's inbox, so a prospect is never
 * told "we got it" when nobody did. If email is not configured or the
 * send fails, it returns 503 and the page shows direct contact options.
 */

const NOTIFICATION_EMAIL = process.env.AGENCY_ENQUIRY_EMAIL || process.env.CONTACT_NOTIFICATION_EMAIL || SITE.email

// 5 enquiries per 10 minutes per IP (best-effort, per instance).
const throttle = createIpThrottle({ windowMs: 10 * 60 * 1000, max: 5 })

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return createErrorResponse('Invalid request', 400)
  }

  // Honeypot filled in: a bot. Pretend success, send nothing.
  if (body && typeof body === 'object' && typeof (body as Record<string, unknown>).website_url_confirm === 'string' && (body as Record<string, string>).website_url_confirm.trim() !== '') {
    return createSuccessResponse({ received: true })
  }

  if (throttle.isThrottled(clientIpFrom(request.headers))) {
    return createErrorResponse('Too many enquiries from this connection. Please try again in a few minutes.', 429)
  }

  const parsed = agencyEnquirySchema.safeParse(body)
  if (!parsed.success) {
    return createErrorResponse(parsed.error.issues[0]?.message || 'Please check the form and try again', 400)
  }
  const enquiry = parsed.data

  console.log('[Agency Enquiry]', {
    company: enquiry.company || 'N/A',
    service: enquiry.service,
    country: enquiry.country || 'N/A',
    timestamp: new Date().toISOString(),
  })

  if (!isResendConfigured()) {
    console.error('[Agency Enquiry] RESEND_API_KEY is not set; enquiry could not be delivered')
    return createErrorResponse('Our enquiry form is temporarily unavailable. Please email or WhatsApp us directly.', 503)
  }

  const serviceLabel = labelFor(ENQUIRY_SERVICE_OPTIONS, enquiry.service)
  const budgetLabel = labelFor(ENQUIRY_BUDGET_OPTIONS, enquiry.budget)
  const rows: Array<[string, string]> = [
    ['Name', enquiry.name],
    ['Email', enquiry.email],
    ['Company', enquiry.company || 'N/A'],
    ['Website', enquiry.website || 'N/A'],
    ['Country', enquiry.country || 'N/A'],
    ['Service', serviceLabel],
    ['Budget', budgetLabel],
  ]
  const html = `
    <h2>New agency enquiry</h2>
    <table cellpadding="6">${rows
      .map(([label, value]) => `<tr><td><strong>${label}</strong></td><td>${escapeHtml(value)}</td></tr>`)
      .join('')}</table>
    <p><strong>Message</strong></p>
    <p>${escapeHtml(enquiry.message).replace(/\n/g, '<br/>')}</p>
  `
  const text = `${rows.map(([label, value]) => `${label}: ${value}`).join('\n')}\n\nMessage:\n${enquiry.message}`

  try {
    const { error } = await getResendClient().emails.send({
      from: RESEND_FROM_EMAIL,
      to: NOTIFICATION_EMAIL,
      replyTo: enquiry.email,
      subject: `Agency enquiry: ${serviceLabel} — ${enquiry.company || enquiry.name}`.slice(0, 200),
      html,
      text,
    })
    if (error) throw new Error(error.message)
  } catch (sendError) {
    console.error('[Agency Enquiry] Failed to deliver enquiry email:', sendError)
    return createErrorResponse('We could not send your enquiry right now. Please email or WhatsApp us directly.', 503)
  }

  return createSuccessResponse({ received: true }, 'Enquiry received')
}
