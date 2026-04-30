# PayAid V3 Lead Intelligence - Sprint 1 Day 1 Standup Script

## 1) Purpose

Use this script to run a fast, dependency-aware Day 1 kickoff standup in 2-3 minutes.

Primary references:

- `docs/LEAD_INTELLIGENCE_SPRINT1_DAY1_DASHBOARD.md`
- `docs/LEAD_INTELLIGENCE_WORKSTREAM_HANDOFF.md`
- `docs/LEAD_INTELLIGENCE_IMPLEMENTATION_TICKETS.md`

## 2) Facilitator script (readout)

`We are starting Sprint 1 for Lead Intelligence. Today’s goal is to move LI-001 and LI-002 in parallel and prepare LI-004 to start as soon as schema is frozen. The critical chain remains LI-002 to LI-004 to LI-007.`

`Current Day 1 status baseline is: LI-001 in progress, LI-002 in progress, and LI-003/LI-004/LI-005/LI-007 blocked by dependency flow. We will keep blockers explicit and timestamped in the dashboard blocker log.`

`By end of day, we need route shell progress, migration draft maturity, and API contract scaffolding readiness. Any schema freeze risk must be escalated immediately because it impacts API and planner timeline.`

`We will close with owner commitments, blocker ETAs, and evidence-link expectations for every status update.`

## 3) Owner prompt sequence

## Prompt 1 - BE-DATA (`LI-002`)

- What exact schema/migration milestone will you finish today?
- Any enum/FK/index decision that can block API implementation?
- ETA for schema freeze confidence?

Expected commit line:

- `LI-002 migration draft and validation status by EOD`

## Prompt 2 - FE-APP (`LI-001`)

- Which route/nav deliverables are being completed today?
- Any unresolved naming or shell-layout decision?
- ETA for no-404 placeholder readiness?

Expected commit line:

- `LI-001 route shell and module navigation progress`

## Prompt 3 - BE-PLATFORM (`LI-003`, `LI-004`, `LI-007`)

- What contract stubs are ready before schema freeze?
- What is the first LI-004 endpoint you will wire after schema freeze?
- What is blocked for LI-007 today and what can still be prepared?

Expected commit line:

- `LI-004 scaffold readiness and LI-007 prep state`

## Prompt 4 - QA-AUTO

- Which contract and route smoke skeletons will be in place today?
- What evidence format will be used for Day 1 updates?

Expected commit line:

- `QA scaffold readiness with initial evidence paths`

## Prompt 5 - PM

- Confirm owner assignment on all Sprint 1 tickets.
- Confirm checkpoint times (midday and EOD).
- Confirm escalation owner for critical-chain slippage.

Expected commit line:

- `Dashboard owners/checkpoints/escalation fields updated`

## 4) Decision checks before ending standup

- [ ] `LI-002` freeze ETA is explicit.
- [ ] `LI-001` no-404 path check owner is explicit.
- [ ] `LI-004` post-freeze first endpoint is explicit.
- [ ] Blocker log has owner + ETA for each open blocker.
- [ ] Next checkpoint time is announced.

## 5) Standup close line (readout)

`Today’s success condition is simple: maintain momentum on LI-001 and LI-002, keep the critical chain visible, and leave no blocker without owner, ETA, and dashboard trace. We will reconvene at checkpoint with evidence-linked updates only.`
