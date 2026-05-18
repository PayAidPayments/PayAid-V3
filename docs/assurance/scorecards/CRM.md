# PMF & assurance scorecard — CRM

**Date:** 2026-05-17 · **Auditor:** Assurance program (static) · **Wave:** A2 + PMF week 1

## Job-to-be-done

Progress revenue relationships: contacts, deals, activities, with visibility for the team.

## Tier summary

| Overall tier (hypothesis) | **3 — Design partner ready** |
|---------------------------|------------------------------|

## Lens scores (1–5)

| Lens | Score | Notes |
|------|-------|-------|
| L1 Workflow | 4 | Canonical `apps/crm` (3001); pipeline, contacts, deals, tasks — Wave 1 green |
| L2 Depth | 3 | vs Freshsales/Zoho: automation, CPQ, sequences present in API surface; depth uneven |
| L3 Trust | 3 | 61/85 APIs `requireModuleAccess`; 24 exceptions; partial `logCrmAudit` |
| L4 UX/Polish | 3 | Home ~580 KB; shell unified on canonical app |
| L5 ICP fit | 4 | Strong India SMB CRM story; appointments/contracts still dashboard SUB |

## Assurance (A2) — static

| Check | Status |
|-------|--------|
| SC-10 module access | PARTIAL |
| SC-30 audit | PARTIAL |
| PR-07 → Projects handoff | PASS (PR10) |
| Build | PASS (Wave 2 doc) |
| Staging E2E | PENDING |

## Top gaps

1. Auth equivalence for 24 non-`requireModuleAccess` routes (proxies, shared exports).
2. Runtime pipeline + `release:gate:crm-audit` not run.
3. Perf: Home bundle budget.

## Verdict

- [ ] Go for limited launch  
- [x] **Go with conditions** — complete A2 runtime + auth matrix  
- [ ] No-go  
