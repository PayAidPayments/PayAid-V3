# CRM Day 5 Runtime Checks - RBAC and Audit Verification (2026-04-23)

Owner: Phani  
Queue item: #6 Day 5 closure  
Runbooks:
- `docs/CRM_GA_SOLO_T05_ROLE_MATRIX_RUNBOOK.md`
- `docs/CRM_GA_SOLO_T05_AUDIT_VERIFICATION_RUNBOOK.md`

## Environment

- Base URL: mixed (`http://localhost:3000` local attempts, then `https://payaid-v3.vercel.app` hosted validation)
- Tenant: `cmjptk2mw0000aocw31u48n64` (Demo Business Pvt Ltd)
- Build/commit: hosted runtime verification + local route-fix patch (`apps/dashboard/app/api/crm/contacts/mass-transfer/route.ts`)
- Notes: local audit gate is unstable; Day 5 verification moved to hosted direct endpoint checks.

## Execution log (2026-04-23)

1. `npm run test:crm:rbac` -> **PASS** (3/3 tests, exit `0`).
2. `npm run release:gate:crm-audit` -> **FAIL** (timed out; artifact `docs/evidence/release-gates/2026-04-23T09-47-14-301Z-crm-audit-gate.json`).
3. Retry with extended timeout: `$env:CRM_AUDIT_TIMEOUT_MS='900000'; npm run release:gate:crm-audit` -> **FAIL** (timed out; artifact `docs/evidence/release-gates/2026-04-23T09-52-59-193Z-crm-audit-gate.json`).
4. Stabilization patch applied to `tests/e2e/crm-audit/crm-audit.spec.ts` (360 recovery/reload path + bounded suite timeout), then rerun with `$env:CRM_AUDIT_TIMEOUT_MS='1200000'; npm run release:gate:crm-audit` -> **FAIL** (timed out; artifact `docs/evidence/release-gates/2026-04-23T10-26-16-754Z-crm-audit-gate.json`).
5. Hosted role-matrix automation executed with corrected role users (`admin/manager/rep/read_only`) -> **PASS** (`60` pass / `0` fail), artifact `docs/evidence/closure/2026-04-23T13-06-22-219Z-crm-day5-role-matrix-automation.json`.
6. Hosted audit-verification automation executed for A1-A7 -> **PARTIAL** (`6` pass / `1` fail), artifact `docs/evidence/closure/2026-04-23T13-12-01-757Z-crm-day5-audit-verification-automation.json`; failing row `A4` returns `500` FK error on contact mass-transfer.
7. Engineering fix applied for `A4` blocker: `apps/dashboard/app/api/crm/contacts/mass-transfer/route.ts` now resolves `SalesRep.id` from target `User.id` before assigning `Contact.assignedToId` (aligns with lead mass-transfer path). Hosted rerun pending deploy.

Observed blockers from artifacts:

- Local CRM audit suite fails at `360 Customer View` before reaching Day 5 checks.
- Hosted Day 5 role matrix is now evidence-backed green.
- Remaining blocker is narrowed to hosted `A4` contact mass-transfer audit path (`500` FK); fix is coded locally and awaiting deploy + rerun.

## Role matrix execution (R1-R15)

| ID | Admin | Manager | Rep | Read-only | Signal | Notes |
|---|---|---|---|---|---|---|
| R1 | Pass | Pass | Pass | Pass | Hosted automation | `docs/evidence/closure/2026-04-23T13-06-22-219Z-crm-day5-role-matrix-automation.json` |
| R2 | Pass | Pass | Pass | Pass | Hosted automation | same artifact as above |
| R3 | Pass | Pass | Pass | Pass | Hosted automation | same artifact as above |
| R4 | Pass | Pass | Pass | Pass | Hosted automation | same artifact as above |
| R5 | Pass | Pass | Pass | Pass | Hosted automation | same artifact as above |
| R6 | Pass | Pass | Pass | Pass | Hosted automation | same artifact as above |
| R7 | Pass | Pass | Pass | Pass | Hosted automation | same artifact as above |
| R8 | Pass | Pass | Pass | Pass | Hosted automation | same artifact as above |
| R9 | Pass | Pass | Pass | Pass | Hosted automation | same artifact as above |
| R10 | Pass | Pass | Pass | Pass | Hosted automation | same artifact as above |
| R11 | Pass | Pass | Pass | Pass | Hosted automation | same artifact as above |
| R12 | Pass | Pass | Pass | Pass | Hosted automation | same artifact as above |
| R13 | Pass | Pass | Pass | Pass | Hosted automation | same artifact as above |
| R14 | Pass | Pass | Pass | Pass | Hosted automation | same artifact as above |
| R15 | Pass | Pass | Pass | Pass | Hosted automation | same artifact as above |

## Audit verification execution (A1-A7)

| ID | Mutation result | Audit present | Event/action key | Actor + tenant verified | Notes |
|---|---|---|---|---|---|
| A1 | Pass (`200`) | Yes | `Bulk completed` | Yes | Hosted artifact `2026-04-23T13-12-01-757Z-crm-day5-audit-verification-automation.json` |
| A2 | Pass (`200`) | Yes | `Bulk archived` | Yes | same artifact |
| A3 | Pass (`200`) | Yes | `Contact deleted` | Yes | same artifact |
| A4 | Fail (`500`) | No | FK violation on contact mass transfer | Partial | same artifact; local code fix applied in `apps/dashboard/app/api/crm/contacts/mass-transfer/route.ts` |
| A5 | Pass (`200`) | Yes | `Mass transferred ... lead` | Yes | same artifact |
| A6 | Pass (`200`) | Yes | `Mass deleted ... lead` | Yes | same artifact |
| A7 | Pass (`200`) | Yes | `Mass updated ... lead` | Yes | same artifact |

## Product/QA closure note

- Role matrix decision: **Pass** (hosted Day 5 R1-R15 matrix green).
- Audit coverage decision: **Partial** (A1-A3/A5-A7 pass; A4 blocked by hosted FK bug now fixed in code but not deployed yet).
- Open risks: Queue #6 can close after deploy + hosted rerun confirms A4 pass and audit log presence.
- Signoff owner: Phani
- Date: 2026-04-23
