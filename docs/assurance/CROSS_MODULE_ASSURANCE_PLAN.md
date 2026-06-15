# PayAid V3 — Cross-Module Platform Assurance Plan

**Status:** Planning (assessment only — no migrations, no broad cleanup)  
**Last updated:** 2026-05-17  
**Scope:** Suite-wide security/control + product readiness + delivery waves  
**Out of scope:** New app extraction, `apps/analytics`, AI hub expansion, architecture cleanup waves

---

## 1. Purpose

Move from **architecture stabilization** (Wave 1–2 canonical hosts) to **platform assurance**: prove each module is safe, complete enough for target customers, and deployable with evidence.

This plan defines **what to audit**, **in what order**, **how** (static vs runtime), **what evidence exists today**, and **go/no-go gates** before production.

---

## 2. Module inventory (audit units)

| Unit | Canonical app | Port (dev) | Wave | Assurance tier |
|------|---------------|------------|------|------------------|
| **Platform / Auth / Launcher** | `apps/dashboard`, `apps/platform`, `apps/suite` | 3000 | 1 | P0 — foundation |
| **CRM** | `apps/crm` | 3001 | 1 | P0 — revenue + identity graph |
| **Finance & GST** | `apps/finance` + `finance-module` | 3011 | 1 | P0 — money movement |
| **Marketing** | `apps/marketing` | 3005 | 1 | P1 |
| **HR & Payroll** | `apps/hr` | 3002 | 2 | P1 |
| **Projects & Service** | `apps/projects` | 3007 | 2 | P1 (recent maturation — re-verify) |
| **Leads / LI** | `apps/leads` + `packages/leads-core` | 3010 | 2 | P1 |
| **Sales Pages** | `apps/sales` | 3008 | 2 | P2 |
| **Website Builder** | `apps/website-builder` | 3009 | 2 | P2 |
| **Social** | `apps/social` + marketing Studio | 3006 | 2 | P2 |
| **Voice / Bolna** | `apps/voice` | 3003 | 1 (partial) | P1 |
| **Settings / Tenant admin** | `apps/settings` | — | 1 | P0 |
| **Billing (platform)** | APIs on dashboard + `@payaid/domain-billing` | — | 1 | P0 |
| **Analytics** | Dashboard SUB only | — | — | **Excluded** until decision gate |
| **AI hub submodules** | Dashboard | — | — | **Deferred** per Wave 2 closeout |

**Cross-cutting libraries (audit once, apply everywhere):**

- `lib/middleware/license.ts`, `lib/middleware/auth.ts`, `lib/middleware/tenant.ts`
- `lib/auth/jwt.ts`, `lib/utils/canonical-module-url.ts`
- `packages/db/prisma/schema.prisma` (tenant isolation, audit models)
- Shared scripts: `scripts/check-canonical-module-api-*.mjs`, `scripts/run-canonical-staging-runtime-checks.mjs`

---

## 3. Module priority order (audit waves)

Rationale: **blast radius** (money, PII, outbound) × **customer-facing completeness** × **cross-module handoffs** × **evidence gap**.

| Wave | Modules | Duration (indicative) | Why first |
|------|---------|----------------------|-----------|
| **A0 — Platform spine** (3–5 days) | Auth, Settings, Tenant limits, Module launcher, shared middleware | 3–5 d | Every module depends on JWT, license, tenant scope |
| **A1 — Money & compliance** (5–8 days) | Finance, Billing webhooks, GST flows | 5–8 d | Invoices, tax, payments; draft-first required per AGENTS.md |
| **A2 — CRM & graph** (5–7 days) | CRM, inbound orchestration, CRM→Projects handoff | 5–7 d | SoR for contacts/deals; outbound + audit patterns |
| **A3 — People** (4–6 days) | HR, payroll audit | 4–6 d | Sensitive HR data; `lib/hr/audit-log.ts` |
| **A4 — Delivery & growth** (6–8 days) | Projects (re-verify post-maturation), Leads/LI | 6–8 d | Recent Projects batch; LI Prisma/telemetry surface |
| **A5 — Acquisition surfaces** (5–7 days) | Marketing, Sales, Website Builder, Social | 5–7 d | Public-ish surfaces; partial API split (Social POST on dashboard) |
| **A6 — Voice & integrations** (3–5 days) | Voice/Bolna, webhooks, outbox | 3–5 d | Tool bridge + draft-first; `lib/voice-agent/runtime/bolna-tool-bridge.ts` |
| **A7 — Residual / SUB** (2–3 days) | Dashboard catch-alls, duplicate routes, Analytics SUB read-only | 2–3 d | Document risk; no new analytics app |

