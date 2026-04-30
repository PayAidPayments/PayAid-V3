# PayAid V3 Lead Intelligence - Sprint 1 Day 2 End-of-Day Review Script

## 1) Purpose

Standardize Day 2 closeout with explicit dependency outcome checks and Day 3 readiness.

Primary references:

- `docs/LEAD_INTELLIGENCE_SPRINT1_DAY2_DASHBOARD.md`
- `docs/LEAD_INTELLIGENCE_SPRINT1_DAY3_DASHBOARD.md`
- `docs/LEAD_INTELLIGENCE_SPRINT1_EXECUTION_PLAN.md`

## 2) Facilitator opening (readout)

`We are closing Day 2. This review confirms whether we released the critical dependency path as planned and whether Day 3 can start with LI-004 and LI-003 at full speed. Evidence-backed status only.`

## 3) Ticket close prompts

## LI-001 (`FE-APP`)

- Is ticket closed today? If not, what exact residue remains?
- Evidence path for completion/progress?

## LI-002 (`BE-DATA`)

- Is schema freeze complete and validated?
- Any post-freeze caveat that could affect API work tomorrow?

## LI-004 (`BE-PLATFORM`)

- What endpoints are now implemented vs scaffold only?
- What remains to hit Day 3 API completion target?

## LI-003 (`BE-PLATFORM`)

- What event/audit pieces landed today?
- What is queued for Day 3 close?

## LI-005 / LI-007 prep

- What was unblocked today for UI wiring and planner work?
- What still depends on tomorrow’s API closure?

## QA-AUTO

- Which contract tests are active now?
- What gaps remain for Day 3 verification?

## 4) Decision checks (must pass)

- [ ] Day 2 dashboard ticket states are updated and realistic.
- [ ] Any claimed completion has evidence path.
- [ ] Critical chain state is explicit at EOD.
- [ ] Day 3 first actions are written by owner.
- [ ] Any open blocker has updated ETA.

## 5) Day 3 readiness verdict

Set one:

- `Ready`: dependencies released, Day 3 starts unblocked.
- `At risk`: one dependency issue may slow Day 3.
- `Not ready`: unresolved blocker requires re-plan.

Document rationale:

- `<1-2 lines>`

## 6) Operator update actions

1. Update:
   - `docs/LEAD_INTELLIGENCE_SPRINT1_DAY2_DASHBOARD.md` (EOD fields + change log)
2. Reflect next-day adjustments in:
   - `docs/LEAD_INTELLIGENCE_SPRINT1_DAY3_DASHBOARD.md`
3. If dependency slipped materially, append note in:
   - `docs/LEAD_INTELLIGENCE_SPRINT1_CLOSURE_DRAFT.md` (risk section)

## 7) Facilitator close line (readout)

`Day 2 close is complete when dependency truth is explicit, evidence links are present, and Day 3 starts are committed by owner with no ambiguous blockers.`
