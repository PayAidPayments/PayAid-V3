# Website Builder Step 4.8 Runtime Runbook

Use this runbook to execute and archive Website Builder Step 4.8 runtime evidence consistently.

Primary reference:

- `docs/VERCEL_PRODUCTION_TESTING_HANDOFF.md` (Step 4.8)

Evidence template:

- `docs/evidence/closure/2026-04-24-website-builder-step4-8-runtime-qa-template.md`

---

## 1) Prerequisites

- Website Builder routes are reachable on target environment.
- Test user has access to Website Builder module.
- Bearer token for target tenant is available.

Required env vars:

- `WEBSITE_BUILDER_BASE_URL`
- `WEBSITE_BUILDER_AUTH_TOKEN`

Strict env-flag convention (for all optional gates in this runbook):

- Set strict gate flags to `"1"` to enable.
- Any other value keeps the gate disabled unless the script explicitly documents compatibility with `"true"`.

If token is not already available, use helper command:

```powershell
$env:WEBSITE_BUILDER_BASE_URL="https://payaid-v3.vercel.app"
$env:WEBSITE_BUILDER_LOGIN_EMAIL="admin@demo.com"
$env:WEBSITE_BUILDER_LOGIN_PASSWORD="paste-password"
npm run get:website-builder-step4-8-token
```

JSON output mode for automation:

```powershell
npm run get:website-builder-step4-8-token -- --json
```

JSON payload fields:

- `ok`, `code`, `status`, `error`
- `baseUrl`, `token`, `tenantId`
- `nextSteps[]`

---

## 2) Command flow (recommended)

Run full release gate pack (runtime evidence + ready-to-commit preflight):

```powershell
npm run run:website-builder-ready-to-commit-pack
```

Pack summary includes discoverability gate rollup:

- `discoverabilityGate.markerCheck` -> discoverability section markers present
- `discoverabilityGate.evidenceCheck` -> discoverability evidence fields populated
- `runtimeBlockers[]` -> explicit runtime env/auth blockers when execution is blocked
- `nextAction` -> copy/paste-ready PowerShell remediation built from `runtimeBlockers[]`
  - Includes token-helper flow (`npm run get:website-builder-step4-8-token`) when auth token is missing.
- `nextActionSteps[]` -> structured step-by-step remediation commands
- `tokenHelperProbe` (optional) with parsed token-helper JSON (`code`, `error`, `nextSteps[]`) when auth token is missing and login env vars are present.
- `helperTests` (optional) helper-layer gate status:
  - Enable by setting `WEBSITE_BUILDER_INCLUDE_HELPER_TESTS=1` before running pack.
- `docsAsciiCheck` (optional) docs parser-safety gate status:
  - Enable by setting `WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK=1` before running pack.
- `flagParserTests` (optional) env-flag parser gate status:
  - Enable by setting `WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS=1` before running pack.
- `helperContractCheck` (optional) helper-test output contract gate status:
  - Enable by setting `WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK=1` before running pack.

Or run runtime evidence only:

```powershell
npm run run:website-builder-step4-8-evidence-pipeline
```

Evidence pipeline summary now includes:

- `discoverabilityGate.ok` / `discoverabilityGate.status`
- `discoverabilityGate.details` (filled vs missing-field context from runtime check `G`)
- `runtimeBlockers[]` when runtime execution is blocked
- `nextAction` copy/paste-ready remediation hint
  - Includes token-helper flow when auth token is missing.
- `nextActionSteps[]` for command-by-command execution flow.
- `tokenHelperProbe` (optional) with parsed token-helper JSON (`code`, `error`, `nextSteps[]`) when auth token is missing and login env vars are present.
- `helperTests` (optional) helper-layer gate status:
  - Enable by setting `WEBSITE_BUILDER_INCLUDE_HELPER_TESTS=1` before running pipeline.
- `docsAsciiCheck` (optional) docs parser-safety gate status:
  - Enable by setting `WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK=1` before running pipeline.
- `flagParserTests` (optional) env-flag parser gate status:
  - Enable by setting `WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS=1` before running pipeline.
- `helperContractCheck` (optional) helper-test output contract gate status:
  - Enable by setting `WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK=1` before running pipeline.

Run the full pipeline (runtime check + evidence autofill):

```powershell
npm run run:website-builder-step4-8-evidence-pipeline
```

Equivalent split commands:

```powershell
npm run check:website-builder-step4-8-runtime
npm run apply:website-builder-step4-8-runtime-artifact
```

Optional helper test aggregate (CI-friendly):

```powershell
npm run test:website-builder-step4-8-helpers
```

To include helper tests inside pack gating itself:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_HELPER_TESTS="1"
npm run run:website-builder-ready-to-commit-pack
```

To include docs ASCII safety inside pack gating itself:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK="1"
npm run run:website-builder-ready-to-commit-pack
```

To include flag parser tests inside pack gating itself:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS="1"
npm run run:website-builder-ready-to-commit-pack
```

To include helper-test contract validation inside pack gating itself:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK="1"
npm run run:website-builder-ready-to-commit-pack
```

To include helper tests inside pipeline gating itself:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_HELPER_TESTS="1"
npm run run:website-builder-step4-8-evidence-pipeline
```

To include docs ASCII safety inside pipeline gating itself:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK="1"
npm run run:website-builder-step4-8-evidence-pipeline
```

