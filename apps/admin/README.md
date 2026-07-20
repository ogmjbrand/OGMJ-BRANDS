# apps/admin (not yet implemented)

Scaffold for the internal Admin Dashboard described in the OGMJ BRANDS 4.0
master brief (Phase 26 — user management, platform analytics, revenue
dashboard, audit logs, feature flags, support center, content moderation).

No code exists here yet. Build it as its own Next.js app in this directory
when that phase is prioritized — it can share `packages/db` for schema
access and should use `platform_admins`/`platform_audit_log` (already
present in the live schema) rather than the tenant-scoped `business_users`
model the client dashboard uses.
