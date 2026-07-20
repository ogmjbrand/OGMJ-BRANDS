# apps/api (not yet implemented)

This is a scaffold for the standalone backend API layer described in the
OGMJ BRANDS 4.0 master brief. It does not contain any code yet.

**Current state:** all API logic lives inside `apps/web/app/api/**` as
Next.js Route Handlers, running in the same process/deployment as the web
app. That is a normal, supported architecture for a Next.js app of this
size, and every route already does its own auth, business-membership
checks, and RLS-respecting Supabase calls.

**Why this isn't extracted yet:** pulling those routes out into a separate
service is a large, separate initiative — every handler currently depends on
Next.js request/response primitives and the `@supabase/ssr` cookie-based
server client (`apps/web/lib/supabase/server.ts`), neither of which carries
over to a standalone Node server without a real rewrite. Scaffolding an
empty `apps/api` without a concrete reason to split (e.g. a second consumer
of the API that isn't `apps/web`) would add deployment and maintenance
overhead for no functional benefit.

**Upgrade path, if/when this is needed:** stand up an Express/Fastify (or
Next.js route-handler-only) app here, move route handlers over incrementally
grouped by domain, and replace the cookie-based Supabase client with a
token-based one suited to a standalone service.