To include flag parser tests inside pipeline gating itself:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS="1"
npm run run:website-builder-step4-8-evidence-pipeline
```

To include helper-test contract validation inside pipeline gating itself:

```powershell
$env:WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK="1"
npm run run:website-builder-step4-8-evidence-pipeline
```

Expected aggregate helper-test summary fields (for CI parsing):

- `check` (expected value: `website-builder-step4-8-helper-tests`)
- `overallOk` (`true`/`false`)
- `steps[]` with per-step:
  - `label`
  - `command`
  - `ok`
  - `exitCode`
  - `elapsedMs`
- Current expected `steps[].label` set includes:
  - `helper-contract-gate`, `flag-parser-gate`, `gates`, `docs-gate`, `helper-gate`, `next-action`, `token-probe`

JSON contract example (schema-style, parser-oriented):

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

Contract notes:

- `check` must equal `website-builder-step4-8-helper-tests`.
- `overallOk` must be boolean.
- `steps[]` must be array of objects containing `label`, `command`, `ok`, `exitCode`, `elapsedMs`.
- `steps[].label` must be one of:
  - `helper-contract-gate`, `flag-parser-gate`, `gates`, `docs-gate`, `helper-gate`, `next-action`, `token-probe`.

Automated contract validator:

```powershell
npm run validate:website-builder-helper-test-contract
```

---

## 3) Expected outputs

Runtime artifacts:

- `docs/evidence/closure/*-website-builder-step4-8-runtime-checks.json`
- `docs/evidence/closure/*-website-builder-step4-8-runtime-checks.md`

Autofilled QA template:

- `docs/evidence/closure/2026-04-24-website-builder-step4-8-runtime-qa-template.md`

Expected API markers in artifact:

- A `GET /api/website/sites` -> pass
- B `POST /api/website/sites` -> pass + `siteId`
- C `GET /api/website/sites/:id` -> pass
- D metadata-only patch -> `normalizedPageTree: false`
- E pageTree patch -> `normalizedPageTree: true`
- F draft generation -> `draft.pagePlan[]` present
- G QA-template discoverability evidence gate -> pass (or explicit missing-field list when incomplete)

---

## 4) Failure triage

### 4.1 Blocked mode

If script result is `mode=blocked`:

- Verify env vars are set:
  - `WEBSITE_BUILDER_BASE_URL`
  - `WEBSITE_BUILDER_AUTH_TOKEN`
- Re-run pipeline.

### 4.2 Auth failures (401/403)

- Confirm token belongs to tenant with Website Builder access.
- Re-login and refresh bearer token.

### 4.3 Create-step failures (B)

- Common cause: slug conflict from previous runs.
- Re-run script (slug is timestamped and should avoid collision).

### 4.4 PageTree patch mismatch (E)

- If `normalizedPageTree` is not `true`, inspect:
  - `PATCH /api/website/sites/:id` response body
  - Website Builder API route contract in `apps/dashboard/app/api/website/sites/[id]/route.ts`

### 4.5 Draft generation failures (F)

- Validate `POST /api/website/ai/generate-draft` availability and auth.
- Verify response includes `draft.pagePlan[]`.

### 4.6 Discoverability evidence gate failures (G)

- Open `docs/evidence/closure/2026-04-24-website-builder-step4-8-runtime-qa-template.md`.
- Fill Section `1) Module discoverability` fields with non-placeholder values.
- Add evidence path/link for discoverability screenshot/video.
- Re-run:
  - `npm run check:website-builder-step4-8-runtime`
  - `npm run apply:website-builder-step4-8-runtime-artifact`

### 4.7 Helper test gate failures

If `helperTests.ok=false` (pipeline/pack strict mode) or aggregate helper tests fail:

- Run helper aggregate directly:
  - `npm run test:website-builder-step4-8-helpers`
- Identify failing helper step from `steps[]`:
  - `helper-contract-gate` -> inspect `scripts/website-builder-step4-8-helper-contract-gate.mjs` + test fixtures.
  - `flag-parser-gate` -> inspect `scripts/website-builder-step4-8-flag-parser-gate.mjs` + test fixtures.
  - `gates` -> inspect `scripts/website-builder-step4-8-gates.mjs` + test fixtures.
  - `docs-gate` -> inspect `scripts/website-builder-step4-8-docs-gate.mjs` + test fixtures.
  - `helper-gate` -> verify `WEBSITE_BUILDER_INCLUDE_HELPER_TESTS` is explicitly `1` only when strict mode is intended.
  - `next-action` -> inspect `scripts/website-builder-step4-8-next-action.mjs` + test fixtures.
  - `token-probe` -> inspect `scripts/website-builder-step4-8-token-probe.mjs` + test fixtures.
- Re-run strict mode command after fixes:
  - `$env:WEBSITE_BUILDER_INCLUDE_HELPER_TESTS="1" ; npm run run:website-builder-step4-8-evidence-pipeline`
  - `$env:WEBSITE_BUILDER_INCLUDE_HELPER_TESTS="1" ; npm run run:website-builder-ready-to-commit-pack`

---

## 5) Closeout checklist

- [ ] Runtime artifacts generated (`json` + `md`)
- [ ] Template autofilled
- [ ] Module-switcher discoverability evidence captured (Website Builder visible + navigable from non-Website Builder module)
- [ ] Manual UI evidence screenshots added
- [ ] Step 4.8 sign-off gate evaluated in handoff doc
- [ ] Final QA report updated with Step 4.8 result
