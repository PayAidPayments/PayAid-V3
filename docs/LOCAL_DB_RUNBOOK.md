# Local DB Runbook (Docker)

Use this for local development when you want a reproducible database environment (Postgres on `127.0.0.1:5433`).

---

## Start / Stop

- Start: `npm run db:local:up`
- Wait for readiness: `npm run db:local:wait`
- Logs: `npm run db:local:logs`
- Stop + wipe: `npm run db:local:down`

## Migrations (local)

If you’re using Prisma migrations locally:

- Status: `npm run db:migrate:status:local`
- Deploy migrations: `npm run db:migrate:deploy:local`
- One-liner (up → status → deploy → generate): `npm run db:local:migrate`
- One-liner with startup warm-up (helps avoid early `P1001` right after container start): `npm run db:local:migrate:retry`

## Setup + Seed (local)

If you want a working dataset for UI / e2e quickly:

- `npm run db:local:setup`

This runs:
- `prisma generate`
- `prisma db push`
- `npm run db:seed`

If legacy migration history does not replay cleanly on a fresh local DB, use the bootstrap path:

- `npm run db:local:bootstrap` (local up + local-only `db push --skip-generate`)
- `npm run db:local:bootstrap:retry` (bootstrap with readiness + warm-up)
- `npm run db:local:bootstrap:seed` (bootstrap + local seed)

If Prisma client generation fails on Windows with `EPERM` (DLL lock from running app), use:

- `npm run db:push:local:skip-generate`

This keeps schema bootstrap local-only without touching linked DBs.

## Notes

- If `db:migrate:status:local` fails with **P1001**, the local DB may still be warming up. Start DB with `npm run db:local:up`, wait a few seconds, then retry status (or use `npm run db:local:migrate:retry`).
- `db push` and `migrate deploy` are different workflows; prefer migrations for production-like changes.
- **Safety:** never run raw `prisma db push` when `.env` points to a linked/shared database. Use `db:push:local` / `db:push:local:skip-generate` so `DATABASE_URL` is pinned to local (`127.0.0.1:5433`).
- Local push commands now include a hard guard (`scripts/assert-local-db-url.mjs`) and will fail if `DATABASE_URL` host is not `127.0.0.1` / `localhost`.
- `db:local:bootstrap:retry` can run for several minutes and print many "unique constraint will be added" warnings; this is expected for schema bootstrap.
- After successful local bootstrap via `db push`, `db:migrate:status:local` may still show migrations as pending (different workflows). Use bootstrap for local dev, and keep `migrate deploy` for production/staging rollout.
- If Postgres logs repeatedly show **`FATAL: the database system is starting up`** for many minutes, local data files are likely in a bad recovery state. Recommended reset:
  1. `npm run db:local:down`
  2. `npm run db:local:down` again with volume wipe if needed (`docker compose -f docker-compose.local-db.yml down -v`)
  3. `npm run db:local:up`
  4. rerun `npm run db:local:migrate:retry`

