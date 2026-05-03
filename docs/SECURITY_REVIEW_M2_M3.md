# PayAid V3 — Security Review: M2 & M3 New Data Flows

> **Reviewer:** AI-native engineering pass  
> **Date:** Apr 8 2026  
> **Scope:** All new API routes and data flows introduced in M2 (Marketplace, Calls, CPQ/Quotes, SDR) and M3.1/M3.2 (Revenue Cohorts, AI Decisions). M0/M1 flows were reviewed in prior sessions.

---

## 1. Authentication & Authorization

### Pattern (all M2/M3 routes)

Every API route begins with:
```typescript
const { tenantId, userId } = await requireModuleAccess(request, 'crm')
```

`requireModuleAccess` validates the JWT Bearer token, extracts `tenantId`, and throws a `LicenseError` if the tenant does not have module access. This means:
- **Unauthenticated requests** return 401/403 before any Prisma query executes.
- **Cross-tenant data access** is structurally impossible — `tenantId` is sourced from the JWT, not user input.

**Status: PASS**  
No routes accept a caller-supplied `tenantId` in the URL or body without JWT validation.

---

## 2. Tenant Feature Flags

All 14 M2 `/api/v1/` routes call `assertTenantFeatureEnabled(tenantId, flagName)` before processing. Default state is **enabled** for backward compatibility. Disabled tenants receive `{ error, code: 'FEATURE_DISABLED' }` with HTTP 403.

| Module | Flag | Routes |
|--------|------|--------|
| Voice/Calls | `m2_voice` | 5 routes |
| SDR | `m2_sdr` | 5 routes |
| CPQ | `m2_cpq` | 4 routes |
| Marketplace | `m2_marketplace` | 3 routes |
| Revenue Intelligence | `m1_revenue_intelligence` | cohorts + funnel + velocity |

**Status: PASS**  
M3.1 (cohorts) gated on `m1_revenue_intelligence`. M3.2 (AI decisions) uses module-access check only (no additional flag required as decisions are derived from existing AuditLog entries).

**Recommendation:** Add an `m3_governance` feature flag to the AI decisions routes to allow staged rollout.

---

## 3. Webhook Security (M1 Connector)

`POST /api/v1/conversations/webhook` implements multi-layer security:

1. **HMAC-SHA256 signature** (`x-webhook-signature` header): computed from `secret + timestamp + rawBody`, verified via `timingSafeEqual` to prevent timing attacks.
2. **Replay window** (default 5 minutes): timestamps outside the window are rejected with 401 and `code: 'STALE_TIMESTAMP'`.
3. **Idempotency** (`x-idempotency-key` or `x-delivery-id`): duplicate deliveries within a tenant are deduplicated using AuditLog lookups.
4. **Secret sourced at request time** (`process.env.PAYAID_WEBHOOK_SECRET`): tests can override via env without module-load-time caching.

**Gaps:**
- If `PAYAID_WEBHOOK_SECRET` is empty string (not set), signature verification is **skipped**. This is intentional for local dev but should be documented and enforced in production via environment validation.
- No rate limiting on webhook endpoint. Recommend adding an IP-based or per-tenant rate limit (e.g. 1000 req/min) in the API gateway layer.

**Status: PASS with notes above**

---

## 4. Input Validation

All POST/PUT routes use **Zod schema validation** and return 400 with `{ error: 'Validation error', details: e.errors }` on failure. Key schemas:

| Route | Schema |
|-------|--------|
| `calls/start` | `startCallBodySchema` — phone, direction, optional IDs |
| `calls/log` | `callLogBodySchema` — duration, status, direction |
| `calls/[id]/transcript` | `callTranscriptBodySchema` — segments with redaction flags |
| `quotes` POST | `createQuoteBodySchema` — line items with tax/discount |
| `sdr/playbooks` POST | `sdrPlaybookBodySchema` — steps array, guardrails |
| `ai/decisions/[id]/override` | `overrideBodySchema` — outcome enum, reason 1–1000 chars |
| `conversations/webhook` | `conversationIngestSchema` — strict event shape |

**Potential issues:**
- `quotes/route.ts`: `line_items` array is validated for `min(1)` but there's no `max()` cap. A malicious payload with 10,000 line items would cause excessive computation. **Recommend adding `max(50)` to the line_items array schema.**
- `calls/[id]/transcript`: `segments` array has no `max()` cap. **Recommend `max(500)` segments.**

**Status: PASS with above recommendations**

---

## 5. SQL Injection / Prisma Safety

