# Runbook: `release`

**Mode:** NEXUS-Micro  
**Use when:** deciding go / no-go for production.

## Roster

| Order | Agent | Activation |
|---|---|---|
| 0 | Agents Orchestrator | always |
| 1 | Reality Checker | always |
| 2 | Evidence Collector | always |
| 3 | Code Review Specialist | always |
| 4 | No-404 QA / Speed Auditor / API Tester / SRE | as needed by change type |

## Required skill

`pilot-release-gate-go-no-go`

## Ship blocked without

`reality-checker`, `code-reviewer`

## Steps

1. Orchestrator gathers prior runbook handoffs for the ticket/PR.
2. Evidence Collector indexes all proof paths (tests, hosted checks, screenshots).
3. Reality Checker evaluates each release criterion against evidence.
4. Default decision is **NOT READY**.
5. READY only when every required criterion has linked proof and Code Review is not `block`.

## Reality Checker output format

| Criterion | Evidence | Result |
|---|---|---|
| Scope acceptance met | | pass/fail |
| Required specialist gates present | | pass/fail |
| Routes/API verified | | pass/fail/N/A |
| Tenant/security checks | | pass/fail/N/A |
| Rollback known | | pass/fail |
| Checklist update-log updated | | pass/fail |

Final: `READY` or `NOT READY` + blocking gaps.

## Exit

Do not promote/alias/ship while Reality Checker is NOT READY.
