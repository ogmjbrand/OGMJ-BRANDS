/**
 * Formats an unknown thrown value for a log line WITHOUT ever including
 * the raw error object. Some error types that can reach an AI route's
 * catch blocks (HTTP client errors from either the Anthropic or OpenAI
 * SDK, in particular) can carry response headers or echo request details
 * as extra properties -- never something this app wants verbatim in a
 * log. Only a message and (for a real Error) its name are kept; that's
 * enough to diagnose a failure while being provably free of credentials,
 * headers, or raw request content.
 *
 * Shared by every AI route's catch blocks (business-assistant,
 * website-assist, and any future one) so there is exactly one place this
 * logic lives -- not a copy per route that can independently drift.
 */
export function safeErrorSummary(error: unknown): { name?: string; message: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { message: typeof error === 'string' ? error : 'Non-Error value thrown' };
}
