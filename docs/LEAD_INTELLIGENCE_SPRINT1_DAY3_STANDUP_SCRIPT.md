# PayAid V3 Lead Intelligence - Sprint 1 Day 3 Standup Script

## 1) Purpose

Drive Day 3 execution toward API depth completion and stable UI/API integration.

Primary references:

- `docs/LEAD_INTELLIGENCE_SPRINT1_DAY3_DASHBOARD.md`
- `docs/LEAD_INTELLIGENCE_IMPLEMENTATION_TICKETS.md`
- `docs/LEAD_INTELLIGENCE_SPRINT1_EXECUTION_PLAN.md`

## 2) Facilitator opening (readout)

`Day 3 focus is API maturity and integration stability: move LI-004 to completion range, progress LI-003 audit/events, and advance LI-005 wiring without introducing contract drift. We keep LI-007 queued behind stable API contracts.`

## 3) Owner prompt sequence

## Prompt 1 - BE-PLATFORM (`LI-004`)

- Which ICP endpoints are fully implemented vs partially wired?
- What remains to close lifecycle coverage?
- Any payload/validation changes that FE and QA need immediately?

Expected commit line:

- `LI-004 completion path with explicit remaining endpoints`

## Prompt 2 - BE-PLATFORM (`LI-003`, `LI-007 prep`)

- What audit/event emissions are complete today?
- What LI-007 work can begin safely now vs after LI-004 closure?

Expected commit line:

- `LI-003 progress and LI-007 start conditions`

## Prompt 3 - FE-APP (`LI-005`)

- Which ICP UI actions are fully API-bound now?
- What UI behavior remains blocked by unresolved API endpoints?

Expected commit line:

- `LI-005 wiring status and blocker list`

## Prompt 4 - QA-AUTO

- Which contract/API tests are now executable?
- What gaps remain for Gate B confidence?

Expected commit line:

- `Day 3 API contract validation coverage`

## Prompt 5 - PM

- Confirm EOD target: `LI-004` near complete or complete.
- Confirm blocker escalation owner if contract drift appears.

Expected commit line:

- `Day 3 completion target and escalation ownership`

## 4) Decision checks before standup close

- [ ] `LI-004` remaining scope is explicit and finite.
- [ ] Any API contract change is documented and communicated same day.
- [ ] `LI-005` blocker list is current.
- [ ] `LI-003` progress is evidence-backed.
- [ ] Gate B confidence trajectory is visible.

## 5) Standup close line (readout)

`Day 3 success means reduced ambiguity: API completion scope is explicit, integration blockers are named, and QA has enough stable contract coverage to validate the path to Gate B.`
