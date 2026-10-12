import { NextRequest } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/api'
import { getResendClient, isResendConfigured, RESEND_FROM_EMAIL } from '@/lib/email/resend'
import { SITE } from '@/lib/marketing/content'

// Reuses the address already shown on the marketing site as OGMJ's own
// contact email, rather than inventing a new one. Override with
// CONTACT_NOTIFICATION_EMAIL if a different inbox should receive these.
const CONTACT_NOTIFICATION_EMAIL = process.env.CONTACT_NOTIFICATION_EMAIL || SITE.email

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, message, company } = body

    if (!name || !email || !message) {
      return createErrorResponse('Name, email, and message are required', 400)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email address', 400)
    }

    console.log('[Contact Inquiry]', {
      name,
      email,
      company: company || 'N/A',
      message,
      timestamp: new Date().toISOString(),
    })

    // This form was previously a dead end — every submission only ever
    // reached the server log, with nothing sent to anyone. Best-effort:
    // a transient Resend failure shouldn't fail the inquiry itself, since
    // it was already captured above.
    if (isResendConfigured()) {
      try {
        await getResendClient().emails.send({
          from: RESEND_FROM_EMAIL,
          to: CONTACT_NOTIFICATION_EMAIL,
          replyTo: email,
          subject: `New contact inquiry from ${name}${company ? ` (${company})` : ''}`,
          html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p><strong>Company:</strong> ${company || 'N/A'}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br/>')}</p>`,
        })
      } catch (emailError) {
        console.error('Failed to send contact notification email:', emailError)
      }
    }

    return createSuccessResponse({ message: 'Message received' })
  } catch {
    return createErrorResponse('Failed to process contact form', 500)
  }
}


