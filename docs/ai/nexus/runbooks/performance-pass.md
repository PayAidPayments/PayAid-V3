# Runbook: `performance-pass`

**Mode:** NEXUS-Micro  
**Use when:** summary APIs, heavy dashboards, or any performance-sensitive change.

## Roster

| Order | Agent | Activation |
|---|---|---|
| 0 | Agents Orchestrator | always |
| 1 | Product Strategist | always (scope + success metric) |
| 2 | Speed Auditor | always |
| 3 | Platform Architect | always |
| 4 | Database Optimizer / API Tester / SRE | as needed |
| 5 | Evidence Collector | always |
| 6 | Code Review Specialist | always |

## Ship blocked without

`speed-auditor`, `evidence-collector`, `code-reviewer`

## Steps

1. Product Strategist defines the user-visible performance outcome and budget.
2. Speed Auditor records baseline with a linked evidence artifact.
3. Platform Architect identifies hot paths, caching risks, and regression surfaces.
4. Implement the smallest fix that moves the measured metric.
5. Evidence Collector stores before/after numbers (and hosted probe output when applicable).
6. Code Review checks for accidental complexity and missing guards.

## Evidence minimum

- Baseline measurement path
- After measurement path
- Statement of budget met / not met

Claims without numbers are `fail`.

## Exit

Ship only when Speed Auditor decision is `pass` with linked measurements.
