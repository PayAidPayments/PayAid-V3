# Canonical module API — one-pass manual signoff

Use this after `npm run check:canonical-staging-runtime` has passed on the target environment (see `docs/evidence/closure/2026-04-25T07-26-17-372Z-canonical-staging-runtime-checks.md` for the canonical-only API contract).

Latest full smoke orchestration (all gates): `docs/evidence/release-gates/2026-04-25T07-34-52-562Z-release-gate-suite.json`.

Automated companion probe before manual clicks: `npm run check:canonical-ui-surface-smoke`.

**Base URL:** `https://payaid-v3.vercel.app` (or your staging alias)

**Auth:** Log in as a tenant owner/admin with access to CRM, modules, and signup/industry flows.

## Map API checks to UI acceptance

| Checklist item | API evidence (staging script) | UI acceptance (manual) |
|----------------|-------------------------------|-------------------------|
| Catalog + module switchers | S1 `GET /api/modules` | Open `/dashboard/modules` — taxonomy line or canonical groups render without console errors; module toggles still persist if applicable. |
| Industry recommendations | S2 `GET /api/industries/{industry}/modules` | Open `/industries/retail` (or your industry) — recommended suites/capabilities render from canonical payload. |
| Industry auto-configure | S3 `POST /api/industries/{industry}/modules` | Complete or re-run industry onboarding that triggers auto-configure; confirm success state and no broken empty states. |
| Custom industry | S4 `POST /api/industries/custom/modules` | Signup or custom industry path that posts `canonical.enabledModules` / `canonical.enabledFeatures`; confirm success. |
| AI industry analysis | S5 `POST /api/ai/analyze-industry` | Any UI that calls analyze-industry shows suites/recommendations without requiring legacy `coreModules`. |

Tick the corresponding boxes in `docs/CANONICAL_MODULE_API_CONSUMER_READINESS_CHECKLIST.md` only after the UI row passes.

## Production enablement plan (required before `CANONICAL_MODULE_API_ONLY=1` in production)

Record in your change ticket:

- **Owner:** name
- **Window:** UTC start–end
- **Rollback owner:** name + rollback step (set `CANONICAL_MODULE_API_ONLY` off / redeploy prior build)
- **Pre-flight:** `npm run check:canonical-module-api-contract` + `npm run check:canonical-module-api-post-cutover` + staging runtime pass

### Ready-to-fill approval block

Copy this block into the release ticket and fill values:

- **Owner:** `Phani`
- **Window (UTC):** `2026-04-25 08:00` -> `2026-04-25 09:00`
- **Rollback owner:** `Phani`
- **Rollback command path:** set `CANONICAL_MODULE_API_ONLY=0` and redeploy last known good build.
- **Pre-flight evidence bundle:**
  - `docs/evidence/closure/2026-04-25T07-42-43-943Z-canonical-ui-surface-smoke.md`
  - `docs/evidence/closure/2026-04-25T07-53-30-299Z-canonical-module-api-readiness-verdict.md`
  - `docs/evidence/release-gates/2026-04-25T07-46-02-393Z-release-gate-suite.json`

Approval recorded in chat on `2026-04-25` via explicit "Go ahead with the recommended next steps".

### Cutover command order (operator runbook)

1. Confirm staging parity:
   - `npm run check:canonical-staging-runtime`
   - `npm run check:canonical-ui-surface-smoke`
2. Confirm release gates:
   - `npm run release:gate:smoke`
3. Flip canonical-only flag in production deployment config:
   - `CANONICAL_MODULE_API_ONLY=1`
4. Run immediate post-flip smoke:
   - `npm run check:canonical-ui-surface-smoke`
   - Route probes for `/api/modules`, `/api/industries/retail/modules`, `/api/industries/custom/modules`, `/api/ai/analyze-industry`
5. If any critical breakage appears:
   - Set `CANONICAL_MODULE_API_ONLY=0`
   - Redeploy previous known-good production build
   - Record incident + rollback timestamp in release ticket

## Post-enable 24-hour monitoring

After production flip:

- Confirm no spike in `5xx` on `/api/modules`, `/api/industries/*/modules`, `/api/industries/custom/modules`, `/api/ai/analyze-industry`.
- Spot-check the five UI surfaces above once per shift.

Mark the checklist item only after the 24-hour window completes with no critical incidents.
