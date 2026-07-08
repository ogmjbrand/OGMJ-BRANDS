# Migration Reconciliation Strategy

**Project:** `czpfsfiatehldcavsvsw`
**Generated:** 2026-07-08 (read-only export via Supabase MCP)
**Status:** Local baseline created. Remote reconciliation is **documented, not executed** (see safety note).

---

## Why this was needed

The repo's `supabase/migrations/` previously contained three files — `001_initial_schema.sql`,
`002_rls_policies.sql`, `003_invoicing_social_workflows.sql` — that were **never applied** to the
live project. The live database was instead built by **45 different migrations** (Apr–May 2026) with
unrelated names. The repo migrations and the live schema had diverged so far that reproducing the DB
from the repo would have produced a database the application cannot run against.

See `SCHEMA_DRIFT_REPORT.md` for the full diff.

## What was done (local only — no live DB writes)

1. Exported the complete live schema to a single canonical baseline:
   `supabase/migrations/20260101000000_remote_baseline.sql`
   (1,417 statements: 3 extensions, 2 enums, 119 tables, 63 functions, 472 constraints,
   312 indexes, 119 RLS-enable statements, 262 policies, 63 triggers, 1 view).
2. Moved the three obsolete files to `supabase/_archive_obsolete_repo_migrations/` (kept for reference,
   no longer part of the active migration chain).
3. **No application code was changed. No live database object was created, altered, or dropped.**

The baseline is dated `20260101000000` so it sorts first and represents the foundational state of the
database. It uses `CREATE TABLE IF NOT EXISTS`, `CREATE EXTENSION IF NOT EXISTS`, and
`SET check_function_bodies = false` so it can be applied to a fresh shadow database for local dev.

## ⚠️ Safety note — the remote migration-history table was NOT touched

Supabase tracks applied migrations in the live table `supabase_migrations.schema_migrations`. Right now:

- The 45 real migrations are listed there (remote), but their files are **not** in the repo.
- The new `20260101000000_remote_baseline.sql` is in the repo, but is **not** listed as applied remotely.

So `supabase migration list` will show 45 "remote-only" rows and 1 "local-only" row until reconciled.
Reconciling means writing to `schema_migrations`, which is a **live-database write**. Per the "do not
modify the live database" instruction, that step is left for you to run deliberately. Choose ONE path:

### Path A — Adopt the squashed baseline (recommended)

Collapse the 45-entry remote history into the single baseline. This updates only the tracking table,
not the schema or data.

```bash
# 1. Authenticate + link (interactive; needs a Personal Access Token + DB password)
supabase login
supabase link --project-ref czpfsfiatehldcavsvsw

# 2. Confirm the mismatch
supabase migration list

# 3. Mark the 45 remote-only migrations as reverted (tracking only — schema untouched)
#    Replace the versions below with the exact list from `supabase migration list`.
supabase migration repair --status reverted 20260423221531 20260423221641 ... 20260515074434

# 4. Mark the baseline as already applied on remote (its objects already exist)
supabase migration repair --status applied 20260101000000

# 5. Verify a clean state
supabase migration list        # baseline shows applied on both sides; no drift
supabase db diff               # should report no schema differences
```

After this, the repo baseline is the single source of truth and future changes are added as new
timestamped migrations on top of it.

### Path B — Keep remote history, treat baseline as reference only (most conservative)

Do nothing to `schema_migrations`. Keep the baseline purely as a documented snapshot of the live schema
and continue authoring new migrations for future changes. Downsides: `supabase migration list` stays
mismatched, and `supabase db push` cannot be used cleanly until Path A is done. Use this only if you are
not ready to reconcile tracking.

### Path C — Verify the baseline before adopting (do this first, regardless)

Prove the baseline reproduces the live schema on a throwaway database before trusting it:

```bash
supabase db reset            # applies the baseline to the local shadow DB
supabase db diff --linked    # compares local (baseline) vs live; expect no differences
```

If `db diff` reports differences, they are catalog-reconstruction gaps (see next section) — patch the
baseline, then proceed to Path A.

## Known limitations of the catalog-generated baseline

This baseline was reconstructed from the live catalog (not `pg_dump`), so verify with Path C before
adopting. Expected gaps to check:

- **Idempotency is partial.** Tables/extensions use `IF NOT EXISTS`; constraints, indexes, and policies
  do not — the file is meant for a fresh apply, not repeated runs.
- **No seed/reference data.** `plans`, `subscription_plans`, `plan_limits`, `feature_flags`, etc. ship no
  rows here (the project is empty except one `profiles` row).
- **Storage, auth, cron, and realtime config** (buckets, `auth.*`, `cron.*`, publications) are outside
  `public` and are not captured.
- **Grants/ownership** beyond RLS policies are not reproduced.
- **Two overlapping RLS-policy generations** exist on many tables (e.g. `businesses` has 7 policies) and
  are reproduced faithfully — consider consolidating (see drift report §Security).

For a byte-exact, guaranteed-replayable dump, run `supabase db dump --linked -f supabase/schema.sql`
once you have the DB password; diff it against this baseline and keep whichever you trust as canonical.
