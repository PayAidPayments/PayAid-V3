# Website Builder Step 4.8 Evidence Index

Canonical reference for Step 4.8 runtime + commit-gate evidence artifacts.

---

## Commands

Strict env-flag convention:

- Set optional strict gate flags to `"1"` to enable.
- Any other value keeps strict mode disabled unless the script explicitly documents compatibility with `"true"`.

Recommended one-command gate:

```powershell
npm run run:website-builder-ready-to-commit-pack
```

If pack summary returns `overallOk=false`, inspect `runtimeBlockers[]` for explicit env/auth blockers.

Use `nextAction` from pack output (copy/paste-ready PowerShell env + rerun command, including token-helper flow when token is missing) before rerun.
Optional: run `nextActionSteps[]` sequentially for structured remediation.
Optional: inspect `tokenHelperProbe` (`code`, `error`, `nextSteps[]`) when auth token is missing.
Optional: inspect `helperTests` (`enabled`, `ok`, `exitCode`, `elapsedMs`) for helper-layer gate status.
Optional: inspect `docsAsciiCheck` (`enabled`, `ok`, `exitCode`, `elapsedMs`) for docs parser-safety gate status.
Optional: inspect `flagParserTests` (`enabled`, `ok`, `exitCode`, `elapsedMs`) for env-flag parser gate status.
Optional: inspect `helperContractCheck` (`enabled`, `ok`, `exitCode`, `elapsedMs`) for helper-test output contract gate status.

To enforce helper tests in pack gating:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_HELPER_TESTS="1"
npm run run:website-builder-ready-to-commit-pack
```

To enforce docs ASCII parser-safety in pack gating:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK="1"
npm run run:website-builder-ready-to-commit-pack
```

To enforce env-flag parser tests in pack gating:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS="1"
npm run run:website-builder-ready-to-commit-pack
```

To enforce helper-test contract validation in pack gating:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK="1"
npm run run:website-builder-ready-to-commit-pack
```

Equivalent split flow:

```powershell
npm run run:website-builder-step4-8-evidence-pipeline
npm run check:website-builder-ready-to-commit
```

Optional early-signal check from evidence-pipeline summary:

- `discoverabilityGate.ok` should be `true`
- `discoverabilityGate.status` should be `200`
- If pipeline `overallOk=false`, inspect `runtimeBlockers[]` and use `nextAction` (copy/paste-ready remediation).
- Optional: execute `nextActionSteps[]` in order when present.
- Optional: inspect `tokenHelperProbe` (`code`, `error`, `nextSteps[]`) when auth token is missing.
- Optional: inspect `helperTests` (`enabled`, `ok`, `exitCode`, `elapsedMs`) for helper-layer gate status.
- Optional: inspect `docsAsciiCheck` (`enabled`, `ok`, `exitCode`, `elapsedMs`) for docs parser-safety gate status.
- Optional: inspect `flagParserTests` (`enabled`, `ok`, `exitCode`, `elapsedMs`) for env-flag parser gate status.
- Optional: inspect `helperContractCheck` (`enabled`, `ok`, `exitCode`, `elapsedMs`) for helper-test output contract gate status.

To enforce helper tests in pipeline gating:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_HELPER_TESTS="1"
npm run run:website-builder-step4-8-evidence-pipeline
```

To enforce docs ASCII parser-safety in pipeline gating:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK="1"
npm run run:website-builder-step4-8-evidence-pipeline
```

To enforce env-flag parser tests in pipeline gating:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS="1"
npm run run:website-builder-step4-8-evidence-pipeline
```

To enforce helper-test contract validation in pipeline gating:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK="1"
npm run run:website-builder-step4-8-evidence-pipeline
```

Optional helper-layer guardrail check:

```powershell
npm run test:website-builder-step4-8-helpers
```

Expected helper-test summary fields:

- `check` (expected `website-builder-step4-8-helper-tests`)
- `overallOk`
- `steps[]` (`label`, `command`, `ok`, `exitCode`, `elapsedMs`)
- Expected `steps[].label` includes:
  - `helper-contract-gate`, `flag-parser-gate`, `gates`, `docs-gate`, `helper-gate`, `next-action`, `token-probe`

JSON contract example:

```json
{
  "check": "website-builder-step4-8-helper-tests",
  "overallOk": true,
  "steps": [
    {
      "label": "flag-parser-gate",
      "command": "npm run test:website-builder-step4-8-flag-parser-gate",
      "ok": true,
      "exitCode": 0,
      "elapsedMs": 1234
    }
  ]
}
```

Contract validator command:

```powershell
npm run validate:website-builder-helper-test-contract
```

Token helper (`npm run get:website-builder-step4-8-token`) behavior:

- Success: prints copy/paste env exports for `WEBSITE_BUILDER_BASE_URL` and `WEBSITE_BUILDER_AUTH_TOKEN`
- Failure: prints explicit reason plus a `# Next steps` retry block
- Automation mode: `npm run get:website-builder-step4-8-token -- --json` returns structured payload (`ok`, `code`, `status`, `error`, `baseUrl`, `token`, `tenantId`, `nextSteps[]`)

---

## Required artifacts

Runtime checks:

- `docs/evidence/closure/*-website-builder-step4-8-runtime-checks.json`
- `docs/evidence/closure/*-website-builder-step4-8-runtime-checks.md`

Expected runtime markers:

- A `GET /api/website/sites` pass
- B `POST /api/website/sites` pass + `siteId`
- C `GET /api/website/sites/:id` pass
- D metadata-only patch shows `normalizedPageTree: false`
- E pageTree patch shows `normalizedPageTree: true`
- F draft generation includes `draft.pagePlan[]`
- G QA-template discoverability evidence gate pass (or explicit missing-field list when incomplete)

Commit preflight:

- `docs/evidence/closure/*-website-builder-ready-to-commit-check.json`
- `docs/evidence/closure/*-website-builder-ready-to-commit-check.md`

QA capture template:

- `docs/evidence/closure/2026-04-24-website-builder-step4-8-runtime-qa-template.md`

---

## Submission checklist

- [ ] Step 4.8 runtime checks executed and artifacts generated
- [ ] Step 4.8 ready-to-commit preflight executed and artifacts generated
- [ ] QA template completed with UI/API evidence links
- [ ] Discoverability evidence captured:
  - [ ] Module switcher screenshot shows `Website Builder` entry in secondary tools
  - [ ] Navigation proof shows landing on `/website-builder/[tenantId]/Home` (direct or redirect)
- [ ] Final report includes Step 4.8 result and artifact paths

---

## Reference docs

- `docs/VERCEL_PRODUCTION_TESTING_HANDOFF.md` (Step 4.8 + execution report template)
- `docs/WEBSITE_BUILDER_STEP4_8_RUNTIME_RUNBOOK.md`
- `docs/WEBSITE_BUILDER_STEP4_8_ENV_TEMPLATE.md`
- `docs/WEBSITE_BUILDER_READY_TO_COMMIT_CHECKLIST.md`
