# Lead Intelligence PR Body Template

Copy/paste this into GitHub PR description and replace placeholders.

## Summary
- <What changed in Lead Intelligence>
- <Why this change was needed>
- <Any user/operator impact>

## Scope
- [ ] M1 discover/save/export
- [ ] M2 enrichment/provenance
- [ ] M3 scoring/qualification
- [ ] M4 activation/upsell
- [ ] M5 observability/governance

## Test plan
- [ ] `npm run check:lead-intelligence-m1-closure`
- [ ] `npm run release:gate:lead-intelligence-m1-contracts` (if gate/API-contract changes)
- [ ] `npm run release:gate:timeline-contracts` (if timeline/workflow wiring changed)
- [ ] `.github/workflows/lead-intelligence-m1-closure` run is green when LI-touching paths trigger it
- [ ] `docs/LEAD_INTELLIGENCE_M1_BROWSER_SMOKE_CHECKLIST.md` reviewed / ticked (release sign-off)
- [ ] Manual smoke:
  - [ ] `/lead-intelligence/[tenantId]/search`
  - [ ] `/lead-intelligence/[tenantId]/companies`
  - [ ] `/lead-intelligence/[tenantId]/saved-searches`
  - [ ] `/lead-intelligence/[tenantId]/exports`

## Evidence
- Closure artifact:
  - `docs/evidence/closure/<timestamp>-lead-intelligence-m1-closure-check.md`
- Gate artifact (if run):
  - `docs/evidence/release-gates/<timestamp>-release-gate-suite.json`
- Additional artifact(s):
  - `docs/evidence/closure/<artifact>.md`

## Risk / rollback
- Risk level: <low|medium|high>
- Rollback plan:
  - <revert commit(s)> OR
  - <disable route / feature path> OR
  - <restore prior gate/script config>

## Notes for reviewer
- Key files touched:
  - `<path>`
  - `<path>`
- Watchouts:
  - <contract pin updates / timeout env sync / route-gate coupling>
