# Schema Drift Report — Live DB vs Repository

**Project:** `czpfsfiatehldcavsvsw`
**Generated:** 2026-07-08 (read-only export via Supabase MCP — no live DB writes, no app-code changes)
**Compared:** live `public` schema  ⟷  repo `supabase/migrations/001–003` (now archived) and app code references.

---

## 1. Headline

The repository's committed migrations were **never the deployed schema**. The live database is a much
larger, different system built by a separate 45-migration history.

| Dimension | Live database | Repo migrations (001–003) |
|---|---|---|
| Applied migrations | **45** (`20260423…`–`20260515…`) | 3 files, **0 applied to this project** |
| Tables (`public`) | **118** (119 in `pg_tables`) | ~30 |
| Enums | 2 (`business_role`, `business_status`) | 0 |
| Functions | 63 | 2 helpers |
| Triggers | 63 | 0 |
| Indexes | 312 | ~60 inline |
| Constraints | 472 | inline PK/FK only |
| RLS policies | 262 | ~50 (in 002) |
| Tables with RLS | **all 118** | subset (003 tables had none) |
| Views | 1 (`my_businesses`) | 0 (referenced in code only) |

## 2. Migration history

**Live (45):** two waves —
- `20260423–24` (20): businesses/RLS/onboarding firefighting (`add_business_creation_trigger`,
  `fix_businesses_rls_policy`, `add_unique_constraints_businesses`, `comprehensive_on_conflict_fix`,
  `fix_onboarding_flow_and_profile_sync`, `fix_all_rls_policies`, …).
- `20260515` (25): the real product schema (`ogmj_crm_engine`, `ogmj_funnel_website_engine`,
  `ogmj_automation_engine`, `001_marketplace_payments_referrals`, `002_ai_content_forms_leads`,
  `003_api_keys_webhooks_invitations_admin`, `005_rls_policies_complete`,
  `006_functions_triggers_automation`, `add_workspaces_leads_appointments_sequences`,
  `add_products_messaging_rbac_infrastructure`, `phase1_missing_*`).

**Repo (3, archived):** `001_initial_schema`, `002_rls_policies`, `003_invoicing_social_workflows` —
none of these versions exist in the live `schema_migrations` table.

## 3. Tables the REPOSITORY references but that DO NOT exist live (6)

Confirmed absent via `to_regclass`. These will 404 at PostgREST when the app calls them:

| Missing table | Source in repo |
|---|---|
| `invoice_line_items` | mig 003, `lib/services/invoices.service.ts`, invoices UI |
| `invoice_templates` | mig 003, invoices service |
| `invoice_payments` | mig 003 |
| `invoice_reminders` | mig 003 |
| `email_queue` | mig 003 |
| `workflow_steps` | mig 003 |

**Impact:** the repo's **Invoices module is built on a schema that isn't deployed.** Live uses a different
model: `client_invoices` + `invoice_items` (+ `invoices` for subscription invoices) with the triggers
`generate_invoice_number` and `recalculate_invoice_total`. The workflow model differs too: live has
`workflows` + `workflow_executions` + `workflow_step_logs` (no `workflow_steps`).

All other previously-"phantom" tables **do exist live**: `business_members`, `appointments`, `products`,
`leads`, `email_sequences`, `conversations`, `messages`, `feature_flags`, `templates`, and the
`my_businesses` view.

## 4. Model differences on shared tables

- **`businesses`** — Live has `owner_id`, `created_by`, `user_id`, `business_name` + `name`, `type`,
  `status business_status`, `onboarding_step`, `slug` (unique), plus a `handle_business_upsert` BEFORE
  trigger and `on_business_created` AFTER trigger that auto-creates membership, onboarding, pipeline, and
  workspace. Repo `businesses` keyed ownership off `created_by` only, with none of this automation. The
  RLS bootstrap deadlock described earlier for the repo is **resolved live** by these triggers +
  `add_unique_constraints_businesses`.
- **Membership** — Live has BOTH `business_members` (canonical; `role business_role`, `is_active`) and
  `business_users` (`role`, `status`), kept in sync by `trg_sync_business_users` →
  `sync_business_users_from_members()`. Repo only modeled `business_users`.
