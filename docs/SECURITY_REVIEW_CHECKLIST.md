# PayAid V3 – Security Review Checklist

**Scope:** M0 / M1 / M2 new data flows and API surfaces introduced during the M0–M2 build.  
**Status:** Work in progress — populated during internal review; sign-off required before GA.

---

## How to Use

1. Assign a reviewer to each section.
2. Mark items `[x]` when verified, `[!]` when a finding requires remediation.
3. File a GitHub issue for each `[!]` finding; link it in the "Finding" column.
4. Sign off at the bottom when all items are `[x]` or resolved.

---

## 1. Authentication & Authorisation

| # | Check | Status | Finding |
|---|-------|--------|---------|
| 1.1 | Every `/api/v1/*` route calls `requireModuleAccess` before any DB access | `[ ]` | |
| 1.2 | Feature-flag gates (`assertTenantFeatureEnabled`) fire before business logic | `[ ]` | |
| 1.3 | Permission checks (`assertAnyPermission`) use least-privilege scopes (e.g. `crm:sequence:write`, not `crm:admin` alone) | `[ ]` | |
| 1.4 | JWT token validation is performed centrally in `requireModuleAccess`; no route bypasses it | `[ ]` | |
| 1.5 | Service-to-service calls (outbox dispatcher) use a shared secret or internal-only header, not user JWTs | `[ ]` | |
| 1.6 | `tenant_id` is always derived from the verified JWT — never from a query/body parameter | `[ ]` | |

---

## 2. Input Validation & Injection

| # | Check | Status | Finding |
|---|-------|--------|---------|
| 2.1 | All write-API request bodies are validated with Zod before use | `[ ]` | |
| 2.2 | Pagination `limit` params are capped (e.g. `max(50)` on `line_items`, `max(500)` on transcript `segments`) | `[ ]` | |
| 2.3 | String fields with `.max(N)` are size-bounded in Zod schemas | `[ ]` | |
| 2.4 | No raw SQL string interpolation; all DB queries use Prisma parameterised APIs | `[ ]` | |
| 2.5 | JSON `afterSnapshot` / `beforeSnapshot` fields are never echoed back to clients verbatim without filtering | `[ ]` | |
| 2.6 | `window_days` scorecard param is capped at 90 to prevent long-running table scans | `[ ]` | |
| 2.7 | Enum fields (`replyStatus`, `direction`, `status`) are validated against an allowlist before DB write | `[ ]` | |

---

## 3. Data Isolation (Multi-tenancy)

| # | Check | Status | Finding |
|---|-------|--------|---------|
| 3.1 | Every Prisma query includes `tenantId` in the `where` clause | `[ ]` | |
| 3.2 | Cross-tenant read is impossible: resource ownership is always verified against the JWT `tenantId` before returning data | `[ ]` | |
| 3.3 | AuditLog entries always carry the originating `tenantId`; no global-scope audit writes | `[ ]` | |
| 3.4 | Feature-flag table (`FeatureToggle`) rows are keyed by `tenantId`; no shared global flags that affect all tenants | `[ ]` | |
| 3.5 | Outbox events are scoped per tenant; the dispatcher does not mix cross-tenant event processing | `[ ]` | |

---

## 4. Sensitive Data Handling

| # | Check | Status | Finding |
|---|-------|--------|---------|
| 4.1 | Call transcripts: `isRedacted` flag is respected; redacted segments are not returned to clients | `[ ]` | |
| 4.2 | PII fields (phone numbers, email addresses) in AuditLog `afterSnapshot` are masked or excluded | `[ ]` | |
| 4.3 | Analytics events (`entityType: 'analytics_event'`) do not store raw PII in the `properties` payload | `[ ]` | |
| 4.4 | Recording consent (`recording_consent`) is checked before call recording is stored | `[ ]` | |
| 4.5 | No secret/token values are written to AuditLog or analytics events | `[ ]` | |
| 4.6 | API responses do not include internal DB IDs beyond what is necessary (prefer `cuid`-formatted public IDs) | `[ ]` | |

