# PayAid V3 Lead Intelligence - Workstream Handoff (Next 24-48 Hours)

## 1) Purpose

Turn the completed planning pack into immediate execution by assigning concrete first actions per workstream with clear outputs.

Primary references:

- `docs/LEAD_INTELLIGENCE_OPS_PACK_README.md`
- `docs/LEAD_INTELLIGENCE_IMPLEMENTATION_TICKETS.md`
- `docs/LEAD_INTELLIGENCE_SPRINT1_DAY1_DASHBOARD.md`

## 2) Immediate priorities

- Unblock the critical chain: `LI-002 -> LI-004 -> LI-007`
- Keep `LI-001` in parallel to avoid frontend idle time
- Start QA contract scaffolding on Day 1 to prevent late-cycle test crunch

## 3) Owner-by-owner handoff

## BE-DATA (schema lane)

### Start now

1. Implement `LI-002` migration set for all Lead Intelligence entities.
2. Validate indexes/FK/enums against the data model spec.
3. Run migration up/down checks in dev.

### Deliver by next checkpoint

- Migration PR with schema notes.
- Evidence note with up/down validation result.

### Dependency impact

- Blocks `LI-003`, `LI-004`, and `LI-007`.

## BE-PLATFORM (API + orchestration lane)

### Start now

1. Prepare request/response contracts for `LI-004` and `LI-007`.
2. Add audit/event helper stubs for `LI-003`.
3. Implement ICP routes immediately after schema freeze.

### Deliver by next checkpoint

- ICP API scaffold PR (`create/list/get/update/activate/archive/clone`).
- Event payload schema draft and endpoint map.

### Dependency impact

- `LI-004` unlocks `LI-005` and `LI-007`.

## FE-APP (module + ICP UI lane)

### Start now

1. Complete `LI-001` route tree and module nav entry.
2. Build ICP Builder UI skeleton tied to mock contracts.
3. Keep lifecycle action hooks ready for API binding.

### Deliver by next checkpoint

- Route/nav PR with no-404 path check notes.
- ICP UI scaffold PR (form sections complete).

### Dependency impact

- `LI-005` wiring blocked until `LI-004` is stable.

## QA-AUTO (test lane)

### Start now

1. Create contract test skeletons for ICP and planning endpoints.
2. Add route smoke checklist for Lead Intelligence screens.
3. Prepare Day 1 evidence log entries.

### Deliver by next checkpoint

- Test scaffold PR (`m0`/route/API skeletons).
- Initial QA evidence entries in sprint dashboard.

### Dependency impact

- Early QA scaffolding reduces late rework on `LI-004` and `LI-005`.

## PM (delivery lane)

### Start now

1. Assign named owners to all Sprint 1 tickets in day dashboards.
2. Confirm Day 1 and Day 2 checkpoint timings.
3. Enforce blocker log hygiene with ETA and owner on each blocker.

### Deliver by next checkpoint

- Updated day dashboard with real owners.
- Standup note with risk and dependency status.

## 4) 24-hour output checklist

- [ ] `LI-001` route shell is near-close or done.
- [ ] `LI-002` migration is complete or in final review.
- [ ] `LI-004` API scaffold is active once schema is frozen.
- [ ] QA contract skeletons are committed.
- [ ] Day dashboard updated twice (standup + EOD).

## 5) Escalation rules

- If `LI-002` slips beyond Day 2 EOD, escalate immediately and re-sequence Sprint 1.
- If `LI-004` contract changes after FE wiring starts, freeze API deltas and issue versioned contract notes.
- If any ticket marked `Done` lacks evidence link, downgrade status to `In progress` until evidence exists.

## 6) Handoff completion criteria

Handoff is complete when:

- each owner has explicit next actions,
- each action has expected output artifacts,
- dependencies and blockers are visible in daily dashboard,
- the first 24-hour execution checklist is satisfied.
