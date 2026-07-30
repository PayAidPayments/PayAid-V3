# packages/db migrations cutover — progress (2026-07-30)

Controlled release work only. Continues `2026-07-29-packages-db-migrations-cutover-inventory.md`.

## Done this pass

1. Re-verified tree counts (root 18 / packages/db was 32 / shared 13 / root-only 5 / pkg-only 19).
2. **Copied all 5 root-only migration folders into `packages/db/prisma/migrations/`** so the packages/db tree is a superset for applied-root history:
   - `20250226120000_add_contact_churn_phase1b`
   - `20260506143000_service_package_sla_incidents`
   - `20260515180000_voice_agent_bolna_runtime`
   - `20260522120000_voice_browser_demo_v1`
   - `20260709120000_marketing_command_center_phase_c`

packages/db migration dirs after copy: **37** (32 + 5).

## Still open (do not auto-deploy)

1. Inventory staging/production `_prisma_migrations` vs both trees (applied / never-applied / orphan) — needs live DB credentials (pooler/direct URI).
2. Decide fate of **19 packages/db-only** folders (baseline/`resolve` only if already applied outside Prisma).
3. Retarget CLI + deploy: `package.json` `"prisma".schema` → `packages/db/prisma/schema.prisma`; update `prisma-migrate-*.cjs`, `run-migrations-vercel.ts`.
4. `migrate status` on staging, then ADR follow-up.

## Explicit non-goals (unchanged)

No feature migrations, no LI discovery, no contract digs, no module shells.
