# Lead Intelligence M1 - Handoff Runbook

Date: 2026-05-09  
Audience: engineering, QA, release operators

## What is shipped in M1

- Standalone dashboard journey:
  - `Step 1` search planner
  - `Step 2` companies results
  - `Step 3` saved searches
  - `Step 4` CSV export
- License-gated APIs under `lead-intelligence`:
  - `/api/lead-intelligence/discovery/companies`
  - `/api/lead-intelligence/saved-searches` (+ `PATCH /[id]` rename/archive, `DELETE /[id]`)
  - `/api/lead-intelligence/exports`
  - `/api/lead-intelligence/health`
- Audit and failure handling:
  - search/save/export events are written
  - failed exports are persisted as `LeadExportJob.status=FAILED`

## Browser smoke (M1)

- Step-by-step URLs and UX checks: `docs/LEAD_INTELLIGENCE_M1_BROWSER_SMOKE_CHECKLIST.md`
- Module home links the four-step M1 ribbon (**Search → Companies → Saved → Exports**) for quick onboarding.

## Canonical commands

- Run LI targeted closure check (artifact-producing):
  - `npm run check:lead-intelligence-m1-closure`
- Run LI gate via release-gate suite:
  - `npm run release:gate:lead-intelligence-m1-contracts`
- Run timeline bundle (now includes LI gate by default):
  - `npm run release:gate:timeline-contracts`

## Open a PR (GitHub CLI)

Draft body file: `docs/evidence/closure/2026-05-07-lead-intelligence-pr-body-draft.md`

```bash
gh pr create --title "feat(dashboard): Lead Intelligence M1 discover, save, export" --body-file "docs/evidence/closure/2026-05-07-lead-intelligence-pr-body-draft.md"
```

Blank template (fill yourself): `docs/LEAD_INTELLIGENCE_PR_BODY_TEMPLATE.md`

## Latest evidence artifacts

- LI closure artifact (pass):
  - `docs/evidence/closure/2026-05-07T12-28-02-653Z-lead-intelligence-m1-closure-check.md`
- Latest LI closure artifact (pass, subsequent run):
  - `docs/evidence/closure/2026-05-07T12-32-47-671Z-lead-intelligence-m1-closure-check.md`
- Release-gate suite artifact for LI gate integration:
  - `docs/evidence/release-gates/2026-05-07T12-32-29-539Z-release-gate-suite.json`
- M1 hardening note:
  - `docs/evidence/closure/2026-05-07-lead-intelligence-m1-hardening-note.md`

## Telemetry & metrics (M1)

- **In-process + StatsD:** `lib/lead-intelligence/telemetry.ts` increments named actions (aligned with audit verbs) for dashboards/alerting. StatsD requires `STATSD_HOST` + `STATSD_PORT` (see `lib/monitoring/statsd.ts`).
- **Funnel-style outcomes:** After each successful discovery request, increments **`discovery_results_nonempty`** or **`discovery_results_empty`** in addition to **`search_started`**. After each successful CSV export job, increments **`export_csv_nonempty`** or **`export_csv_empty`** in addition to **`export_requested`**.
- **Ops-only health snapshot:** Set `LEAD_INTELLIGENCE_TELEMETRY_IN_HEALTH=1` so `GET /api/lead-intelligence/health` includes `telemetry.countersSinceProcessStart` (per isolate; resets on cold start).
- **Faster local M0 transpile:** `tsconfig.jest-m0.json` includes `lib/lead-intelligence/**` and dashboard `api/lead-intelligence/**`; `jest.m0.config.js` sets `ts-jest` **`isolatedModules: true`** to reduce transformer work.

## Remaining M1 minor gaps

- Execute and tick the browser checklist above before release-signoff where applicable.
- Local Windows Jest runs can remain slow; prefer Ubuntu CI (workflow **Lead Intelligence M1 closure**) or timeline bundle for deterministic feedback.

## M2+ carry-forward (not part of M1)

- Enrichment + provenance UI
- Scoring + qualification gating
- Activation queue + CRM/Comms upsell orchestration
- Credits/metering and connector hardening

## PR description template (Lead Intelligence changes)

Use this in PR bodies for LI features/fixes:

```md
## Summary
- <What changed in Lead Intelligence>
- <Why this change was needed>

## Scope
- [ ] M1 discover/save/export
- [ ] M2 enrichment/provenance
- [ ] M3 scoring/qualification
- [ ] M4 activation/upsell
- [ ] M5 observability/governance

## Test plan
- [ ] `npm run check:lead-intelligence-m1-closure`
- [ ] `npm run release:gate:lead-intelligence-m1-contracts` (if gate-related/API-contract changes)
- [ ] Manual smoke on `/lead-intelligence/[tenantId]/search|companies|saved-searches|exports`

## Evidence
- Closure artifact: `docs/evidence/closure/<timestamp>-lead-intelligence-m1-closure-check.md`
- Gate artifact (if run): `docs/evidence/release-gates/<timestamp>-release-gate-suite.json`
- Additional notes/screenshots: `docs/evidence/closure/<your-artifact>.md`

## Risk / rollback
- Risk level: <low|medium|high>
- Rollback plan: <revert commit / disable route / feature flag path>
```

Copy-ready file version: `docs/LEAD_INTELLIGENCE_PR_BODY_TEMPLATE.md`
