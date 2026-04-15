# Vercel Turbopack Build Blocker Notes (Queue #14)

- Date: 2026-04-15
- Deployment commit: `d997288`
- Region: `iad1`
- Build machine: 2 cores / 8 GB RAM

## What changed

- Upload pruning succeeded (`Removed 41581 ignored files`).
- Build moved past install/prisma generation.
- `apps/dashboard` build executed through wrapper:
  - `node scripts/next-build.cjs`
  - `next build --turbopack`

## Failure signature

Turbopack failed while resolving Bull internals used by queue modules:

- `Module not found: Can't resolve './ROOT/node_modules/bull/lib/process/master.js'`
- `Module not found: Can't resolve '/ROOT/node_modules/bull/lib/process/master.js'`

Import traces in build output include:

- `./lib/queue/model-training-queue.ts` -> API route deploy handler
- `./lib/queue/bull.ts` -> jobs scheduler -> `instrumentation.ts`

## Mitigation applied in repo

- Added `serverExternalPackages: ['bull', 'ioredis']` in `apps/dashboard/next.config.mjs`
  to prevent Turbopack from bundling Bull's server-relative child-process internals.

## Next step

- Re-run production deployment and verify build passes with the externalization change.
- If build succeeds, rerun `npm run collect:crm-auth-baseline` and update queue #14 closure status.