- **CRM** — Live `deals` uses `stage_id`/`pipeline_id` FKs into `pipelines`/`pipeline_stages`; repo `deals`
  used a `stage` varchar with no pipeline tables. Live adds `crm_activities`, `crm_notes`, `tags`,
  `contact_tags`, `deal_tags`. `contacts` uses `lifecycle_stage` (live) vs `status` (repo).
- **Builder** — Live has two builder lineages: `sites`/`pages`/`sections` AND
  `websites`/`web_pages`/`components`/`page_versions`/`custom_domains`. Repo modeled only
  `websites`/`pages`/`components`.
- **Video** — Live adds `clips` and `transcripts` alongside `videos`/`video_clips`.

## 5. Entire domains present LIVE but absent from repo migrations

Marketplace (`marketplace_listings`, `marketplace_orders`, `order_messages`), referrals
(`referral_programs`, `referrals`, `referral_commissions`, `referral_clicks`, `payout_requests`),
workspaces/RBAC (`workspaces`, `workspace_members`, `organizations`, `team_members`, `permission_roles`,
`user_role_assignments`), funnels/forms (`funnels`, `funnel_steps`, `funnel_submissions`, `forms`,
`form_responses`), email marketing (`email_sequences`, `email_sequence_steps`, `sequence_enrollments`,
`subscriber_lists`, `list_contacts`, `email_unsubscribes`, `email_templates`, `email_logs`,
`campaigns`, `content_calendar`), commerce (`products`, `product_variants`, `discount_codes`,
`usage_quotas`, `plan_limits`, `plan_addons`, `business_addons`), messaging (`conversations`,
`conversation_participants`, `messages`, `notifications`), platform admin (`platform_admins`,
`platform_audit_log`, `platform_settings`, `knowledge_base`, `feature_flags`, `cron_job_logs`),
plus `tasks`, `projects`, `clients`, `services`, `appointments`, `leads`, `integrations`, `webhooks`,
`webhook_logs`, `api_keys`, `api_rate_limits`, `ab_tests`, `user_sessions`, `analytics_daily`,
`website_analytics`, `analytics_events`, `media`, `onboarding_progress`.

## 6. Security drift

- **RLS:** Live enables RLS on **all 118 tables** with **262 policies**. Repo mig 003 shipped several
  tables (`invoices`, `social_*`, `workflows`, `email_*`) with **no RLS at all** — that gap does **not**
  exist in production.
- **One live table has RLS enabled but zero policies:** `api_rate_limits` (deny-all to clients).
- **Supabase Security Advisor: 156 findings (all WARN/INFO, 0 ERROR)** —
  49 `authenticated_security_definer_function_executable`, 49 `anon_security_definer_function_executable`
  (the tenancy/stat/log SECURITY DEFINER functions are `EXECUTE`-able by anon/authenticated),
  46 `function_search_path_mutable`, 9 `rls_policy_always_true` (public `WITH CHECK (true)` INSERT on
  `analytics_events`, `audit_logs`, `events`, `form_responses`, `funnel_submissions`, `referral_clicks`,
  `website_analytics`, `cron_job_logs`, `email_unsubscribes` — most are intentional public ingestion, but
  `audit_logs`/`events` allow forged/spam inserts), 1 `extension_in_public` (`citext`),
  1 `auth_leaked_password_protection` (disabled), 1 `rls_enabled_no_policy` (`api_rate_limits`).
- **Policy hygiene:** many tables carry two overlapping policy generations (e.g. `businesses` has 7). All
  verified business-scoped (`is_biz_member(business_id)`) — not cross-tenant holes — but worth consolidating.

## 7. Application-code alignment

App code (`lib/services/*`, `hooks/*`) references tables that **do** exist live, so most modules align
with production — **except the Invoices module** (§3), which targets `invoice_line_items` /
`invoice_templates` / `invoice_payments` that do not exist. Retarget it to `client_invoices` +
`invoice_items` before relying on it. (Note: the separate code-level findings — API routes using the
browser Supabase client for server auth, and client-supplied payment amounts — are unrelated to schema
drift and still stand.)

## 8. Artifacts produced by this export

- `supabase/migrations/20260101000000_remote_baseline.sql` — canonical baseline (1,417 statements).
- `supabase/_archive_obsolete_repo_migrations/` — the three superseded repo migrations.
- `supabase/RECONCILIATION.md` — how to reconcile local baseline with the 45 remote migrations.
- `supabase/SCHEMA_DRIFT_REPORT.md` — this document.
