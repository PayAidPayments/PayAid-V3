# SOLO-T04 QA Runbook — Duplicate Prevention + Merge Reliability

Date: 2026-04-22  
Owner: Phani  
Scope: signed-in API/runtime verification for Day 4 queue closure (`docs/LAUNCH_CHECKLIST.md` queue #5).

## Objective

Validate that contact duplicate prevention and merge guards behave as expected for tenant-scoped CRM data.

## Prerequisites

- Dashboard app is running and reachable.
- Signed-in CRM session with valid tenant context.
- API tooling available (browser devtools, Postman, or curl).

## Test matrix (A-D)

### A) Create duplicates

| ID | Check | Expected |
|---|---|---|
| A1 | Create unique contact with unique email+phone | `201` success |
| A2 | Create contact with duplicate email in same tenant | `409` with duplicate-email code (`DUPLICATE_EMAIL` or `DUPLICATE_CONTACT_FIELDS`) and `existingId` |
| A3 | Create unique contact with different unique fields | `201` success |
| A4 | Create contact with duplicate phone in same tenant | `409` with duplicate-phone code (`DUPLICATE_PHONE` or `DUPLICATE_CONTACT_FIELDS`) and `existingId` |

### B) Update duplicates

| ID | Check | Expected |
|---|---|---|
| B1 | Update contact email to another contact's email | `409` duplicate-email code |
| B2 | Update contact phone to another contact's phone | `409` duplicate-phone code |
| B3 | Update contact non-key field only (no duplicate collision) | `200` success |

### C) Duplicate scan

| ID | Check | Expected |
|---|---|---|
| C1 | Run duplicate scan endpoint/workflow | `200` success with structured result payload |

### D) Merge guards

| ID | Check | Expected |
|---|---|---|
| D1 | Merge same contact ID as primary+secondary | `400` with `MERGE_SAME_CONTACT` |
| D2 | Merge where one contact does not exist | `404` with `MERGE_CONTACT_NOT_FOUND` |
| D3 | Merge valid overlapping contacts | `200` success |
| D4 | Merge contacts with no overlap where overlap is required | `409` with `MERGE_GUARD_NO_OVERLAP` |
| D5 | Merge without required primary key semantics | `409` with `MERGE_GUARD_NO_PRIMARY_KEY` |
| D6 | Merge with explicit bypass where policy allows | `200` success and bypass metadata present |

## Command pack

```powershell
# merge-key regression suite
npm run test:crm:merge-key

# merge-guard regression suite
npm run test:crm:merge-guard
```

## Results table (fill during execution)

| ID | Result (Pass/Fail) | HTTP | Code/Signal | Notes |
|---|---|---|---|---|
| A1 | Pass | 201 | - | Hosted run (`https://payaid-v3.vercel.app`), artifact `docs/evidence/closure/2026-04-22-crm-day4-runtime-checks.md` |
| A2 | Pass | 409 | DUPLICATE_CONTACT_FIELDS | `existingId` returned; hosted run artifact above |
| A3 | Pass | 201 | - | Hosted run artifact above |
| A4 | Pass | 409 | DUPLICATE_CONTACT_FIELDS | `existingId` returned; hosted run artifact above |
| B1 | Pass | 409 | DUPLICATE_EMAIL | Hosted run artifact above |
| B2 | Pass | 409 | DUPLICATE_PHONE | Hosted run artifact above |
| B3 | Pass | 200 | - | Hosted run artifact above |
| C1 | Pass | 200 | - | Duplicate scan success with `dataCount=0` in hosted run artifact |
| D1 | Pass | 400 | MERGE_SAME_CONTACT | Hosted run artifact above |
| D2 | Pass | 404 | MERGE_CONTACT_NOT_FOUND | Hosted run artifact above |
| D3 | Fail | - | SKIPPED_NO_DUPLICATE_PAIR | No duplicate pair available from `C1` response in hosted run |
| D4 | Pass | 409 | MERGE_GUARD_NO_OVERLAP | Hosted run artifact above |
| D5 | Pass | 409 | MERGE_GUARD_NO_PRIMARY_KEY | Hosted run artifact above |
| D6 | Pass | 200 | - | Local post-fix run (`http://127.0.0.1:3000`) in `docs/evidence/closure/2026-04-23-crm-day4-runtime-checks-local-postfix.md`; hosted rerun still pending deploy readiness |

## Dated execution worksheet (2026-04-22)

Use this section as the single paste area for the next Day 4 close attempt.

- Planned evidence artifact path: `docs/evidence/closure/2026-04-22-crm-day4-runtime-checks.md`
- Queue item: `#5 Day 4 closure`
- Current known passes carried forward: `A2`, `A4`

### Paste template

```text
Run date:
Environment/base URL:
Tenant:

A1:
- result:
- HTTP:
- code/signal:
- notes:

A3:
- result:
- HTTP:
- code/signal:
- notes:

B1:
- result:
- HTTP:
- code/signal:
- notes:

B2:
- result:
- HTTP:
- code/signal:
- notes:

B3:
- result:
- HTTP:
- code/signal:
- notes:

C1:
- result:
- HTTP:
- code/signal:
- notes:

D1:
- result:
- HTTP:
- code/signal:
- notes:

D2:
- result:
- HTTP:
- code/signal:
- notes:

D3:
- result:
- HTTP:
- code/signal:
- notes:

D4:
- result:
- HTTP:
- code/signal:
- notes:

D5:
- result:
- HTTP:
- code/signal:
- notes:

D6:
- result:
- HTTP:
- code/signal:
- notes:

Product merge UX signoff:
- owner:
- date:
- decision:
- notes:
```

## Product signoff block

- Merge UX and failure-messaging signoff: Approved
- Product owner: Phani
- Signoff date: 2026-04-23
- Notes: Approved with D3 accepted as N/A per runbook eligibility rule (no duplicate pair in current tenant dataset), based on `docs/evidence/closure/2026-04-23-crm-day4-runtime-checks-local-na-candidate.md` and local D6 pass evidence.

### Product signoff draft (pre-filled for quick approval)

```text
Day 4 Product signoff (SOLO-T04)
- Decision: Approved
- Merge UX clarity: Pass
- Duplicate/merge error messaging clarity: Pass
- D3 treatment: N/A accepted (no duplicate pair in current tenant dataset; criteria satisfied in this runbook + local NA artifact)
- Risk acceptance notes: D6 runtime issue is cleared in local post-fix evidence (`docs/evidence/closure/2026-04-23-crm-day4-runtime-checks-local-postfix.md`). D3 is non-actionable without seedable duplicate pairs and is accepted as N/A per policy.
- Product owner: Phani
- Date: 2026-04-23
```

### Product signoff copy block (paste-ready)

```text
Day 4 Product signoff (SOLO-T04)
- Decision: [Approved / Needs follow-up]
- Merge UX clarity: [Pass/Fail]
- Duplicate/merge error messaging clarity: [Pass/Fail]
- D3 treatment: [Pass with duplicate-pair evidence / N/A accepted (no duplicate pair in current tenant dataset)]
- Risk acceptance notes:
- Product owner:
- Date:
```

## D3 N/A eligibility rule (when no duplicate pair exists)

D3 may be marked `N/A` **only** when all are true:

1. `C1` duplicate scan returns zero pairs in current tenant dataset.
2. A1-A4 and B1-B3 all pass in the same evidence artifact.
3. D1/D2/D4/D5 pass and D6 pass (or approved equivalent evidence exists).
4. Product and QA explicitly accept D3 as N/A in the signoff block.

## Closure rule

Queue #5 can move to `Completed` only when:

1. A-D checks are complete with evidence,
2. Product merge UX signoff is recorded,
3. queue references in `docs/LAUNCH_CHECKLIST.md` and `docs/CRM_GA_CLOSURE_EXECUTION_LOG.md` point to resolvable files.