**Total rough timeline:** **6–8 weeks** calendar (1 engineer + spot reviews), or **3–4 weeks** with 2 engineers parallelizing A1/A2 after A0.

**Projects note:** Schedule **A4 re-verification** immediately after A1/A2 (Finance + CRM handoffs) — PR #10 maturation batch needs staging proof, not re-architecture.

---

## 4. Security & control checklist (per module)

Use one copy per module; mark **S** static, **R** runtime/staging, **E** evidence on file.

### 4.1 Input & incoming data

| ID | Control | S | R | Pass criteria |
|----|---------|---|---|---------------|
| SC-01 | Request body/query validation (Zod or equivalent) on all mutating API routes | ✓ | ✓ | No raw `req.json()` without schema on POST/PATCH/DELETE |
| SC-02 | File/upload validation (type, size, virus scan policy if applicable) | ✓ | ✓ | Imports (Excel, attachments) use safe parsers |
| SC-03 | Idempotency for webhooks and payment callbacks | ✓ | ✓ | Duplicate delivery does not double-charge or double-post |
| SC-04 | SSRF / open redirect on URL fields (webhooks, redirects, LP links) | ✓ | ✓ | Allowlist or internal-only fetch patterns |

### 4.2 Authorization & permissions

| ID | Control | S | R | Pass criteria |
|----|---------|---|---|---------------|
| SC-10 | `requireModuleAccess(request, '<module>')` on module APIs | ✓ | ✓ | Grep audit: no unauthenticated business mutations |
| SC-11 | Tenant scoping on every Prisma query (`tenantId` from token, not body) | ✓ | ✓ | Spot-check 10 routes; attempt cross-tenant ID → 403/404 |
| SC-12 | Role-based actions (approve, publish, delete, export) | ✓ | ✓ | Deny test with viewer role |
| SC-13 | License / tier gates align with product entitlements | ✓ | ✓ | Free vs paid module list matches marketing |
| SC-14 | Cross-module handoff URLs cannot bypass auth (prefill APIs) | ✓ | ✓ | `invoice-prefill`, CRM handoff require module access |

### 4.3 Error & exception handling

| ID | Control | S | R | Pass criteria |
|----|---------|---|---|---------------|
| SC-20 | `handleLicenseError` / consistent 401/403 vs 500 | ✓ | ✓ | No stack traces to client in production |
| SC-21 | No silent swallow on money/HR/CRM mutations | ✓ | ✓ | catch blocks log + return safe error |
| SC-22 | Transaction boundaries for multi-step writes | ✓ | ✓ | Handoff + invoice create atomic where required |

### 4.4 Audit logging & observability

| ID | Control | S | R | Pass criteria |
|----|---------|---|---|---------------|
| SC-30 | Sensitive mutations write `auditLog` (or module-specific audit table) | ✓ | ✓ | Create/update/delete invoice, deal stage, payroll, handoff |
| SC-31 | **Timestamps** UTC consistent; `createdAt` / `updatedAt` on entities | ✓ | — | Schema + API responses |
| SC-32 | **Event types** canonical verbs (no free-text-only actions) | ✓ | ✓ | e.g. `lib/lead-intelligence/audit-event-names.ts` pattern |
| SC-33 | Actor identity on audit rows (`userId`, `tenantId`, correlation id) | ✓ | ✓ | Staging spot-check DB rows |
| SC-34 | Outbox / dispatcher audit for async jobs | ✓ | R | `lib/outbox/dispatcher.ts` |

### 4.5 Workflow, approval & sensitive actions

| ID | Control | S | R | Pass criteria |
|----|---------|---|---|---------------|
| SC-40 | Draft-first for finance outbound (invoice send, GST filing hooks) | ✓ | ✓ | No one-click irreversible send without confirm |
| SC-41 | Approval gates (milestones, time, HR payroll) | ✓ | ✓ | Approve action requires permission + audit |
| SC-42 | Workflow routing cannot skip approval via direct API | ✓ | ✓ | PATCH state machine enforced server-side |
| SC-43 | AI/Voice tool actions use draft-first (`bolna-tool-bridge`) | ✓ | ✓ | Sensitive tools blocked or draft-only |
| SC-44 | Security review of workflow **decision** nodes (auto-approve rules) | ✓ | ✓ | Document rules; no privilege escalation |

### 4.6 Environment & configuration

