# PMF & assurance scorecard — Finance

**Date:** 2026-05-17 · **Auditor:** Assurance program (static) · **Wave:** A1 + PMF week 1

## Job-to-be-done

Issue GST-aware invoices and track receivables without requiring full accounting on day one.

## Tier summary

| Overall tier (hypothesis) | **3 — Design partner ready** (invoice path); **2** for full GL/Tally replacement |
|---------------------------|-------------------------------------------------------------------------------------|

## Lens scores (1–5)

| Lens | Score | Notes |
|------|-------|-------|
| L1 Workflow | 3 | Composer in `finance-module`; canonical `apps/finance` thin (2 APIs); most APIs on dashboard |
| L2 Depth | 3 | GST fields, templates; e-invoice / full GL vs market — not verified |
| L3 Trust | 3 | 51/71 dashboard finance APIs guarded; 20 gap; audit on invoice mutations unverified |
| L4 UX/Polish | 3 | Module shell; `ignoreBuildErrors` on finance app |
| L5 ICP fit | 3 | Must position as invoice + GST, not full Tally replacement unless proven |

## Assurance (A1) — static

| Check | Status |
|-------|--------|
| SC-10 canonical finance app | PASS (2/2 routes) |
| SC-10 dashboard finance APIs | PARTIAL (20/71 unguarded) |
| SC-40 draft-first send | PENDING (staging) |
| SC-30 audit | PENDING |
| PR-07 Projects prefill | PASS (PR10 static) |
| Build | PASS |

## Top gaps

1. Map and fix 20 dashboard finance routes without `requireModuleAccess`.
2. Staging: invoice create, GST lines, milestone prefill, draft-not-send.
3. Audit trail proof for invoice create/update/send.
4. Remove or justify `typescript.ignoreBuildErrors` on `apps/finance`.

## Verdict

- [ ] Go for limited launch  
- [ ] Go with conditions  
- [x] **No-go (2026-05-18)** — staging unauthenticated finance/GST reads; see `a1-finance-api-gaps.md`  
