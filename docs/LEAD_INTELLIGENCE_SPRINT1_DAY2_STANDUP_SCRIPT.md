# PayAid V3 Lead Intelligence - Sprint 1 Day 2 Standup Script

## 1) Purpose

Run a focused Day 2 kickoff that prioritizes dependency release and critical-chain progress.

Primary references:

- `docs/LEAD_INTELLIGENCE_SPRINT1_DAY2_DASHBOARD.md`
- `docs/LEAD_INTELLIGENCE_WORKSTREAM_HANDOFF.md`
- `docs/LEAD_INTELLIGENCE_IMPLEMENTATION_TICKETS.md`

## 2) Facilitator opening (readout)

`Day 2 objective is to close LI-002 and LI-001, then fully unblock LI-004. The critical chain remains LI-002 to LI-004 to LI-007. We will treat schema freeze timing as the main execution risk and keep blocker ETAs explicit.`

## 3) Owner prompt sequence

## Prompt 1 - BE-DATA (`LI-002`)

- Is schema freeze achieved now? If not, what exact remaining item exists?
- What is the hard ETA for freeze today?
- Any migration risk likely to affect ICP API timelines?

Expected commit line:

- `LI-002 freeze status and final ETA`

## Prompt 2 - FE-APP (`LI-001`, `LI-005 prep`)

- What remains to close `LI-001` today?
- Is ICP UI scaffold ready for API binding once `LI-004` lands?

Expected commit line:

- `LI-001 close plan and LI-005 prep status`

## Prompt 3 - BE-PLATFORM (`LI-004`, `LI-003`, `LI-007 prep`)

- What LI-004 endpoints are ready to wire immediately post-freeze?
- What LI-003 audit/event integration can run in parallel?
- What LI-007 prep can complete without full API finalization?

Expected commit line:

- `LI-004 immediate endpoint sequence and LI-003 parallel tasks`

## Prompt 4 - QA-AUTO

- Which contract tests can be prepared now vs after freeze?
- What evidence format will be added today to Day 2 dashboard?

Expected commit line:

- `Day 2 QA contract scaffold progression`

## Prompt 5 - PM

- Confirm midday checkpoint and EOD checkpoint times.
- Confirm blocker escalation owner if freeze slips.

Expected commit line:

- `Checkpoint and escalation ownership confirmed`

## 4) Decision checks before ending standup

- [ ] `LI-002` freeze state + ETA is explicit.
- [ ] `LI-004` first endpoint order is explicit.
- [ ] `LI-001` closure target is explicit.
- [ ] Blocker log has owner + ETA for every open blocker.
- [ ] Midday checkpoint is scheduled and acknowledged.

## 5) Standup close line (readout)

`Day 2 success is measured by dependency release: close LI-002 and LI-001, then convert LI-004 from scaffold to active implementation with evidence-linked progress updates.`
