# PMF & assurance scorecard — Projects & Service

**Date:** 2026-05-17 · **Auditor:** Assurance program (static) · **Wave:** A4 (early) + PR10 + PMF week 2

## Job-to-be-done

Deliver client work, track tasks/milestones, bill via Finance without losing CRM context.

## Tier summary

| Overall tier (hypothesis) | **3 — Design partner ready** (after PR10 merge); **staging not proven** |
|---------------------------|---------------------------------------------------------------------------|

## Lens scores (1–5)

| Lens | Score | Notes |
|------|-------|-------|
| L1 Workflow | 4 | CRM create → project → milestones → Finance draft (PR10) |
| L2 Depth | 3 | Kanban, Gantt, time, service packages/SLA — agency-grade reporting light |
| L3 Trust | 4 | **25/25** canonical APIs use `requireModuleAccess`; handoff + billing routes guarded |
| L4 UX/Polish | 3 | Shell unified; Home split ~140 KB route (post maturation) |
| L5 ICP fit | 4 | Strong for agency/services ICP; appointments deferred |

## PR #10 validation

| Check | Static | Staging |
|-------|--------|---------|
| Build | PASS | — |
| CRM Create Project | PASS | PENDING |
| Handoff prefill | PASS | PENDING |
| Milestones → draft → Finance | PASS (code) | PENDING |
| List billing indicator | PASS | PENDING |

**Staging:** **Not green (2026-05-18)** — `payaid-v3.vercel.app` has no projects API; see `pr10-staging-checklist-results.md`.

## Assurance

| Check | Status |
|-------|--------|
| SC-10 | PASS (canonical app) |
| SC-41 milestone approval | PASS (code paths) |
| PR-07 cross-module URLs | PENDING (staging env) |

## Top gaps

1. **P0:** No staging golden-path evidence yet.
2. Appointments integration deferred (market expectation for some ICPs).
3. `domain-projects` minimal — list GET only.

## Verdict

- [ ] Go for limited launch  
- [x] **Go with conditions** — merge PR10 + staging checklist green  
- [ ] No-go  
