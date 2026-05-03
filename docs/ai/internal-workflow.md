# PayAid Internal Workflow (Specialists + Skills)

Use this for meaningful implementation tickets.

## 1) Intake

- Define scope, modules touched, and release target.
- Identify whether new routes/buttons/pages are included.
- Identify whether schema changes are included.

## 2) Required specialist order

1. PayAid Product Strategist
2. Platform Architect (if 2+ modules)
3. Relevant domain specialist(s)
4. No-404 QA Specialist (if route/button/page changes)
5. Code Review Specialist

## 3) Apply project skills from `docs/ai/agents/`

Select only scope-matching skills:

- `repo-audit-implementation-verification`
- `pilot-release-gate-go-no-go`
- `smoke-test-source-path-verification`
- `prisma-migration-discipline`
- `tenant-scope-multi-tenant-guardrails`

## 4) Evidence and checklist discipline

- Save outputs under `docs/evidence/` (or module evidence folder).
- Capture specialist and skill artifacts in ticket notes.
- Update `docs/PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md` in the same change set:
  - status updates
  - newly discovered gaps
  - one dated update-log line

## 5) Ship rule

Do not ship when any required specialist or selected skill result is fail/unverified without explicit acceptance and follow-up owner/date.
