# Day 4 Runtime Checks — Duplicate/Merge (Queue #5)

Run date: 2026-04-23T07:51:28.555Z
Owner: Phani
Queue: #5 (Day 4 closure)
Runbook: `docs/CRM_GA_SOLO_T04_QA_RUNBOOK.md`

## Environment

- Base URL: http://127.0.0.1:3000
- Tenant ID/slug: cmjptk2mw0000aocw31u48n64
- Operator: admin@demo.com
- Auth mode: Bearer token from /api/auth/login

## Results (A-D)

### A) Create duplicates

| ID | Result (Pass/Fail) | HTTP | Code/Signal | Notes |
|---|---|---|---|---|
| A1 | Fail | 503 | Contact service is temporarily busy | - |
| A2 | Fail | 201 | - | - |
| A3 | Pass | 201 | - | createdId=cmob6vqvi000lyjbqcarn3q7c |
| A4 | Pass | 409 | DUPLICATE_CONTACT_FIELDS | existingId=cmob6vqvi000lyjbqcarn3q7c |

### B) Update duplicates

| ID | Result (Pass/Fail) | HTTP | Code/Signal | Notes |
|---|---|---|---|---|
| B1 | Pass | 409 | DUPLICATE_EMAIL | - |
| B2 | Fail | 200 | - | - |
| B3 | Pass | 200 | - | - |

### C) Duplicate scan

| ID | Result (Pass/Fail) | HTTP | Code/Signal | Notes |
|---|---|---|---|---|
| C1 | Pass | 200 | - | dataCount=0 |

### D) Merge guards

| ID | Result (Pass/Fail) | HTTP | Code/Signal | Notes |
|---|---|---|---|---|
| D1 | Fail | - | SKIPPED_NO_A1 | - |
| D2 | Fail | - | SKIPPED_NO_A1 | - |
| D3 | Fail | - | SKIPPED_NO_DUPLICATE_PAIR | no duplicate pair available |
| D4 | Fail | - | SKIPPED_NO_A1_A3 | - |
| D5 | Pass | 409 | MERGE_GUARD_NO_PRIMARY_KEY | - |
| D6 | Fail | - | SKIPPED_NO_A1_A3 | bypassDuplicateSuggestionGuard=true |

## Product merge UX signoff

- Owner:
- Date:
- Decision: Pending
- Notes:

## Closure decision for Queue #5

- Status: Partial (default until all rows + signoff complete)
- Remaining blockers:
  - Product merge UX signoff pending

## Notes

- No additional notes.
