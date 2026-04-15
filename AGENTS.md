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

Primary location: `docs/ai/payaid-specialists.md`

Design principles:
- Every specialist is module-aware and entitlement-aware.
- Specialists only access tenant data allowed by subscription and role.
- Sensitive actions are draft-first or require approval.
- All actions must be logged for auditability.

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

- `docs/ai/specialist-execution-template.md`
- `docs/ai/internal-workflow.md`

## UI Implementation Conventions

- For clipboard interactions, prefer shared `CopyAction` patterns over page-local clipboard/timer code.
- Use `COPY_ACTION_PRESETS` defaults before adding one-off copy UI behavior.
- Reference: `docs/ai/copy-ui-pattern-guideline.md`

See:
- `docs/ai/payaid-specialist-router.md`
- `docs/ai/payaid-specialist-permissions.md`
- `docs/ai/agent-routing-matrix.md`
- `docs/ai/release-readiness-checklist.md`

