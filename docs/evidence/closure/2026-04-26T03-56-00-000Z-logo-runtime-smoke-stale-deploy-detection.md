# Logo Runtime Smoke - Stale Deploy Detection (Production)

Date: 2026-04-26  
Base URL: `https://payaid-v3.vercel.app`  
Auth: valid canonical staging JWT (owner role)  
Check command: `npm run check:logo-runtime-smoke`

## Summary

- `schemaMismatchDetected`: `false` (DB `logoType` migration remains healthy)
- `overallOk`: `false`
- Rollout probe signal indicates stale deployment:
  - `vectorListProbeStatus`: `500`
  - `vectorListProbeBuildRef`: `unknown`
  - `rolloutProbeVisible`: `true`
  - `rolloutBuildRefVisible`: `false`

## Endpoint results

1. `GET /api/logos/vector` (`vector-logo-list-probe`)
   - Status: `500`
   - Build ref surfaced: `unknown`
   - Error: `Failed to list vector logos`

2. `POST /api/logos/vector` (`vector-logo-create`)
   - Status: `500`
   - Build ref surfaced: `unknown`
   - Error: `Invalid prisma.logo.create() ... Null constraint violation on fields: (prompt)`

3. `POST /api/logos` (`ai-logo-create`)
   - Status: `500`
   - Build ref surfaced: `unknown`
   - Error/hint: image provider not configured for workspace

## Interpretation

Even though `main` contains fixes (`61d25a26e`, `ecbc4a525`, `f04e67d7c`), production logo endpoints are still serving a path that does not include build-ref stamping and still exhibits pre-fix vector behavior (`prompt` null violation).

This is consistent with stale/non-promoted deployment serving production traffic for logo API routes.

## Required operational action

1. In Vercel, confirm deployment built from latest `main` and promote it to production.
2. Re-run `npm run check:logo-runtime-smoke`.
3. Accept as remediated only when:
   - `rolloutBuildRefVisible = true`
   - `vector-logo-create` no longer fails with `prompt` null violation.
