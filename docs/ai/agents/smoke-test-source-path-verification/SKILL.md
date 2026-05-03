---
name: smoke-test-source-path-verification
description: Run PayAid smoke checks for source-specific ingress and critical app paths, then map failures to exact routes/files with rerun-ready evidence. Use for route validation, ingress verification, and pre-release smoke coverage.
---

# Smoke Test Source Path Verification

## When to use

Use this skill when validating:

- critical routes and pages
- inbound source-to-handler paths (form/contact/chatbot/API)
- pilot loop reliability after changes
- pre-release smoke health

## Mandatory routing

- Start with **PayAid Product Strategist** for in-scope critical paths.
- Run **No-404 QA Specialist** when UI routes/buttons/pages are involved.

## Smoke matrix template

```markdown
## Smoke Matrix
| Flow | Entry path | Expected result | Status | Evidence |
|---|---|---|---|---|
| Form submit -> lead/task | /api/... | 2xx + decision/task rows | PASS/FAIL | <artifact> |
| Contact create/edit | /crm/... | UI save + list consistency | PASS/FAIL | <artifact> |
| Chatbot/source ingress | /api/... | idempotent processing | PASS/FAIL | <artifact> |
| Route health critical set | /home/... /crm/... | no 404/500 | PASS/FAIL | <artifact> |
```

## Failure handling

For each `FAIL`, provide:

1. failing source path and endpoint/page
2. probable break location (file path)
3. rerun command
4. severity (`blocker`, `major`, `minor`)

## Pass criteria

Mark a flow `PASS` only when:

- expected status/behavior is observed
- no auth/tenant scope violations occur
- evidence artifact is captured with timestamp

## Evidence output

Write results to a dated artifact under `docs/evidence/` and link that path in gate docs.
