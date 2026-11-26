/**
 * Allow-list for post-auth redirects (e.g. the `next` param on
 * /api/auth/callback). Only same-origin relative paths under these
 * prefixes are honoured, so auth links can't be used as open redirects.
 */
const ALLOWED_NEXT_PATHS = ['/reset-password', '/onboarding', '/dashboard']

export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return null
  return ALLOWED_NEXT_PATHS.some((allowed) => next === allowed || next.startsWith(`${allowed}/`)) ? next : null
}
