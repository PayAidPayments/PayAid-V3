# PayAid NEXUS Handoff Templates (Internal)

Every specialist step writes a handoff. The next agent starts from this file, not from a chat summary.

Save under `docs/evidence/nexus/<ticket-id>/` using:

`<step>-<agent-slug>-YYYYMMDD.md`

Example: `02-platform-architect-20261003.md`

---

## Universal handoff header

```markdown
# Handoff: <agent-slug> → <next-agent-slug>

- Ticket:
- Runbook slug:
- Date:
- Decision: pass | needs-follow-up | fail | blocked
- Evidence paths:
- Checklist update done: yes/no

## Inputs consumed
- Prior handoffs:
- Scope summary:

## Outputs produced
1.
2.

## Open risks / blockers
-

## Exact next instruction
Paste this into the next specialist prompt:
> ...
```

---

## Product Strategist

Must produce:

1. Problem framing
2. User outcome
3. In-scope / out-of-scope
4. Acceptance criteria as pass/fail checks
5. Rollout risks

Ship gate impact: missing Product Strategist handoff blocks every runbook except an active `production-incident` containment step.

---

## Sprint Prioritizer

Must produce ordered tasks with:

- Owner role (specialist slug)
- Acceptance check
- Dependency notes

---

## Feedback Synthesizer

Must produce:

- Ranked themes
- Evidence quotes or ticket links
- Recommended changes mapped to modules

---

## Platform Architect

Must produce:

1. Touched modules and contracts
2. Data/API consistency risks
3. Dependency / sequence plan
4. Rollback strategy

Required when 2+ modules are touched, or on `schema-or-billing-change`.

---

## Software Architect

Must produce:

- Option A / Option B trade-offs
- Chosen approach and why
- Non-goals

---

## Database Optimizer

Must produce:

- Schema / index / query plan notes
- Migration sequence
- Rollback and data-risk notes

Pair with skill `prisma-migration-discipline` when Prisma changes.

---

## Domain specialists

CRM / Marketing / Finance-GST / Workflow / UX Cleanup must produce:

1. Implementation checklist by file area
2. Edge cases and business rules
3. Validation tests to run
4. Known pitfalls

Finance-GST additionally must state draft-first / approval requirements for any outbound or money-moving path.

---

## Evidence Collector

Must produce proof artifacts, not claims:

- Command outputs
- Screenshot or hosted URL checks
- Paths under `docs/evidence/`

Decision must be `pass` only when artifacts exist and are linked.

---

## API Tester

Must produce:

- Endpoint list tested
- Auth / tenant expectations
- Status codes observed
- Failures with reproduction notes

---

## No-404 QA

Must produce:

- Route / button / page checklist
- Auth, empty, and error states
- Explicit pass/fail per item

---

## Code Review Specialist

Must produce:

- Findings ordered by severity
- Residual risks
- Ship recommendation: approve | approve-with-followups | block

---

## Reality Checker

Defaults to **NOT READY**.

Must produce:

- Criterion → evidence → result table
- Final decision: READY | NOT READY
- Blocking gaps with owner

Uses skill `pilot-release-gate-go-no-go`.

---

## Speed Auditor

Must produce:

- Measured baseline
- Target budget
- Changes made
- After measurement with evidence path

---

## SRE

Must produce:

- Health signals checked
- Rollback readiness
- Monitoring / alert gaps

---

## Incident Response Commander

Must produce timeline:

1. Detect
2. Contain
3. Fix
4. Verify
5. Post-mortem actions

---

## Orchestrator status (optional, for long tickets)

```markdown
# Orchestrator status

- Runbook:
- Current step:
- Completed agents:
- Blocked on:
- Next agent:
- Ship gate: OPEN | BLOCKED
```
