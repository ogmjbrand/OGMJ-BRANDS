import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { safeNextPath } from '@/lib/utils/safe-redirect'
import { validateNewPassword } from '@/lib/utils/password'
import { escapeHtml } from '@/lib/utils/html'
import {
  BLOG_POSTS,
  TEAM,
  TESTIMONIALS,
  getPublicBlogPosts,
  getPublicTeam,
  getPublicTestimonials,
} from '@/lib/marketing/content'

// ── Rate-limit mock for the AI usage-limit tests ────────────────────────────
const rateLimitMock = vi.fn()
vi.mock('@/lib/utils/rate-limit', () => ({ checkRateLimit: (opts: unknown) => rateLimitMock(opts) }))

const sendMock = vi.fn()
vi.mock('@/lib/email/resend', () => ({
  isResendConfigured: () => true,
  getResendClient: () => ({ emails: { send: sendMock } }),
  RESEND_FROM_EMAIL: 'OGMJ BRANDS <notifications@ogmjbrands.com>',
}))

const { enforceAIUsageLimit, AI_FEATURE_LIMITS, DAILY_AI_LIMIT } = await import('@/lib/ai/usage-limits')
const { POST: contactPOST } = await import('@/app/api/contact/route')

describe('password reset helpers', () => {
  it('only allows safe, allow-listed redirect targets', () => {
    expect(safeNextPath('/reset-password')).toBe('/reset-password')
    expect(safeNextPath('/dashboard/settings')).toBe('/dashboard/settings')
    expect(safeNextPath('//evil.com')).toBeNull()
    expect(safeNextPath('https://evil.com')).toBeNull()
    expect(safeNextPath('/\\evil.com')).toBeNull()
    expect(safeNextPath('/admin')).toBeNull()
    expect(safeNextPath(null)).toBeNull()
  })

  it('validates new passwords', () => {
    expect(validateNewPassword('short1', 'short1')).toMatch(/at least 8/)
    expect(validateNewPassword('longpassword', 'longpassword')).toMatch(/letter and one number/)
    expect(validateNewPassword('password123', 'password124')).toMatch(/do not match/)
    expect(validateNewPassword('password123', 'password123')).toBeNull()
  })
})

describe('AI usage limits', () => {
  beforeEach(() => rateLimitMock.mockReset())

  it('allows the call when both hourly and daily limits pass', async () => {
    rateLimitMock.mockResolvedValue({ allowed: true })
    expect(await enforceAIUsageLimit('biz-1', 'ai:generate', 'ads')).toBeNull()
    expect(rateLimitMock).toHaveBeenCalledWith(expect.objectContaining({ endpoint: 'ai:generate:ads', limit: AI_FEATURE_LIMITS['ai:generate'], windowMinutes: 60 }))
    expect(rateLimitMock).toHaveBeenCalledWith(expect.objectContaining({ endpoint: 'ai:daily', limit: DAILY_AI_LIMIT, windowMinutes: 1440 }))
  })

  it('returns 429 when the hourly feature limit is hit', async () => {
    rateLimitMock.mockResolvedValueOnce({ allowed: false })
    const res = await enforceAIUsageLimit('biz-1', 'ai:chat')
    expect(res?.status).toBe(429)
  })

  it('returns 429 when the daily budget is used up', async () => {
    rateLimitMock.mockResolvedValueOnce({ allowed: true }).mockResolvedValueOnce({ allowed: false })
    const res = await enforceAIUsageLimit('biz-1', 'ai:chat')
    expect(res?.status).toBe(429)
  })

  it('fails closed (503) when the limit cannot be checked', async () => {
    rateLimitMock.mockResolvedValueOnce({ allowed: false, error: 'db down' })
    const res = await enforceAIUsageLimit('biz-1', 'ai:chat')
    expect(res?.status).toBe(503)
  })
})

describe('every AI route is metered', () => {
  it('calls enforceAIUsageLimit in every route that calls the model', async () => {
    const { readFileSync } = await import('node:fs')
    const { execSync } = await import('node:child_process')
    // lib/workflows/runWorkflow.ts also calls the model (extracted from
    // app/api/workflows/[id]/run/route.ts so the Empire AI chat's
    // run_workflow tool can reuse it) -- included explicitly, not all of
    // lib, since lib/ai/websiteAssist.ts and friends intentionally call
    // the model without metering themselves: their callers (the routes)
    // meter before calling them, which the app/api scan below still checks.
    const files = execSync("grep -rl 'getAnthropicClient()' app/api lib/workflows", { cwd: process.cwd() }).toString().trim().split('\n')
    expect(files.length).toBeGreaterThan(10)
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).toContain('enforceAIUsageLimit(')
    }
  })
})

describe('contact form email', () => {
  beforeEach(() => sendMock.mockReset().mockResolvedValue({ data: { id: '1' }, error: null }))

  const post = (body: unknown) =>
    contactPOST(new NextRequest('http://localhost/api/contact', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }))

  it('escapes HTML from form input', async () => {
    const res = await post({ name: '<img src=x onerror=alert(1)>', email: 'a@b.co', message: 'hi <a href="http://x">click</a>' })
    expect(res.status).toBe(200)
    const html: string = sendMock.mock.calls[0][0].html
    expect(html).not.toContain('<img')
    expect(html).not.toContain('<a href')
    expect(html).toContain('&lt;img')
    expect(escapeHtml(`<"'&>`)).toBe('&lt;&quot;&#39;&amp;&gt;')
  })

  it('rejects non-string or oversized input', async () => {
    expect((await post({ name: { x: 1 }, email: 'a@b.co', message: 'hi' })).status).toBe(400)
    expect((await post({ name: 'A', email: 'a@b.co', message: 'x'.repeat(5001) })).status).toBe(400)
  })
})

describe('public proof verification gate', () => {
  it('hides unverified testimonials, team profiles and case studies', () => {
    expect(TESTIMONIALS.length).toBeGreaterThan(0)
    expect(TEAM.length).toBeGreaterThan(0)
    expect(getPublicTestimonials()).toHaveLength(0)
    expect(getPublicTeam()).toHaveLength(0)
    const publicSlugs = getPublicBlogPosts().map((post) => post.slug)
    expect(publicSlugs).not.toContain('luma-ventures-case-study')
    expect(publicSlugs.length).toBe(BLOG_POSTS.length - 3)
  })
})
