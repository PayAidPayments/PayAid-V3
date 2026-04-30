# PayAid V3 Lead Intelligence - Ops Pack README

## 1) Purpose

This README is the single entry point for all Lead Intelligence planning and execution artifacts created for PayAid V3.

Use it as the canonical operator map from strategy through sprint closeout.

## 2) Recommended usage order

## Phase A - Strategy and implementation contract

1. `docs/LEAD_INTELLIGENCE_DATA_WORKFLOW_SPEC.md`
2. `docs/LEAD_INTELLIGENCE_UI_SCREEN_SPEC.md`

Outcome:

- Product logic, object model, state machine, and UI behavior contract are aligned.

## Phase B - Engineering decomposition

3. `docs/LEAD_INTELLIGENCE_BUILD_BACKLOG.md`
4. `docs/LEAD_INTELLIGENCE_IMPLEMENTATION_TICKETS.md`

Outcome:

- Work is split into epics/stories/API/tests and sprintable tickets with dependencies.

## Phase C - Sprint operations setup

5. `docs/LEAD_INTELLIGENCE_SPRINT1_EXECUTION_PLAN.md`
6. `docs/LEAD_INTELLIGENCE_SPRINT1_EXECUTION_DASHBOARD_TEMPLATE.md`
7. `docs/LEAD_INTELLIGENCE_SPRINT1_INDEX.md`

Outcome:

- Team has day-by-day plan, dashboard format, and one-page sprint launch index.

## Phase D - Daily execution

8. `docs/LEAD_INTELLIGENCE_SPRINT1_DAY1_DASHBOARD.md`
9. `docs/LEAD_INTELLIGENCE_SPRINT1_DAY2_DASHBOARD.md`
10. `docs/LEAD_INTELLIGENCE_SPRINT1_DAY3_DASHBOARD.md`
11. `docs/LEAD_INTELLIGENCE_SPRINT1_DAY4_DASHBOARD.md`
12. `docs/LEAD_INTELLIGENCE_SPRINT1_DAY5_DASHBOARD.md`

Outcome:

- Daily status, blockers, dependencies, and gate progression are tracked consistently.

## Phase E - Sprint closeout

13. `docs/LEAD_INTELLIGENCE_SPRINT1_CLOSURE_NOTE_TEMPLATE.md`
14. `docs/LEAD_INTELLIGENCE_SPRINT1_CLOSURE_DRAFT.md`
15. `docs/LEAD_INTELLIGENCE_SPRINT1_DAY5_CLOSEOUT_CHECKLIST.md`

Outcome:

- Closeout is standardized, evidence-backed, and fast to complete.

## 3) Operational rules

- Keep evidence links mandatory for every status change to `Done`.
- Update daily dashboard at standup and end-of-day.
- Keep blocker log current with owner and ETA.
- Treat `LI-002 -> LI-004 -> LI-007` as critical chain.
- Log meaningful updates in:
  - `docs/PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md`

## 4) Quick start (new operator)

1. Open `docs/LEAD_INTELLIGENCE_SPRINT1_INDEX.md`.
2. Open current day dashboard and update lane/ticket status.
3. Review blocker log and critical dependencies.
4. At day close, update gate status and evidence links.
5. Use closeout checklist on Day 5.

## 5) Definition of "ops pack complete"

Ops pack is considered complete when:

- Strategy specs exist (data/workflow + UI).
- Build decomposition exists (backlog + tickets).
- Sprint operations docs exist (plan + template + daily dashboards + index).
- Closeout docs exist (template + draft + closeout checklist).
- Tracker has append-only evidence-linked updates for all major additions.
