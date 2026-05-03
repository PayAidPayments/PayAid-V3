# Canonical Module API Cutover Runbook

This runbook controls migration from legacy module payloads to canonical-only payloads.

Execution worksheet: `docs/CANONICAL_MODULE_API_CUTOVER_EXECUTION_WORKSHEET.md`
Staging runtime evidence sheet: `docs/CANONICAL_MODULE_API_STAGING_RUNTIME_EVIDENCE_SHEET.md`

## Scope

- `GET /api/modules`
- `GET /api/industries/[industry]/modules`
- `POST /api/industries/[industry]/modules`
- `POST /api/industries/custom/modules`
- `POST /api/ai/analyze-industry`

## Feature Flag

- Flag: `CANONICAL_MODULE_API_ONLY`
- `CANONICAL_MODULE_API_ONLY=1` -> canonical-only responses (legacy fields removed)
- unset or not `1` -> canonical responses plus legacy compatibility fields

## Canonical Contract (must be consumed)

- `/api/modules`: `taxonomy`, `canonical`
- Industry modules GET: `industry`, `canonical`, `suites`, `capabilities`, `optionalSuites`
- Industry modules POST/custom POST: `success`, `canonical`
- AI analyze industry: `industryName`, `canonical`, `industryFeatures`, `description`, `keyProcesses`, `fallback`, `aiService`

## Legacy Fields That Are Gated

- `/api/modules`: `recommended`, `all`, `base`, `industry`, `compatibility`
- Industry modules GET: `coreModules`, `industryPacks`, `optionalModules`, `compatibility`
- Industry modules POST/custom POST: legacy top-level `enabled*` fields and `compatibility`
- AI analyze industry: `coreModules` and `compatibility`

## Cutover Steps

1. Validate all consumers read canonical fields only.
2. Run `npm run check:canonical-module-api-contract` to capture static contract evidence artifact.
3. Run smoke checks with legacy mode (flag unset) to confirm no regressions.
4. Re-run `npm run check:canonical-module-api-contract` and confirm pass artifacts.
5. Enable `CANONICAL_MODULE_API_ONLY=1` in staging.
6. Re-run smoke checks focused on:
   - module catalog pages
   - onboarding and industry setup flows
   - AI industry recommendation flow
7. If pass, enable `CANONICAL_MODULE_API_ONLY=1` in production.
8. Monitor errors for 24h (API logs and client telemetry).

## Contract Evidence Command

```bash
npm run check:canonical-module-api-contract
npm run check:canonical-module-api-post-cutover
npm run check:canonical-module-api-response-snapshots
npm run check:canonical-module-api-consumer-usage
npm run check:canonical-module-api-readiness-verdict
```

Release gate equivalent:

```bash
npm run release:gate:canonical-contract
npm run release:gate:canonical-post-cutover
npm run release:gate:canonical-readiness-verdict
```

Output artifacts are written to `docs/evidence/closure/`:

- `*-canonical-module-api-contract-check.json`
- `*-canonical-module-api-contract-check.md`
- `*-canonical-module-api-post-cutover-guard.json`
- `*-canonical-module-api-post-cutover-guard.md`
- `*-canonical-module-api-response-snapshots.json`
- `*-canonical-module-api-response-snapshots.md`
- `*-canonical-module-api-consumer-usage.json`
- `*-canonical-module-api-consumer-usage.md`
- `*-canonical-module-api-readiness-verdict.json`
- `*-canonical-module-api-readiness-verdict.md`

## Rollback

- Set `CANONICAL_MODULE_API_ONLY=0` (or remove the flag) and redeploy.
- Confirm legacy fields are present again in the gated endpoints.

## Evidence Checklist

- [ ] Legacy mode response snapshot captured.
- [ ] Canonical-only mode response snapshot captured.
- [ ] Staging smoke checks passed.
- [ ] Production enablement timestamp recorded.
- [ ] 24h post-enable error check completed.
