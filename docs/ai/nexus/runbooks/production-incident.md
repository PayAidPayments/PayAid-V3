# Runbook: `production-incident`

**Mode:** NEXUS-Micro  
**Use when:** production is degraded, failing, or unsafe.

## Roster

| Order | Agent | Activation |
|---|---|---|
| 0 | Agents Orchestrator | always |
| 1 | Incident Response Commander | always |
| 2 | SRE | always |
| 3 | Platform Architect | always |
| 4 | Domain owner | as needed |
| 5 | Evidence Collector | post-fix (required to close) |
| 6 | API Tester | post-fix as needed |
| 7 | Code Review Specialist | post-fix for the fix |
| 8 | Product Strategist | post-fix for follow-up scope |

## Ship / close blocked without

`incident-response-commander`, `evidence-collector`

## Phases

### 1) Detect

- Confirm user impact, start time, and blast radius
- Declare severity

### 2) Contain

- Prefer rollback / feature flag / traffic stop over speculative edits
- SRE records health signals and mitigation

### 3) Fix

- Platform Architect + domain owner implement the smallest safe fix
- No unrelated refactors

### 4) Verify

- Evidence Collector + API Tester prove recovery
- Code Review on the fix before calling stable

### 5) Post-mortem

- Incident Commander writes timeline and actions
- Product Strategist files follow-up tickets (no silent scope expansion)

## Exception

Product Strategist is not required before containment.  
Incident is not closed until Evidence Collector has recovery proof.
