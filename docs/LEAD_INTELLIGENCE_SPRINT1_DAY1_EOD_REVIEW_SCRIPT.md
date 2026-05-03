# PayAid V3 Lead Intelligence - Sprint 1 Day 1 End-of-Day Review Script

## 1) Purpose

Run a consistent Day 1 closeout in 5-7 minutes with clear outcomes:

- status truth
- blocker truth
- dependency truth
- next-day readiness

Primary references:

- `docs/LEAD_INTELLIGENCE_SPRINT1_DAY1_DASHBOARD.md`
- `docs/LEAD_INTELLIGENCE_WORKSTREAM_HANDOFF.md`
- `docs/LEAD_INTELLIGENCE_SPRINT1_EXECUTION_PLAN.md`

## 2) Facilitator opening (readout)

`We are closing Day 1 for Lead Intelligence Sprint 1. This review confirms what is genuinely done, what remains blocked, and whether the critical chain is still on track for Day 2. Evidence links are required for all completed claims.`

## 3) Ticket-by-ticket closeout prompts

## LI-001 (`FE-APP`)

- What moved today (route shell, nav, guard checks)?
- What is complete vs still open?
- What evidence path confirms progress?

## LI-002 (`BE-DATA`)

- What schema/migration milestones are complete?
- Is schema freeze achieved or still pending?
- If pending, exact ETA and risk impact?

## LI-003 / LI-004 / LI-007 (`BE-PLATFORM`)

- What preparatory work is complete despite dependencies?
- Which item starts first on Day 2 and under what condition?
- Any contract risks discovered today?

## LI-005 (`FE-APP`)

- What UI scaffold prep is complete?
- What is blocked pending API availability?

## QA-AUTO

- Which test/contract scaffolds were prepared?
- What evidence links were added to dashboard/log?

## 4) Decision checks (must complete)

- [ ] Day 1 dashboard ticket statuses updated with realistic percentages.
- [ ] Every `Done` or major progress claim has evidence path.
- [ ] Open blockers have owner + ETA.
- [ ] Critical chain status is explicit: `LI-002 -> LI-004 -> LI-007`.
- [ ] Day 2 first action per lane is assigned.

## 5) Gate and risk mini-review

Read and confirm:

- Gate A trajectory (`LI-001` + `LI-002`) is `On track` / `At risk`.
- Biggest risk entering Day 2 is: `<state explicitly>`.
- Escalation owner for the top risk is: `<name>`.

## 6) End-of-day update actions (operator)

1. Update:
   - `docs/LEAD_INTELLIGENCE_SPRINT1_DAY1_DASHBOARD.md`
2. Append one change-log line in Day 1 dashboard.
3. If major shift occurred, reflect risk/dependency note in:
   - `docs/LEAD_INTELLIGENCE_SPRINT1_DAY2_DASHBOARD.md`

## 7) Facilitator closing line (readout)

`Day 1 close is complete when the dashboard reflects reality, blockers have owners and ETAs, and Day 2 starts are explicit. We carry forward only evidence-backed status.`
