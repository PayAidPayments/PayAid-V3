# PayAid V3 — Assurance Evidence Register

**Last updated:** 2026-05-18

---

## Program rollup

| Wave | Status | Notes |
|------|--------|-------|
| **A0** | **PARTIAL** | Token denial PASS on deals/invoices (staging); canonical script **BLOCKED** (no login env); full spine pending token |
| **A1** | **FIX IN CODE / PENDING DEPLOY** | P0 routes guarded; staging still **200** until redeploy |
| **A2** | **PARTIAL** | High-risk CRM routes fixed in code; audit expanded; E2E gate **FAIL** (timeout) |
| **PR10** | **NOT GREEN (S)** | Static PASS; golden path **BLOCKED** (multi-app deploy) |

**Revenue Desk:** **NO-GO** until security deploy verified + PR10 staging + authenticated finance flows.

---

## A0 — Platform spine (runtime)

| Check | Status | Evidence |
|-------|--------|----------|
| No Bearer → `/api/crm/deals` | **PASS** | 401 — `2026-05-18T03-22-06-686Z-staging-probe.json` |
| No Bearer → `/api/billing/invoices` | **PASS** | 401 |
| `run-canonical-staging-runtime-checks` | **BLOCKED** | Missing `CANONICAL_STAGING_AUTH_TOKEN` |
| Staging login token | **BLOCKED** | `CANONICAL_STAGING_LOGIN_EMAIL/PASSWORD` not in env |
| Finance unauth reads | **FAIL on live host** | Expenses/GST still 200 pre-deploy; fixed in repo |

**Helpers:** `scripts/assurance-staging-probe.mjs`

---

## A1 — Finance

| Check | Status | Evidence |
|-------|--------|----------|
| P0 route guards (code) | **PASS** | `requireFinanceTenant` on expenses, gst-returns, gst/search, gstr3b |
| Protection model | **PASS** | [`finance-api-protection-model.md`](./finance-api-protection-model.md) |
| Staging probe (no auth) | **PENDING DEPLOY** | Still 200 on payaid-v3.vercel.app pre-deploy |
| Invoice/GST with auth | **PENDING** | No staging token |
| Invoice `auditLog` | **PENDING** | Not verified in DB |
| 19 other dashboard finance routes | **PARTIAL** | See [`a1-finance-api-gaps.md`](./a1-finance-api-gaps.md) — portal/webhook excluded |

---

## A2 — CRM

| Check | Status | Evidence |
|-------|--------|----------|
| Auth equivalence | **PASS (code)** | [`a2-crm-auth-equivalence.md`](./a2-crm-auth-equivalence.md) — `requireCrmTenant` on 4 high-risk + contacts |
| Audit logging | **PARTIAL** | POST segment/pipeline/communication/contact create |
| `release:gate:crm-audit` | **FAIL** | Timeout — `docs/evidence/release-gates/2026-05-18T02-28-57-377Z-crm-audit-gate.json` |

---

## PR #10 — Projects maturation

| Step | Static | Staging |
|------|--------|---------|
| Builds / wiring | **PASS** | — |
| Golden path | **PASS** | **BLOCKED** — [`pr10-staging-checklist-results.md`](./pr10-staging-checklist-results.md) |

**Verdict:** **NOT GREEN** (staging).

---

## Go/no-go blockers

| Sev | Blocker | Status |
|-----|---------|--------|
| P0 | Finance APIs return 200 without auth on **deployed** host | **OPEN** until redeploy + probe pass |
| P0 | PR10 staging not run | **OPEN** |
| P0 | No staging auth token for invoice/GST/audit DB | **OPEN** |
| P1 | CRM E2E gate not green | **OPEN** |
| P1 | 12 finance routes still without module guard (non-P0) | **OPEN** |

**After deploy checklist:**

1. `node scripts/assurance-staging-probe.mjs` → `overallPass: true`
2. Set `CANONICAL_STAGING_LOGIN_*` → token → canonical runtime + invoice smoke
3. Deploy projects/crm/finance hosts → PR10 checklist → update this register

---

## Update log

| Date | Entry |
|------|--------|
| 2026-05-18 | P0 finance + CRM auth fixes in code; staging probe script; protection model doc |
| 2026-05-18 | Live staging still shows finance 200 until deploy |
