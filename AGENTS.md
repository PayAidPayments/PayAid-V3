# PayAid Specialist Agent System

This repository uses two separate specialist packs:

1. **PayAid Dev Specialist Pack** (internal, Cursor-facing)
2. **PayAid Business Specialist Pack** (customer-facing, in-product)

Do not mix these packs. Internal coding specialists are not exposed to end users.

## Internal Dev Specialist Pack

Primary location: `docs/ai/agents/`

Specialists:
- PayAid Product Strategist
- Platform Architect
- CRM Specialist
- Marketing Specialist
- Finance and GST Specialist
- Workflow Automation Specialist
- UX Cleanup Specialist
- Speed Auditor
- No-404 QA Specialist
- Code Review Specialist

Prompt templates:
- `docs/ai/prompts/feature-planning.md`
- `docs/ai/prompts/feature-review.md`
- `docs/ai/prompts/ui-audit.md`
- `docs/ai/prompts/module-audit.md`

## Customer-Facing Business Specialist Pack

Primary location: `docs/ai/customer/` (Phase 2 catalog + entitlement headers)

Human entry points:
- `docs/ai/payaid-specialists.md`
- `docs/ai/payaid-specialist-router.md`
- `docs/ai/payaid-specialist-permissions.md`
- `docs/ai/agent-routing-matrix.md`

Runtime evaluator: `lib/ai/customer-specialists/`  
Product flows (Phase 3): `docs/ai/customer/flows.md`  
Thin orchestrator + approval UX (Phase 4): `docs/ai/customer/orchestrator.md` · `/ai-studio/[tenantId]/Flows`  
Integrity checks: `npm run check:customer-specialists` · `npm run check:customer-flows` · `npm run check:customer-orchestrator`

Design principles:
- Every specialist is module-aware and entitlement-aware.
- Specialists only access tenant data allowed by subscription and role.
- Sensitive actions are draft-first or require approval.
- All actions must be logged for auditability.
- Missing module/role fails closed (agent not invoked).

## Routing Rules

- Always begin significant work with Product Strategist.
- If 2+ modules are touched, invoke Platform Architect.
- Run No-404 QA and Code Review before shipping.
- Trigger domain specialists only when relevant to scope.

## Mandatory Checkpoints

- Every new route, button, or page must go through No-404 QA Specialist.
- Every cross-module change must go through Platform Architect.
- Every performance-sensitive feature must go through Speed Auditor.
- Every significant merge must go through Code Review Specialist.
- Every finance, HR, compliance, or outbound action flow must use draft-first plus approval checks.
- For every significant implementation step, update `docs/PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md` (status + update-log entry + any newly identified gaps).

## Quick Start (Runbook)

To operationalize this file on real tickets, use:

- `docs/ai/nexus/README.md` (Phase 1 internal NEXUS catalog + five runbooks)
- `docs/ai/specialist-execution-template.md`
- `docs/ai/internal-workflow.md`

Pick one internal runbook slug before coding:

- `new-page-or-route`
- `schema-or-billing-change`
- `performance-pass`
- `release`
- `production-incident`

Integrity check: `npm run check:nexus-runbooks`

## UI Implementation Conventions

- For clipboard interactions, prefer shared `CopyAction` patterns over page-local clipboard/timer code.
- Use `COPY_ACTION_PRESETS` defaults before adding one-off copy UI behavior.
- Reference: `docs/ai/copy-ui-pattern-guideline.md`

## Architecture Hygiene (non-negotiable)

Hard rules — enforce in CI and code review (see `docs/V3_ARCHITECTURE_HYGIENE_BOARD_2026-07-27.md`):

- **One schema:** edit `packages/db/prisma/schema.prisma`, then `npm run sync:prisma-schema-mirror`. Never drift from root mirror.
- **One router truth:** decoupled `/{module}/{tenant}/…` paths; no new `/dashboard/*` feature homes.
- **One builder / one AI workspace:** no parallel `website-builder-v2` or duplicate AI entry tiles.
- **Zero production placeholders:** keep incomplete shells `navVisibility: 'hidden'` / `coming-soon`.
- **Lead Intelligence:** standalone structure OK; stay hidden from Module Switcher until provider-first discovery is real.
- **Build safety:** do not set `ignoreBuildErrors: true`; emergency only via `PAYAID_ALLOW_TS_BUILD_ERRORS=1`.

Gate: `npm run check:architecture-hygiene` (also `release:gate:architecture-hygiene`, workflow `architecture-hygiene.yml`).

## Automation Env-Flag Convention

- For strict/optional automation gates, treat env flag value `"1"` as enabled.
- Treat all other values as disabled unless a script explicitly documents `"true"` compatibility.
- Use shared parser utility `scripts/strict-flag.mjs` (or `scripts/strict-flag.cjs` for CommonJS scripts) instead of inline string checks.
- Operator-facing reference: `docs/WEBSITE_BUILDER_STEP4_8_RUNTIME_RUNBOOK.md` (strict env-flag convention note).

See:
- `docs/ai/payaid-specialist-router.md`
- `docs/ai/payaid-specialist-permissions.md`
- `docs/ai/agent-routing-matrix.md`
- `docs/ai/release-readiness-checklist.md`

