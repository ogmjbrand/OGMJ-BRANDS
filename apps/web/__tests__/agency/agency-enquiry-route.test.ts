import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * /api/agency-enquiry must only report success when the enquiry was
 * actually delivered, must validate input server-side, must escape
 * user input in the notification email, and must drop honeypot bots.
 */

const sendMock = vi.fn()
let resendConfigured = true

vi.mock('@/lib/email/resend', () => ({
  isResendConfigured: () => resendConfigured,
  getResendClient: () => ({ emails: { send: sendMock } }),
  RESEND_FROM_EMAIL: 'OGMJ BRANDS <notifications@ogmjbrands.com>',
}))

const { POST } = await import('@/app/api/agency-enquiry/route')

let ipCounter = 0
function makeRequest(body: unknown, ip?: string) {
  return new NextRequest('http://localhost/api/agency-enquiry', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip ?? `10.0.0.${++ipCounter}` },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const valid = {
  name: 'Ada Founder',
  email: 'ada@example.com',
  company: 'Ada Skincare',
  website: 'adaskincare.com',
  country: 'United Kingdom',
  service: 'growth-audit',
  budget: '1k-5k',
  message: 'We sell premium skincare and want more online sales.',
}

beforeEach(() => {
  sendMock.mockReset()
  sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null })
  resendConfigured = true
})

describe('POST /api/agency-enquiry', () => {
  it('delivers a valid enquiry and returns success', async () => {
    const res = await POST(makeRequest(valid))
    expect(res.status).toBe(200)
    expect(sendMock).toHaveBeenCalledTimes(1)
    const payload = sendMock.mock.calls[0][0]
    expect(payload.replyTo).toBe('ada@example.com')
    expect(payload.subject).toContain('Free Growth Audit')
    expect(payload.text).toContain('Ada Skincare')
  })

  it('rejects missing required fields with 400 and sends nothing', async () => {
    const res = await POST(makeRequest({ ...valid, email: 'not-an-email' }))
    expect(res.status).toBe(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects an unknown service value', async () => {
    const res = await POST(makeRequest({ ...valid, service: 'free-money' }))
    expect(res.status).toBe(400)
  })

  it('rejects malformed JSON', async () => {
    const res = await POST(makeRequest('{not json'))
    expect(res.status).toBe(400)
  })

  it('escapes HTML in the notification email', async () => {
    await POST(makeRequest({ ...valid, company: '<script>alert(1)</script>', message: 'Hello <b>there</b> friend' }))
    const html: string = sendMock.mock.calls[0][0].html
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<b>there</b>')
  })

  it('silently drops honeypot submissions without sending', async () => {
    const res = await POST(makeRequest({ ...valid, website_url_confirm: 'http://spam.example' }))
    expect(res.status).toBe(200)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('returns 503 (not a false success) when email is not configured', async () => {
    resendConfigured = false
    const res = await POST(makeRequest(valid))
    expect(res.status).toBe(503)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('returns 503 when the email provider reports an error', async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: 'domain not verified' } })
    const res = await POST(makeRequest(valid))
    expect(res.status).toBe(503)
  })

  it('throttles repeated submissions from one IP', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      statuses.push((await POST(makeRequest(valid, '203.0.113.9'))).status)
    }
    expect(statuses.slice(0, 5).every((status) => status === 200)).toBe(true)
    expect(statuses[5]).toBe(429)
  })
})
