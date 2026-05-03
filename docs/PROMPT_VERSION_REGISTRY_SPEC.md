# Prompt/Version Registry Spec (Page AI Assistants)

Spec for managing AI assistant prompts as versioned, auditable configuration.

---

## 1) Goal

Ensure every page AI assistant uses:

- explicit prompt version IDs
- tenant/module/page scoping
- safe rollback to prior prompt versions
- measurable impact tracking

## 2) Registry Model (suggested)

Entity: `PromptRegistryEntry`

- `id`
- `module` (crm, finance, hr, etc.)
- `page_key` (e.g., `crm.revenue-intelligence`)
- `version` (semver or integer)
- `status` (`draft`, `active`, `archived`)
- `system_prompt`
- `guardrails` (business-only policy, refusal policy)
- `context_contract` (what data filters/fields are injected)
- `created_by`, `created_at`, `updated_at`

Optional per-tenant override:

- `TenantPromptOverride`
  - `tenant_id`
  - `prompt_registry_entry_id`
  - `status` (`active`, `disabled`)

## 3) Runtime Selection Rules

1. Resolve by `module + page_key`.
2. If tenant override exists and active, use that version.
3. Else use globally active version for that page.
4. If missing, fail safe with default refusal prompt.

## 4) API Surface (suggested)

- `GET /api/v1/prompts?module=&pageKey=`
- `POST /api/v1/prompts` (create draft)
- `POST /api/v1/prompts/:id/activate`
- `POST /api/v1/prompts/:id/archive`
- `POST /api/v1/prompts/:id/rollback` (activate prior version)

Permissions:

- read: `crm:audit:read` / module equivalent
- write: admin-level prompt management permission

## 5) Audit + Analytics

For each assistant invocation, log:

- `prompt_version`
- `module`
- `page_key`
- `tenant_id`
- request/response metadata (redacted)
- outcome flags (helpful / refused / error)

Track adoption by prompt version:

- invocation count
- refusal rate
- user feedback accept/reject
- latency/error rate

## 6) Guardrails

- Must preserve page-level business-only scope.
- Must include tenant scope in all prompt context.
- Must redact sensitive data before logging snapshots.
- Prompt changes should be feature-flaggable per tenant cohort.

## 7) Rollout Plan

1. Add registry read path + static seed entry per major page.
2. Attach `prompt_version` to assistant telemetry.
3. Enable UI for draft/activate/rollback.
4. Add per-tenant override after baseline stabilizes.

