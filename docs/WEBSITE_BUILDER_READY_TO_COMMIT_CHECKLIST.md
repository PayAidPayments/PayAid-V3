# Website Builder Ready-to-Commit Checklist

Use this checklist before creating a commit/PR for Website Builder Step 4.8 work.

Optional fast preflight command:

- `npm run check:website-builder-ready-to-commit`

One-command pack (runtime evidence + preflight):

- `npm run run:website-builder-ready-to-commit-pack`
- Confirm pack summary shows:
  - `discoverabilityGate.markerCheck.ok: true`
  - `discoverabilityGate.evidenceCheck.ok: true`
- If `overallOk=false`, check `runtimeBlockers[]` in pack output for explicit env/auth blockers.
- Use `nextAction` from pack output as immediate remediation hint before rerun.
- Optional strict pack mode:
  - `$env:WEBSITE_BUILDER_INCLUDE_HELPER_TESTS="1"`
  - `npm run run:website-builder-ready-to-commit-pack`
  - Verify `helperTests.ok: true` in pack summary.
- Optional strict docs parser-safety mode:
  - `$env:WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK="1"`
  - `npm run run:website-builder-ready-to-commit-pack`
  - Verify `docsAsciiCheck.ok: true` in pack summary.
- Optional strict env-flag parser mode:
  - `$env:WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS="1"`
  - `npm run run:website-builder-ready-to-commit-pack`
  - Verify `flagParserTests.ok: true` in pack summary.
- Optional strict helper-contract mode:
  - `$env:WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK="1"`
  - `npm run run:website-builder-ready-to-commit-pack`
  - Verify `helperContractCheck.ok: true` in pack summary.
- Optional helper guardrail check:
  - `npm run test:website-builder-step4-8-helpers`
  - If helper checks fail, use runbook triage:
    - `docs/WEBSITE_BUILDER_STEP4_8_RUNTIME_RUNBOOK.md` -> `4.7 Helper test gate failures`

Preflight artifacts:

- `docs/evidence/closure/*-website-builder-ready-to-commit-check.json`
- `docs/evidence/closure/*-website-builder-ready-to-commit-check.md`

---

## 1) Scope hygiene

- [ ] Changes are limited to Website Builder scope (or clearly documented cross-module dependencies).
- [ ] No unrelated refactors are bundled into this commit.
- [ ] Route and API names match canonical Website Builder paths.

---

## 2) Runtime evidence

- [ ] Step 4.8 runtime checks executed:
  - `npm run run:website-builder-step4-8-evidence-pipeline`
  - Optional strict pipeline mode:
    - `$env:WEBSITE_BUILDER_INCLUDE_HELPER_TESTS="1"`
    - Verify `helperTests.ok: true` in pipeline summary.
  - Optional strict pipeline docs parser-safety mode:
    - `$env:WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK="1"`
    - Verify `docsAsciiCheck.ok: true` in pipeline summary.
  - Optional strict pipeline env-flag parser mode:
    - `$env:WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS="1"`
    - Verify `flagParserTests.ok: true` in pipeline summary.
  - Optional strict pipeline helper-contract mode:
    - `$env:WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK="1"`
    - Verify `helperContractCheck.ok: true` in pipeline summary.
- [ ] Runtime artifacts exist:
  - `docs/evidence/closure/*-website-builder-step4-8-runtime-checks.json`
  - `docs/evidence/closure/*-website-builder-step4-8-runtime-checks.md`
- [ ] Evidence template updated:
  - `docs/evidence/closure/2026-04-24-website-builder-step4-8-runtime-qa-template.md`
- [ ] Discoverability evidence captured in QA template:
  - Module switcher screenshot shows `Website Builder` entry.
  - Navigation proof shows landing on `/website-builder/[tenantId]/Home` (direct or redirect).

---

## 3) API guardrails verification

- [ ] `PATCH /api/website/sites/:id` metadata-only path returns `normalizedPageTree: false`.
- [ ] `PATCH /api/website/sites/:id` pageTree path returns `normalizedPageTree: true`.
- [ ] Invalid page-tree payload returns `400` with `details[]`.
- [ ] Page-tree normalization behavior confirmed (slug canonicalization + deterministic order).

---

## 4) UI guardrails verification

- [ ] Page-tree editor blocks empty-title and empty-slug rows.
- [ ] Page-tree editor blocks duplicate slugs (case-insensitive).
- [ ] Zero-page save is blocked.
- [ ] Success + save timestamp + unsaved-change indicators behave as expected.

---

## 5) Documentation alignment

- [ ] `docs/VERCEL_PRODUCTION_TESTING_HANDOFF.md` Step 4.8 section is current.
- [ ] Step 4.8 sign-off gate and execution report template rows are current.
- [ ] Runbook and env template are current:
  - `docs/WEBSITE_BUILDER_STEP4_8_RUNTIME_RUNBOOK.md`
  - `docs/WEBSITE_BUILDER_STEP4_8_ENV_TEMPLATE.md`

---

## 6) Commit readiness summary (copy/paste)

```text
Website Builder commit readiness:
- Scope hygiene: PASS/FAIL
- Runtime evidence: PASS/FAIL
- API guardrails: PASS/FAIL
- UI guardrails: PASS/FAIL
- Docs alignment: PASS/FAIL

Evidence artifacts:
- Runtime JSON:
- Runtime MD:
- QA template:
- Discoverability screenshot:
- Discoverability navigation proof:

Notes / exclusions:
-
```
