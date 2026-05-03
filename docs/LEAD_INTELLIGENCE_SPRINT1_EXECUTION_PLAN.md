# PayAid V3 Lead Intelligence - Sprint 1 Execution Plan (Day-by-Day)

## 1) Sprint 1 goal

Deliver the foundation needed to unblock downstream discovery and workflow implementation:

- `LI-001`, `LI-002`, `LI-003`, `LI-004`, `LI-005`, `LI-007`

Source tickets:

- `docs/LEAD_INTELLIGENCE_IMPLEMENTATION_TICKETS.md`

## 2) Team lanes for Sprint 1

- `BE-DATA`: schema and migration foundation
- `BE-PLATFORM`: audit/events + ICP API + search planning
- `FE-APP`: module shell/navigation + ICP UI
- `QA-AUTO`: early contract scaffold + test harness prep
- `PM`: dependency tracking + acceptance signoffs

## 3) Dependency-safe order

1. `LI-001` (route shell)
2. `LI-002` (core schema migrations)
3. `LI-003` (audit/event baseline) depends on `LI-002`
4. `LI-004` (ICP API) depends on `LI-002`
5. `LI-005` (ICP UI) depends on `LI-001` + `LI-004`
6. `LI-007` (search planning) depends on `LI-002` + `LI-004`

## 4) Day-by-day plan (5-day sprint model)

## Day 1 - Foundation kickoff

### Primary assignments

- `BE-DATA`: start `LI-002` schema + migration draft.
- `FE-APP`: start `LI-001` standalone module routes + nav entry.
- `BE-PLATFORM`: create event/audit contract stubs for `LI-003` (blocked implementation until schema readiness).
- `QA-AUTO`: create Sprint 1 test scaffold (schema contract test placeholders, route availability checks).
- `PM`: confirm scope lock and acceptance criteria per ticket.

### End-of-day checkpoints

- Route skeleton exists for all required Lead Intelligence screens.
- Migration draft includes all entities/enums/indexes.
- Open risks and blockers logged.

## Day 2 - Schema complete + shell stabilization

### Primary assignments

- `BE-DATA`: finish `LI-002`; run migration validation in dev.
- `FE-APP`: finish `LI-001`; ensure no-404 for route placeholders.
- `BE-PLATFORM`: begin `LI-004` API scaffolding immediately after schema completion.
- `QA-AUTO`: add migration smoke + route smoke checks to CI test list.

### End-of-day checkpoints

- `LI-002` ready for review (migrations apply/rollback validated).
- `LI-001` ready for review (navigation and route shell stable).
- `LI-004` endpoint scaffolds committed (handlers + validation shells).

## Day 3 - API core

### Primary assignments

- `BE-PLATFORM`: complete `LI-004` (`icp_profile` CRUD + lifecycle routes + validation).
- `BE-PLATFORM`: start `LI-003` event/audit write path integration.
- `FE-APP`: start `LI-005` ICP Builder UI with real API wiring.
- `QA-AUTO`: implement API contract tests for ICP endpoints.

### End-of-day checkpoints

- ICP API supports create/list/get/update/activate/archive/clone.
- Audit/event payload structures agreed and wired to key actions.
- ICP UI form sections implemented with save draft flow.

## Day 4 - Search planning and UI completion

### Primary assignments

- `BE-PLATFORM`: implement `LI-007` search planning service and state transitions.
- `BE-PLATFORM`: finalize `LI-003` event emissions for search + ICP actions.
- `FE-APP`: complete `LI-005` lifecycle actions (activate/archive/clone) and validation UX.
- `QA-AUTO`: add tests for planner transition rules and invalid query handling.

### End-of-day checkpoints

- `LI-007` supports draft -> planned -> running transitions.
- `LI-005` is fully wired to API lifecycle actions.
- Event/audit records visible for completed actions.

## Day 5 - Hardening and sprint closure

### Primary assignments

- `BE-DATA` + `BE-PLATFORM`: bug fixes and integration cleanup.
- `FE-APP`: route/UX polish and empty-state verification.
- `QA-AUTO`: run Sprint 1 regression pack.
- `PM`: run acceptance review, close or carry over tickets.

### End-of-day checkpoints

- Sprint 1 tickets meet done criteria or are explicitly split.
- Test evidence and known gaps documented.
- Sprint 2 start prerequisites confirmed.

## 5) Daily standup checklist

- What changed since last day by ticket ID?
- Any dependency blocked by unfinished predecessor ticket?
- Any API contract drift from specs/backlog?
- Any new risk to non-negotiable rules?
- Is QA coverage keeping pace with implementation?

## 6) Risk register (Sprint 1)

## R1 - Schema churn risk

- Risk: entity fields change while API/UI work starts.
- Mitigation: freeze schema contract by end of Day 2.

## R2 - Route drift risk

- Risk: module routes accidentally tie back into CRM layout.
- Mitigation: add route smoke checks and explicit layout assertions.

## R3 - Validation mismatch risk

- Risk: UI rules diverge from API validation rules.
- Mitigation: shared validation constants + contract tests for invalid payloads.

## R4 - Event payload inconsistency risk

- Risk: audit/event payloads vary by action.
- Mitigation: centralized event helper and schema-checked payloads.

## 7) Sprint 1 acceptance gates

- Gate A: `LI-001` + `LI-002` complete and verified.
- Gate B: `LI-004` API routes pass contract tests.
- Gate C: `LI-005` UI flows pass manual smoke + lint/tests.
- Gate D: `LI-007` planning transitions tested and auditable.
- Gate E: Sprint closure note prepared with carry-over list (if any).

## 8) Carry-over policy to Sprint 2

If any Sprint 1 ticket is not fully closed:

- split remaining work into explicit subtask(s),
- record dependency impact on Sprint 2 tickets,
- block Sprint 2 ticket start only where hard dependency exists.
