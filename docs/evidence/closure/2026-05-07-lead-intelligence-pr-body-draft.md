# Lead Intelligence PR - Draft Body

## Summary
- Implemented Lead Intelligence M1 company-first journey in dashboard: `search -> companies -> saved-searches -> exports` with real API wiring and export-first behavior.
- Added entitlement gating, audit instrumentation, retry/failure handling, and closure contract tests/evidence for M1.
- Integrated Lead Intelligence closure checks into release-gate tooling and timeline workflow default gate path.

## Scope
- [x] M1 discover/save/export
- [ ] M2 enrichment/provenance
- [ ] M3 scoring/qualification
- [ ] M4 activation/upsell
- [ ] M5 observability/governance

## Test plan
- [x] `npm run check:lead-intelligence-m1-closure`
- [x] `npm run release:gate:lead-intelligence-m1-contracts`
- [ ] `.github/workflows/lead-intelligence-m1-closure` (path-filtered; confirm green on GitHub Actions when applicable)
- [x] `node node_modules/jest/bin/jest.js --config jest.m0.config.js --runInBand --runTestsByPath __tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts --forceExit`
- [ ] Structured browser QA (`docs/LEAD_INTELLIGENCE_M1_BROWSER_SMOKE_CHECKLIST.md`)
- [ ] Manual smoke:
  - [ ] `/lead-intelligence/[tenantId]/search`
  - [ ] `/lead-intelligence/[tenantId]/companies`
  - [ ] `/lead-intelligence/[tenantId]/saved-searches`
  - [ ] `/lead-intelligence/[tenantId]/exports`

## Evidence
- LI closure artifacts:
  - `docs/evidence/closure/2026-05-07T12-28-02-653Z-lead-intelligence-m1-closure-check.md`
  - `docs/evidence/closure/2026-05-07T12-32-47-671Z-lead-intelligence-m1-closure-check.md`
- Release-gate artifact:
  - `docs/evidence/release-gates/2026-05-07T12-32-29-539Z-release-gate-suite.json`
- M1 hardening note:
  - `docs/evidence/closure/2026-05-07-lead-intelligence-m1-hardening-note.md`

## Risk / rollback
- Risk level: medium-low (M1 path is functional and gate-covered; M2+ remains pending by design).
- Rollback plan:
  - Revert this PR to restore prior placeholder routes and gate config.
  - If needed, run previous release-gate command variant without LI gate coupling.

## Notes for reviewer
- Major shipped surfaces:
  - `apps/dashboard/app/api/lead-intelligence/discovery/companies/route.ts`
  - `apps/dashboard/app/api/lead-intelligence/saved-searches/route.ts`
  - `apps/dashboard/app/api/lead-intelligence/saved-searches/[id]/route.ts`
  - `apps/dashboard/app/api/lead-intelligence/exports/route.ts`
  - `apps/dashboard/app/lead-intelligence/[tenantId]/{search,companies,saved-searches,exports}/page.tsx`
  - `components/lead-intelligence/LeadIntelligenceM1StepIndicator.tsx`
  - `components/lead-intelligence/useLeadIntelligenceM1Progress.ts`
  - `scripts/run-lead-intelligence-m1-closure-check.mjs`
  - `.github/workflows/timeline-contracts-release-gate.yml`
  - `.github/workflows/lead-intelligence-m1-closure.yml`
  - `scripts/run-release-gate-suite.mjs`
- Watchouts:
  - Timeline release-gate workflow contract pins were updated and validated.
  - Local Jest instability is handled by per-suite timeout closure runner for LI gates.

## Open PR with GitHub CLI

From the repo root (requires [GitHub CLI](https://cli.github.com/) `gh` authenticated):

```bash
gh pr create ^
  --title "feat(dashboard): Lead Intelligence M1 discover, save, export" ^
  --body-file "docs/evidence/closure/2026-05-07-lead-intelligence-pr-body-draft.md"
```

On macOS/Linux use line continuations instead of `^`:

```bash
gh pr create \
  --title "feat(dashboard): Lead Intelligence M1 discover, save, export" \
  --body-file "docs/evidence/closure/2026-05-07-lead-intelligence-pr-body-draft.md"
```

Optional: omit the first `#` heading in the file before opening the PR if you prefer the GitHub UI title only (the file starts with `# Lead Intelligence PR - Draft Body`).
