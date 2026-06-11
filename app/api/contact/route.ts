import { NextRequest } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/api'

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

    // Log inquiry for now — wire to email service (Resend, SendGrid, etc.) in production
    console.log('[Contact Inquiry]', {
      name,
      email,
      company: company || 'N/A',
      message,
      timestamp: new Date().toISOString(),
    })

    return createSuccessResponse({ message: 'Message received' })
  } catch {
    return createErrorResponse('Failed to process contact form', 500)
  }
}
