# Canonical Module API Consumer Readiness Checklist

Use this checklist before enabling `CANONICAL_MODULE_API_ONLY=1`.

## Global Readiness

- [x] `npm run check:canonical-module-api-contract` passes and evidence artifacts are attached.
- [x] `npm run check:canonical-module-api-post-cutover` passes (no legacy-field leakage outside guarded blocks).
- [ ] `npm run check:canonical-module-api-readiness-verdict` passes (commands + checklist consolidated verdict).
- [x] All frontend consumers read canonical fields first.
- [x] No consumer relies on legacy alias fields (`coreModules`, `industryPacks`, `optionalModules`, `base`, `industry`).
- [ ] Error handling is resilient when legacy fields are absent.
- [x] Response-contract snapshots captured for both flag modes.

## Surface-by-Surface Readiness

### Module Catalog (`GET /api/modules`)

- [ ] Consumer uses `taxonomy` and `canonical`.
- [ ] Consumer no longer relies on top-level `recommended`, `all`, `base`, `industry`.
- [ ] QA confirms catalog pages and module switchers work in canonical-only mode.

### Industry Recommendations (`GET /api/industries/[industry]/modules`)

- [ ] Consumer uses `canonical`, `suites`, `capabilities`, `optionalSuites`.
- [ ] Consumer no longer depends on `coreModules`, `industryPacks`, `optionalModules`.
- [ ] QA confirms industry recommendation UI works with canonical-only payload.

### Industry Auto-Configure (`POST /api/industries/[industry]/modules`)

- [ ] Consumer reads canonical `enabledModules`/`enabledPacks`.
- [ ] Consumer does not require legacy top-level `enabled*` fields.
- [ ] QA confirms setup completion and template loading behavior.

### Custom Industry Configure (`POST /api/industries/custom/modules`)

- [ ] Consumer reads canonical `enabledModules`/`enabledFeatures`.
- [ ] Consumer does not require legacy top-level `enabled*` fields.
- [ ] QA confirms custom industry setup flow remains intact.

### AI Industry Analysis (`POST /api/ai/analyze-industry`)

- [ ] Consumer reads `canonical.suites` for module recommendations.
- [ ] Consumer does not require top-level `coreModules`.
- [ ] QA confirms AI recommendation UI/parsing in canonical-only mode.

## Cutover Signoff

- [ ] Staging passed with `CANONICAL_MODULE_API_ONLY=1`.
- [ ] Production enablement plan approved (owner + window + rollback owner).
- [ ] Post-enable 24-hour monitoring completed with no critical issues.
