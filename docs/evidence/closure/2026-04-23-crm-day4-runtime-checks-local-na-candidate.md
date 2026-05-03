# Day 4 Runtime Checks — Duplicate/Merge (Queue #5)

Run date: 2026-04-23T08:44:33.028Z
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
| A1 | Pass | 201 | - | createdId=cmob8kuis002syjbqfbbvnjbl |
| A2 | Pass | 409 | DUPLICATE_CONTACT_FIELDS | existingId=cmob8kuis002syjbqfbbvnjbl |
| A3 | Pass | 201 | - | createdId=cmob8l73i0032yjbqmwq0cdes |
| A4 | Pass | 409 | DUPLICATE_CONTACT_FIELDS | existingId=cmob8l73i0032yjbqmwq0cdes |

### B) Update duplicates

| ID | Result (Pass/Fail) | HTTP | Code/Signal | Notes |
|---|---|---|---|---|
| B1 | Pass | 409 | DUPLICATE_EMAIL | - |
| B2 | Pass | 409 | DUPLICATE_PHONE | - |
| B3 | Pass | 200 | - | - |

### C) Duplicate scan

| ID | Result (Pass/Fail) | HTTP | Code/Signal | Notes |
|---|---|---|---|---|
| C1 | Pass | 200 | - | dataCount=0 |

### D) Merge guards

| ID | Result (Pass/Fail) | HTTP | Code/Signal | Notes |
|---|---|---|---|---|
| D1 | Pass | 400 | MERGE_SAME_CONTACT | - |
| D2 | Pass | 404 | MERGE_CONTACT_NOT_FOUND | - |
| D3 | N/A-CANDIDATE | - | D3_NA_NO_DUPLICATE_PAIR | no duplicate pair available in current tenant dataset; requires explicit Product+QA acceptance |
| D4 | Pass | 409 | MERGE_GUARD_NO_OVERLAP | - |
| D5 | Pass | 409 | MERGE_GUARD_NO_PRIMARY_KEY | - |
| D6 | Pass | 200 | - | bypassDuplicateSuggestionGuard=true |

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