---

## 5. Rate Limiting & Denial of Service

| # | Check | Status | Finding |
|---|-------|--------|---------|
| 5.1 | High-volume M1 ingest routes (`POST /api/v1/conversations/ingest`) are protected by a rate limiter or API gateway | `[ ]` | |
| 5.2 | Analytics event ingestion (`POST /api/v1/analytics/event`) does not allow unbounded writes per tenant/minute | `[ ]` | |
| 5.3 | Large payload fields (e.g. call transcript `content` string) have byte-size limits in Zod | `[ ]` | |
| 5.4 | Outbox DLQ does not grow unboundedly; alerts fire when `dlq_count > OUTBOX_DLQ_CRITICAL_THRESHOLD` | `[ ]` | |
| 5.5 | KPI scorecard expensive aggregation queries are cached (15 s TTL); concurrent requests do not fan-out to DB | `[ ]` | |

---

## 6. Idempotency & Replay Safety

| # | Check | Status | Finding |
|---|-------|--------|---------|
| 6.1 | `x-idempotency-key` is validated and stored atomically (no TOCTOU race on duplicate check + insert) | `[ ]` | |
| 6.2 | Outbox replay (`POST /api/v1/outbox/replay`) requires elevated permission (`crm:admin` or `ops:outbox`) | `[ ]` | |
| 6.3 | Replayed outbox events are deduplicated; an event cannot be delivered more than once per `event_id` | `[ ]` | |

---

## 7. M2-Specific: Calls, CPQ, Marketplace, SDR

| # | Check | Status | Finding |
|---|-------|--------|---------|
| 7.1 | Marketplace app install/configure operations are restricted to tenant admins (`m2_marketplace` flag + permission) | `[ ]` | |
| 7.2 | Call recordings/transcripts cannot be accessed cross-tenant by guessing a call `id` | `[ ]` | |
| 7.3 | Quote approval/rejection is restricted to authorised approvers; no self-approval path | `[ ]` | |
| 7.4 | SDR playbook `maxConcurrent` and `guardrails.maxEmailsPerDay` caps are enforced server-side, not just in the UI | `[ ]` | |
| 7.5 | `sequence_enrollment_conversion` reply status can only be updated by the owning tenant's authorised user | `[ ]` | |
| 7.6 | AI decisions list (`GET /api/v1/ai/decisions`) is gated behind `m3_governance` feature flag | `[ ]` | |

---

## 8. Dependency & Supply Chain

| # | Check | Status | Finding |
|---|-------|--------|---------|
| 8.1 | `npm audit` run against all workspaces; no high/critical CVEs unpatched | `[ ]` | |
| 8.2 | Prisma client version pinned; migration files reviewed for destructive changes | `[ ]` | |
| 8.3 | No `eval`, `new Function`, or `vm.runInNewContext` calls in any API route | `[ ]` | |

---

## 9. Secrets & Environment

| # | Check | Status | Finding |
|---|-------|--------|---------|
| 9.1 | `DATABASE_URL`, `JWT_SECRET`, `PAYAID_AUTH_TOKEN` are loaded from env vars, never hardcoded | `[ ]` | |
| 9.2 | `.env` and `.env.local` are in `.gitignore`; no secrets committed | `[ ]` | |
| 9.3 | `PAYAID_ANALYTICS_PROVIDER` env var is optional; missing it defaults to DB-only storage (no crash) | `[ ]` | |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Security Reviewer | | | |
| Engineering Lead | | | |
| Product Owner | | | |

**Review completed:** `[ ]` No findings requiring remediation before GA  
**Review completed with findings:** `[ ]` All findings tracked in GitHub issues (links below)

### Open findings

_None at time of initial draft. Populate after first review pass._

---

*Template version: 1.0 — Apr 8 2026. Re-run review for each major release.*