| ID | Control | S | R | Pass criteria |
|----|---------|---|---|---------------|
| SC-50 | Required env validated at boot (DATABASE_URL, JWT secret, app URLs) | ✓ | R | Fail fast in staging deploy |
| SC-51 | Secrets not in client bundles (`NEXT_PUBLIC_*` audit) | ✓ | — | Only public URLs/keys |
| SC-52 | Strict env flags use `scripts/strict-flag.mjs` (`"1"` = on) | ✓ | — | Automation gates documented |
| SC-53 | Staging ≠ production DB URLs in CI/deploy config | — | ✓ | A10 proof separate per env |

### 4.7 Sensitive action tracking (suite-level)

Track in assurance register: **who did what, when, on which tenant**, for:

- Invoice create/send/void/GST  
- Deal won/lost, bulk export  
- HR payroll run, contract change  
- Lead activation, discovery job  
- Project milestone billing handoff  
- Social post publish, WB site publish  
- Voice call initiate, tool execution  
- Settings: user role, API key, billing plan  

---

## 5. Product readiness checklist (per module)

| ID | Dimension | Questions | Evidence type |
|----|-----------|-----------|---------------|
| PR-01 | **Feature completeness** | Core journeys implemented vs module PRD? | Route map + demo script |
| PR-02 | **Market-fit gaps** | Missing integrations (GST portal, WhatsApp, etc.) documented? | Gap list in module audit |
| PR-03 | **Admin / settings** | Tenant-configurable options exposed in Settings? | Settings screen inventory |
| PR-04 | **Workflow steps** | Happy path + edge cases (reject, recall, amend)? | Flow diagram + staging script |
| PR-05 | **Reporting / visibility** | Lists, filters, exports, dashboards for operator? | Screenshot + API list |
| PR-06 | **Enterprise readiness** | SSO, audit export, RBAC granularity, data retention? | Explicit defer or built |
| PR-07 | **Cross-module links** | Canonical URLs work with `NEXT_PUBLIC_*_APP_URL`? | Staging handoff checklist |
| PR-08 | **404 / nav** | No-404 on licensed nav items | `check:canonical-ui-surface-smoke` |
| PR-09 | **Performance** | Route bundle within budget | `config/performance/route-bundle-budgets.json` |
| PR-10 | **Offline / error UX** | Loading, empty, permission denied states | UI audit sample |

---

## 6. Static vs runtime validation matrix

| Activity | Static (repo/CI) | Runtime (staging) |
|----------|------------------|-------------------|
| API has `requireModuleAccess` | Grep / custom script per `apps/<m>/app/api` | Token without module → 403 |
| Zod on mutating routes | Read route handlers | Fuzz invalid body → 400 |
| Tenant isolation | Code review + Prisma where clauses | Two-tenant integration test |
| Build green | `npm run build -w <app>` | Deploy artifact smoke |
| Type safety | `typecheck:dashboard`, per-app tsc | — |
| Canonical API contract | `npm run check:canonical-module-api-contract` | — |
| Readiness verdict | `check:canonical-module-api-readiness-verdict` | — |
| UI routes exist | `check:canonical-ui-surface-smoke` | Manual click-through |
| Cross-app handoff | Link builder unit test | CRM→Projects→Finance script |
| Audit rows persisted | Schema + create() calls present | DB query after action |
| Webhook idempotency | Code review | Replay same payload |
| GST / invoice math | Unit tests if present | Staging invoice scenarios |
| Performance | `summarize-*-route-chunks.mjs` | Lighthouse optional |
| Env validation | `.env.example` vs deploy config | Staging boot + health |

---

## 7. Evidence gap register (today)

| Evidence | Status | Gap |
|----------|--------|-----|
| Prisma canonical schema + local A10 | **On file** (`docs/IMPLEMENTATION_STATUS.md` §10) | Staging/production migrate proof **missing** unless operator URL |
| Dashboard `typecheck` green | **On file** (`docs/evidence/typecheck-dashboard-latest.txt`) | Per-app `apps/*` tsc not uniformly gated |
| Wave 1–2 build green | **Documented** | Not all apps in single CI matrix artifact |
| Canonical API contract checks | **Scripts exist** | Last verdict timestamp varies by module |
| Staging runtime checks | **Script exists** (`check:canonical-staging-runtime`) | Requires token/URL; not suite-wide |
| Projects maturation PR #10 | **Pushed** | **Staging smoke not recorded** |
| Security grep (auth on APIs) | **Missing** | Need Wave A0 script or manual register |
| Per-module audit log coverage map | **Partial** (CRM, HR, LI, voice, outbox) | Finance, Projects, Sales, WB, Social **unmapped** |
| RBAC matrix (role × action) | **Missing** | Derive from permissions + UI |
| Enterprise checklist | **Missing** | PR-06 blank suite-wide |
| E2E Playwright/Cypress suite | **Sparse / module-specific** | No cross-module golden path |
| Production deploy sign-off | **Historical** (`df81f25cb`) | Post–Wave 2 + Projects batch **needs new gate** |

