# PR #10 — Staging validation results

**Branch:** `feat/projects-maturation-batch` (`7a999d893`+)  
**PR:** https://github.com/PayAidPayments/PayAid-V3/pull/10  
**Date:** 2026-05-18

## Deploy assumption

Golden path requires **three hosts** (or monolith with canonical URLs):

| App | Port (local) | Staging |
|-----|--------------|---------|
| CRM | 3001 | `NEXT_PUBLIC_CRM_APP_URL` |
| Projects | 3007 | `NEXT_PUBLIC_PROJECTS_APP_URL` |
| Finance | 3011 | `NEXT_PUBLIC_FINANCE_APP_URL` |

**Probe:** `https://payaid-v3.vercel.app` is **dashboard-only** — `GET /api/projects/handoff/contacts` → **404**.

## Checklist

| # | Step | Static (C) | Staging (S) | Result |
|---|------|------------|-------------|--------|
| 1 | Build projects + finance | PASS | — | 2026-05-17 local |
| 2 | CRM deal → Create Project | PASS | **BLOCKED** | No projects routes on dashboard Vercel deploy |
| 3 | Create project + CRM prefill | PASS | **BLOCKED** | — |
| 4 | Project detail CRM links | PASS | **BLOCKED** | — |
| 5 | Milestones → draft → Open Finance | PASS | **BLOCKED** | — |
| 6 | Finance `source=projects` banner | PASS | **BLOCKED** | — |
| 7 | Projects list billing column | PASS | **BLOCKED** | — |

## Verdict

**NOT GREEN (staging)** — static wiring complete; **runtime evidence blocked** until operator deploys PR branch with projects/finance apps (or unified preview) and runs checklist with auth token.

## Operator command (when hosts ready)

```bash
# Set credentials (do not commit)
export CANONICAL_STAGING_BASE_URL=https://<dashboard-or-crm-host>
export CANONICAL_STAGING_LOGIN_EMAIL=...
export CANONICAL_STAGING_LOGIN_PASSWORD=...
node scripts/get-canonical-staging-token.mjs
# Then manual UI golden path or extend runtime script
```
