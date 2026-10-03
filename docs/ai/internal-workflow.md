# PayAid Internal Workflow (Specialists + Skills)

Use this for meaningful implementation tickets.

## 1) Intake

- Define scope, modules touched, and release target.
- Identify whether new routes/buttons/pages are included.
- Identify whether schema changes are included.
- Select one NEXUS runbook slug from `docs/ai/nexus/runbooks.json`.

## 2) Required specialist order

Default order (still required unless a runbook explicitly sequences otherwise):

1. PayAid Product Strategist
2. Platform Architect (if 2+ modules)
3. Relevant domain specialist(s)
4. No-404 QA Specialist (if route/button/page changes)
5. Code Review Specialist

Runbook source of truth for Phase 1:

- `docs/ai/nexus/README.md`
- `docs/ai/nexus/runbooks/<slug>.md`
- Handoffs: `docs/ai/nexus/handoff-templates.md`
- Ship blockers: `docs/ai/nexus/ship-gate.md`

## 3) Apply project skills from `docs/ai/agents/`

Select only scope-matching skills:

- `repo-audit-implementation-verification`
- `pilot-release-gate-go-no-go`
- `smoke-test-source-path-verification`
- `prisma-migration-discipline`
- `tenant-scope-multi-tenant-guardrails`

## 4) Evidence and checklist discipline

- Save specialist handoffs under `docs/evidence/nexus/<ticket-id>/`.
- Also keep broader outputs under `docs/evidence/` (or module evidence folder) when useful.
- Capture specialist and skill artifacts in ticket notes.
- Update `docs/PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md` in the same change set:
  - status updates
  - newly discovered gaps
  - one dated update-log line

## 5) Ship rule

Do not ship when any required specialist or selected skill result is fail/unverified without explicit acceptance and follow-up owner/date.

A missing runbook gate listed in `shipBlockedWithout` blocks shipping. See `docs/ai/nexus/ship-gate.md`.

Integrity check: `npm run check:nexus-runbooks`.
