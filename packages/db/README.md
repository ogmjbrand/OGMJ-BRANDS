# @ogmj/db

The database package: Supabase project config, migration history, and schema
reconciliation notes for `czpfsfiatehldcavsvsw`.

- `supabase/migrations/` — the canonical baseline migration
  (`20260101000000_remote_baseline.sql`) plus any migrations applied since.
- `supabase/_archive_obsolete_repo_migrations/` — superseded early repo
  migrations, kept for history only; none of them are applied to the live
  project.
- `supabase/RECONCILIATION.md` / `supabase/SCHEMA_DRIFT_REPORT.md` — how the
  repo's migration history was reconciled against the live database, and the
  drift found when that was done.
- `supabase/config.toml` — Supabase CLI project config. Run `supabase`
  CLI commands from inside `packages/db/` (or `packages/db/supabase/`) so the
  CLI finds this config.

This package has no build step and nothing imports it at runtime — it exists
so schema/migration history lives in the monorepo as its own workspace
instead of being bundled inside the web app.
