# Day 4 Runtime Checks — Duplicate/Merge (Queue #5)

Run date: 2026-04-22T12:55:23.785Z
Owner: Phani
Queue: #5 (Day 4 closure)
Runbook: `docs/CRM_GA_SOLO_T04_QA_RUNBOOK.md`

## Environment

- Base URL: https://payaid-v3.vercel.app
- Tenant ID/slug: cmjptk2mw0000aocw31u48n64
- Operator: admin@demo.com
- Auth mode: Bearer token from /api/auth/login

## Results (A-D)

### A) Create duplicates

| ID | Result (Pass/Fail) | HTTP | Code/Signal | Notes |
|---|---|---|---|---|
| A1 | Pass | 201 | - | createdId=cmoa22tml0001hyqp5ipzomwh |
| A2 | Pass | 409 | DUPLICATE_CONTACT_FIELDS | existingId=cmoa22tml0001hyqp5ipzomwh |
| A3 | Pass | 201 | - | createdId=cmoa23a21000bhyqpkad52kx9 |
| A4 | Pass | 409 | DUPLICATE_CONTACT_FIELDS | existingId=cmoa23a21000bhyqpkad52kx9 |

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
| D3 | Fail | - | SKIPPED_NO_DUPLICATE_PAIR | no duplicate pair available |
| D4 | Pass | 409 | MERGE_GUARD_NO_OVERLAP | - |
| D5 | Pass | 409 | MERGE_GUARD_NO_PRIMARY_KEY | - |
| D6 | Fail | 500 | 
Invalid `prisma.scheduledEmail.updateMany()` invocation:


Transaction API error: Transaction not found. Transaction ID is invalid, refers to an old closed transaction Prisma doesn't have information about anymore, or was obtained before disconnecting. | bypassDuplicateSuggestionGuard=true |

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

- Post-fix local verification attempt (`BASE_URL=http://127.0.0.1:3000`) failed with `ECONNREFUSED` because no reachable local dev server was listening on port `3000` at run time.
- Deploy-capable verification attempt created deployment `dashboard-4m7ywsoo5-payaid-projects-a67c6b27.vercel.app`, but `vercel inspect --logs` remained `Queued` across repeated checks, so post-deploy D6 rerun could not be executed in this session.
