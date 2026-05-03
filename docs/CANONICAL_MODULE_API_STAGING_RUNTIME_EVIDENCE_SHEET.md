# Canonical Module API - Staging Runtime Evidence Sheet

Use this sheet during live staging execution with `CANONICAL_MODULE_API_ONLY=1`.

Optional automation helper:

```bash
npm run check:canonical-staging-runtime
npm run apply:canonical-staging-runtime-artifact
npm run run:canonical-staging-evidence-pipeline
```

Environment variables:

- `CANONICAL_STAGING_BASE_URL` (required)
- `CANONICAL_STAGING_AUTH_TOKEN` (required)
- `CANONICAL_STAGING_INDUSTRY` (optional, default `retail`)
- `CANONICAL_STAGING_RUN_MUTATIONS=1` (optional; enables S3-S5 POST checks)
- `CANONICAL_STAGING_ARTIFACT_JSON` (optional for apply script; defaults to latest tracked blocked artifact path)
- `CANONICAL_STAGING_EVIDENCE_MD` (optional for apply script; defaults to today's fill-ready evidence file)

## Run Metadata

| Field | Value |
|---|---|
| Run date | [YYYY-MM-DD] |
| Environment | staging |
| Flag value | `CANONICAL_MODULE_API_ONLY=1` |
| Executor | Phani |
| Reviewer | Phani |
| Base URL | [https://...] |
| Auth context | [tenant/user used for validation] |
| Evidence output path | `docs/evidence/closure/[artifact-name].md` |

## Endpoint Contract Validation (Canonical-only)

| Check ID | Endpoint | Expected canonical fields | Expected missing legacy fields | Actual result | Pass/Fail | Notes |
|---|---|---|---|---|---|---|
| S1 | `GET /api/modules` | `taxonomy`, `canonical` | `recommended`, `all`, `base`, `industry`, `compatibility` | [paste keys] | [P/F] | [notes] |
| S2 | `GET /api/industries/[industry]/modules` | `industry`, `canonical`, `suites`, `capabilities`, `optionalSuites` | `coreModules`, `industryPacks`, `optionalModules`, `compatibility` | [paste keys] | [P/F] | [notes] |
| S3 | `POST /api/industries/[industry]/modules` | `success`, `canonical` | top-level `enabledModules`, `enabledPacks`, `compatibility` | [paste keys] | [P/F] | [notes] |
| S4 | `POST /api/industries/custom/modules` | `success`, `canonical`, `industryName` | top-level `enabledModules`, `enabledFeatures`, `compatibility` | [paste keys] | [P/F] | [notes] |
| S5 | `POST /api/ai/analyze-industry` | `industryName`, `canonical`, `industryFeatures`, `description`, `keyProcesses`, `aiService` | `coreModules`, `compatibility` | [paste keys] | [P/F] | [notes] |

## Runtime UX/Flow Validation

| Check ID | Flow | Expected result | Actual result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| U1 | Module catalog page load | No runtime parsing errors; canonical data renders | [result] | [P/F] | [notes] |
| U2 | Module switcher visibility | No missing-data/fallback regressions | [result] | [P/F] | [notes] |
| U3 | Industry recommendation page | Canonical suite/capability data renders correctly | [result] | [P/F] | [notes] |
| U4 | Industry auto-configure flow | Setup completes; no legacy field dependency errors | [result] | [P/F] | [notes] |
| U5 | Custom industry configure flow | Setup completes; canonical enabled fields consumed | [result] | [P/F] | [notes] |
| U6 | Signup AI industry recommendation path | Canonical suite recommendations consumed | [result] | [P/F] | [notes] |

## Error Handling Validation

| Check ID | Scenario | Expected result | Actual result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| E1 | Missing legacy fields in canonical-only mode | UI/API consumers do not crash | [result] | [P/F] | [notes] |
| E2 | API non-200 path on canonical endpoints | Clear error handling/message; no silent failure | [result] | [P/F] | [notes] |
| E3 | Empty canonical arrays/optional blocks | Graceful fallback rendering | [result] | [P/F] | [notes] |

## Staging Decision

- [ ] All S1-S5 checks pass
- [ ] All U1-U6 checks pass
- [ ] All E1-E3 checks pass
- [ ] Ready to mark `Staging passed with CANONICAL_MODULE_API_ONLY=1`

Decision summary:

- Decision: [Pass / Fail / Conditional]
- Decision owner: Phani
- Date/time: [YYYY-MM-DD hh:mm TZ]
- Blocking issues (if any): [list]