---

## 8. Checklist template (copy per module)

```markdown
# Module assurance: <MODULE_NAME>
**App:** apps/<name>  **Auditor:** ___  **Date:** ___  **Wave:** A_

## Security & control
| ID | Item | S | R | Pass | Notes |
|----|------|---|---|------|-------|
| SC-01 | Input validation on mutations | | | ☐ | |
| SC-10 | requireModuleAccess | | | ☐ | |
| SC-11 | Tenant scoping | | | ☐ | |
| SC-30 | Audit log on sensitive actions | | | ☐ | |
| SC-40 | Draft-first / approval | | | ☐ | |
| SC-50 | Env validation | | | ☐ | |

## Product readiness
| ID | Item | Pass | Notes |
|----|------|------|-------|
| PR-01 | Core journeys | ☐ | |
| PR-03 | Admin/settings | ☐ | |
| PR-05 | Reporting | ☐ | |
| PR-07 | Cross-module URLs | ☐ | |
| PR-09 | Bundle budget | ☐ | |

## Evidence attached
- [ ] Build log: `npm run build -w <app>`
- [ ] Static scan notes (grep/link)
- [ ] Staging script results
- [ ] Open risks (P0/P1/P2)

## Verdict
- [ ] **Go** for staging promotion of this module
- [ ] **Go with conditions** (list)
- [ ] **No-go** (list blockers)
```

---

## 9. Go / no-go gates (production)

### Gate G0 — Platform (required)

- [ ] A0 audit complete; auth/license/tenant middleware signed off  
- [ ] No P0 open issues (cross-tenant leak, unauthenticated mutation, secret exposure)  
- [ ] Staging env vars documented and validated  

### Gate G1 — Revenue path (required for GA)

- [ ] A1 Finance + A2 CRM audits **Go** or **Go with conditions** (no P0)  
- [ ] Staging: create contact → deal → (optional project) → draft invoice → no send without confirm  
- [ ] Audit rows verified for invoice + deal stage change  

### Gate G2 — Wave 2 modules (required if licensed together)

- [ ] Each licensed module has completed checklist (A3–A5)  
- [ ] `check:canonical-module-api-readiness-verdict` pass for in-scope modules  
- [ ] Cross-module handoffs tested on staging canonical hosts  

### Gate G3 — Operations (required)

- [ ] Staging DB migrate status/deploy proof (extend A10)  
- [ ] Rollback plan per app deploy  
- [ ] Monitoring: error rate, webhook DLQ, audit gap alerts  

### Gate G4 — Explicit exclusions (documented)

- [ ] Analytics: SUB only — no production promise beyond read surfaces  
- [ ] AI hub: deferred features listed in release notes  
- [ ] Known residuals from Wave 2 closeout (Social POST on dashboard, etc.) accepted or scheduled  

**Production NO-GO if any:**

- P0 security finding open  
- Cross-tenant data access reproduced  
- Money movement without audit trail  
- Unauthenticated mutating API on staging  
- Missing staging proof for a **licensed** module in the SKU being sold  

---

## 10. Recommended first actions (week 1)

1. **Run A0** — inventory all `apps/*/app/api/**/route.ts`; spreadsheet of `requireModuleAccess` presence.  
2. **Execute staging script** for Projects maturation (`feat/projects-maturation-batch` / PR #10).  
3. **Finance + CRM audit** (A1, A2) — highest risk, most handoffs.  
4. **Fill evidence gap register** — one row per module in `docs/assurance/evidence-register.md` (create when audits start).  
5. **Do not** start new migrations, Analytics app, or AI hub expansion until G1 pass.

---

## 11. References

- `AGENTS.md` — draft-first, approval, audit expectations  
- `docs/IMPLEMENTATION_STATUS.md` — Wave 1–2 status  
- `docs/architecture/platform-separation-roadmap.md` — maturity table  
- `package.json` — `check:canonical-*` scripts  
- `config/performance/route-bundle-budgets.json` — perf gates  
