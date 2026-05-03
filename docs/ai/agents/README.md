# PayAid Project Skills (Operational Set)

This folder contains the small, operational skill pack for PayAid execution work.

## Active skills

1. `repo-audit-implementation-verification`
2. `pilot-release-gate-go-no-go`
3. `smoke-test-source-path-verification`
4. `prisma-migration-discipline`
5. `tenant-scope-multi-tenant-guardrails`

## Router order

Use these skills within the existing specialist flow:

1. Run **PayAid Product Strategist** first for any meaningful implementation.
2. If 2+ modules are touched, run **Platform Architect** before coding.
3. Apply one or more skills from this folder based on scope.
4. Run **No-404 QA Specialist** for new routes/buttons/pages.
5. Run **Code Review Specialist** before ship decision.

## Evidence expectation

Every skill run must produce a dated artifact in `docs/evidence/` (or a module-specific evidence folder) and a line in:

- `docs/PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md` update log