All database access goes through **Prisma ORM** with parameterized queries. No raw SQL is used anywhere in M2/M3 routes. Dynamic `where` clauses use Prisma's typed object syntax:

```typescript
where: {
  tenantId,          // always JWT-sourced
  stage: { in: CLOSED_STAGES },  // fixed enum values
}
```

**Status: PASS** — no SQL injection vectors.

---

## 6. Sensitive Data Exposure

### PII in Audit Logs
`AuditLog.afterSnapshot` stores snapshots that may include phone numbers, contact emails, and deal values. These are stored in the tenant's own database partition and are accessible only via authenticated tenant-scoped routes.

**Recommendation:** Redact PII (phone numbers, emails) from `afterSnapshot` fields before writing, or apply field-level encryption for GDPR-sensitive tenants.

### Call Transcripts
`calls/[id]/transcript` stores `segments` including speaker text. The `redacted` flag per segment indicates PII-redacted content, but the redaction itself is done by the caller (AI provider). PayAid does not perform redaction — it trusts the provider's output.

**Recommendation:** Add a server-side PII filter (regex-based) for phone/email patterns in transcript segments as a defence-in-depth measure.

---

## 7. Permissions & RBAC

| Route | Permission Check |
|-------|-----------------|
| `sdr/playbooks` POST | `assertAnyPermission(['crm:sdr:write', 'crm:admin'])` |
| `revenue/funnel` GET | `assertAnyPermission(['crm:audit:read', 'crm:admin'])` |
| All other M2 routes | Module-access JWT only (no fine-grained RBAC) |

**Gap:** The CPQ, Marketplace, and Calls routes lack fine-grained RBAC (`crm:quotes:write`, `crm:calls:start`, etc.). Any authenticated CRM user can create quotes or start calls.

**Recommendation:** Add `assertAnyPermission` to `quotes` POST, `calls/start`, and `marketplace/apps` POST before M3 GA. Add to M3 roadmap.

---

## 8. Output Safety

- All responses use `NextResponse.json()` — no raw string responses that could enable XSS.
- Error messages are sanitized: Prisma errors are caught and replaced with generic messages before returning to the client. Internal error details are logged server-side only.
- No user-controlled values are reflected in 4xx error bodies beyond validated IDs.

**Status: PASS**

---

## 9. Product Analytics Events

`lib/analytics/track.ts` stores events in AuditLog with `entityType: 'analytics_event'`. Events are fire-and-forget (errors swallowed). This means:

- No analytics event can fail a primary request.
- The AuditLog row contains `changeSummary: eventName` and `afterSnapshot: { event, properties }`.
- `properties` may contain business metrics but **not** raw PII (by convention — not enforced).

**Recommendation:** Add a schema/type for `properties` to prevent accidental PII leakage into analytics events.

---

## 10. Summary of Action Items

| Priority | Item | Owner |
|----------|------|-------|
| HIGH | Add `m3_governance` feature flag to AI decisions routes | Eng |
| HIGH | Enforce `PAYAID_WEBHOOK_SECRET` non-empty in production startup check | DevOps |
| HIGH | Add fine-grained RBAC to `quotes` POST, `calls/start`, `marketplace` POST | Eng |
| MEDIUM | Cap `line_items` to `max(50)` in quotes schema | Eng |
| MEDIUM | Cap `segments` to `max(500)` in transcript schema | Eng |
| MEDIUM | Add IP/tenant rate limiting to webhook endpoint | DevOps |
| LOW | Redact PII from AuditLog snapshots for GDPR tenants | Eng |
| LOW | Add server-side PII filter on transcript segments | Eng |
| LOW | Enforce PII-free `properties` in analytics events | Eng |

---

## 11. Routes Reviewed

M2: `calls/start`, `calls/log`, `calls/[id]/end`, `calls/[id]/transcript`, `calls/route (list)`, `quotes (GET+POST)`, `quotes/[id]/approve`, `quotes/[id]/convert-invoice`, `marketplace/apps (GET+POST)`, `marketplace/apps/[id]/configure`, `sdr/playbooks (GET+POST)`, `sdr/runs/[id]/start|pause|stop`, `sdr/runs (list)`, `conversations/webhook`.

M3: `revenue/cohorts`, `ai/decisions (GET)`, `ai/decisions/[id] (GET)`, `ai/decisions/[id]/override (POST)`, `ai/decisions/stats (GET)`.

Utility: `lib/analytics/track.ts`, `lib/ai-native/m1-connector-signature.ts`.
