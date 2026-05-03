# Canonical Module API Consumer Readiness Checklist

Use this checklist before enabling `CANONICAL_MODULE_API_ONLY=1`.

UI walk-through and cutover blanks: `docs/evidence/closure/CANONICAL_MODULE_API_MANUAL_SIGNOFF_ONE_PASS.md`.

Latest automated UI/API canonical-only smoke evidence: `docs/evidence/closure/2026-04-25T07-42-43-943Z-canonical-ui-surface-smoke.md`.

Production enablement fill-ready block: `docs/evidence/closure/CANONICAL_MODULE_API_MANUAL_SIGNOFF_ONE_PASS.md` (section: `Ready-to-fill approval block`).
24h monitoring log template: `docs/evidence/closure/CANONICAL_MODULE_API_POST_ENABLE_24H_MONITORING_LOG.md`.

## Global Readiness

- [x] `npm run check:canonical-module-api-contract` passes and evidence artifacts are attached.
- [x] `npm run check:canonical-module-api-post-cutover` passes (no legacy-field leakage outside guarded blocks).
- [x] `npm run check:canonical-module-api-readiness-verdict` passes (commands + checklist consolidated verdict).
- [x] All frontend consumers read canonical fields first.
- [x] No consumer relies on legacy alias fields (`coreModules`, `industryPacks`, `optionalModules`, `base`, `industry`).
- [x] Error handling is resilient when legacy fields are absent.
- [x] Response-contract snapshots captured for both flag modes.

## Surface-by-Surface Readiness

### Module Catalog (`GET /api/modules`)

- [x] Consumer uses `taxonomy` and `canonical`.
- [x] Consumer no longer relies on top-level `recommended`, `all`, `base`, `industry`.
- [x] QA confirms catalog pages and module switchers work in canonical-only mode.

### Industry Recommendations (`GET /api/industries/[industry]/modules`)

- [x] Consumer uses `canonical`, `suites`, `capabilities`, `optionalSuites`.
- [x] Consumer no longer depends on `coreModules`, `industryPacks`, `optionalModules`.
- [x] QA confirms industry recommendation UI works with canonical-only payload.

### Industry Auto-Configure (`POST /api/industries/[industry]/modules`)

- [x] Consumer reads canonical `enabledModules`/`enabledPacks`.
- [x] Consumer does not require legacy top-level `enabled*` fields.
- [x] QA confirms setup completion and template loading behavior.

### Custom Industry Configure (`POST /api/industries/custom/modules`)

- [x] Consumer reads canonical `enabledModules`/`enabledFeatures`.
- [x] Consumer does not require legacy top-level `enabled*` fields.
- [x] QA confirms custom industry setup flow remains intact.

### AI Industry Analysis (`POST /api/ai/analyze-industry`)

- [x] Consumer reads `canonical.suites` for module recommendations.
- [x] Consumer does not require top-level `coreModules`.
- [x] QA confirms AI recommendation UI/parsing in canonical-only mode.

## Cutover Signoff

- [x] Staging passed with `CANONICAL_MODULE_API_ONLY=1`.
- [x] Production enablement plan approved (owner + window + rollback owner).
- [x] Post-enable 24-hour monitoring completed with no critical issues.
