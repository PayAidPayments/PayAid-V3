---
name: repo-audit-implementation-verification
description: Compare repository implementation against a defined PayAid scope/checklist and return DONE/PARTIAL/MISSING/UNVERIFIED with concrete file evidence. Use for implementation audits, checklist verification, release prep, and "what is actually shipped?" questions.
---

# Repo Audit Implementation Verification

## When to use

Use this skill when the request is about implementation truth:

- "What is built vs not built?"
- "Verify this checklist against repo state."
- "Audit this module before release."
- "Confirm if a fix is actually implemented."

## Mandatory routing

Before running this audit on meaningful scope:

1. Start with **PayAid Product Strategist** for acceptance framing.
2. If 2+ modules are touched, run **Platform Architect**.

## Output format (required)

Return only this structure:

```markdown
## Scope
- Ticket/checklist reference:
- Modules reviewed:

## Verification table
| Item | Status | Evidence | Notes |
|---|---|---|---|
| <item> | DONE/PARTIAL/MISSING/UNVERIFIED | <path(s)> | <1 line> |

## Risks
- <severity + risk>

## Next actions
- <highest-priority closure step>
```

## Status rules

- `DONE`: implementation is present and matches acceptance behavior.
- `PARTIAL`: some implementation exists but acceptance criteria are not fully met.
- `MISSING`: required implementation is not found.
- `UNVERIFIED`: code exists but runtime/contract evidence is missing.

Do not mark `DONE` without path-level evidence.

## Minimum evidence requirements

For each item, include at least one of:

- code path (`apps/...`, `lib/...`, `prisma/...`)
- route/test path (`app/api/...`, `tests/...`)
- artifact path (`docs/evidence/...`)

## Validation loop

1. Compare expected behavior to code paths.
2. Confirm guardrails (auth, tenant scope, idempotency, failure path).
3. Check test/evidence presence.
4. Classify with status rules.
5. List closure actions in strict priority order.
