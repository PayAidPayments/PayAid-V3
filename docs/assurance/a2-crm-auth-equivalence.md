# A2 — CRM canonical app auth equivalence map

**Date:** 2026-05-18 · **Branch:** `feat/projects-maturation-batch` (local scan)  
**Staging host probed:** `https://payaid-v3.vercel.app` (dashboard deploy)

## Summary

| Category | Count | Runtime probe (no Bearer token) |
|----------|-------|----------------------------------|
| `requireModuleAccess` present | 77 / 85 | — |
| Exceptions (this map) | **8** | See below |

> **Note:** Earlier scan (2026-05-17) reported 24 gaps using a naive string grep on nested `[id]` routes that **do** import `requireModuleAccess`. This map uses full-file classification on current tree.

## Exception register

| Route | Pattern | Equivalence | Code risk | Staging probe |
|-------|---------|-------------|-----------|---------------|
| `apps/crm/app/api/health/route.ts` | Public health | Intentional | Low | `GET /api/health` → **200** |
| `apps/crm/app/api/crm/contacts/route.ts` | Re-export → `@/modules/shared/crm/api/contacts` | **FAIL** — shared handler has no `requireModuleAccess`; orgId query only | **High** | Not probed on canonical CRM host |
| `apps/crm/app/api/crm/deals/route.ts` | Session proxy → dashboard `/api/deals` | Proxy sends Bearer from session | Medium | `GET /api/crm/deals` → **401** without cookie/token |
| `apps/crm/app/api/crm/tasks/route.ts` | Session proxy | Same as deals | Medium | Not probed |
| `apps/crm/app/api/crm/segments/route.ts` | Domain CRM; orgId param only | **FAIL** — no module JWT gate in file | **High** | `GET /api/crm/segments?organizationId=…` → **401** on dashboard staging* |
| `apps/crm/app/api/crm/communications/route.ts` | Prisma direct; orgId only | **FAIL** — no module JWT gate in file | **High** | `GET /api/crm/communications?…` → **401** on dashboard staging* |
| `apps/crm/app/api/crm/pipelines/route.ts` | orgId only | **FAIL** | **High** | Not probed |
| `apps/crm/app/api/crm/analytics/summary/route.ts` | orgId only | **FAIL** | **High** | Not probed |

\*Dashboard staging returned 401 — may be edge/session middleware on deployed build; **do not treat as proof** until verified on canonical CRM host (`apps/crm`).

## CRM audit logging (static)

| Signal | Finding |
|--------|---------|
| `logCrmAudit` in `apps/crm/app/api` | **2 route files** (`contacts/bulk-delete`, `contacts/[id]`) |
| Suite expectation | Deal stage change, mass ops, exports — **not mapped** |

## Release gate

| Command | Result | Artifact |
|---------|--------|----------|
| `npm run release:gate:crm-audit` | **FAIL** (timeout, no local server) | `docs/evidence/release-gates/2026-05-18T02-28-57-377Z-crm-audit-gate.json` |

**Pass criteria:** Run with `PLAYWRIGHT_BASE_URL` pointed at staging CRM + valid session, or start local dashboard/CRM on :3000/:3001.

## Fixes applied (2026-05-18)

| Route | Fix |
|-------|-----|
| segments, communications, pipelines, analytics/summary | `requireCrmTenant` |
| contacts (shared module) | `requireCrmTenant` + `tenantId` scoping |
| deals, tasks | **session-proxy** — `getSessionToken` → 401 without session (acceptable) |
| health | public |

Audit: `logCrmAudit` on POST segment, pipeline, communication, contact create.

## A2 verdict

**PARTIAL** — high-risk orgId-only routes **fixed in code**; E2E gate still pending; deploy + `release:gate:crm-audit` required.
