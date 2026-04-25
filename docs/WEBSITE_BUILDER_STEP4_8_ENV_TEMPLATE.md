# Website Builder Step 4.8 Env Template

Copy these into your shell before running Step 4.8 runtime automation.

Strict env-flag convention:

- Set optional gate flags to `"1"` to enable strict mode.
- Any other value keeps strict mode disabled unless the script explicitly documents compatibility with `"true"`.

Known hosted URL from existing evidence:

- `https://payaid-v3.vercel.app`

```powershell
$env:WEBSITE_BUILDER_BASE_URL="https://payaid-v3.vercel.app"
$env:WEBSITE_BUILDER_AUTH_TOKEN="paste-bearer-token"
```

If you do not have a token, fetch one via login:

```powershell
$env:WEBSITE_BUILDER_BASE_URL="https://payaid-v3.vercel.app"
$env:WEBSITE_BUILDER_LOGIN_EMAIL="admin@demo.com"
$env:WEBSITE_BUILDER_LOGIN_PASSWORD="paste-password"
npm run get:website-builder-step4-8-token
```

Automation-friendly JSON mode (for scripts/CI wrappers):

```powershell
npm run get:website-builder-step4-8-token -- --json
```

Expected token-helper output:

- Prints ready-to-copy `$env:WEBSITE_BUILDER_BASE_URL="..."` and `$env:WEBSITE_BUILDER_AUTH_TOKEN="..."`
- Prints `npm run run:website-builder-step4-8-evidence-pipeline` as immediate follow-up
- On login/network failure, prints a `# Next steps` block with exact retry commands
- In `--json` mode, emits `{ ok, code, status, error, baseUrl, token, tenantId, nextSteps[] }`

Then run:

```powershell
npm run check:website-builder-step4-8-runtime
npm run apply:website-builder-step4-8-runtime-artifact
```

Or one command:

```powershell
npm run run:website-builder-step4-8-evidence-pipeline
```

Optional strict pipeline mode (include helper-layer tests in pipeline gate):

```powershell
$env:WEBSITE_BUILDER_INCLUDE_HELPER_TESTS="1"
npm run run:website-builder-step4-8-evidence-pipeline
```

Optional strict pipeline mode (include docs ASCII parser-safety check in pipeline gate):

```powershell
$env:WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK="1"
npm run run:website-builder-step4-8-evidence-pipeline
```

Optional strict pipeline mode (include env-flag parser tests in pipeline gate):

```powershell
$env:WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS="1"
npm run run:website-builder-step4-8-evidence-pipeline
```

Optional strict pipeline mode (include helper-test contract validation in pipeline gate):

```powershell
$env:WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK="1"
npm run run:website-builder-step4-8-evidence-pipeline
```

Optional early-signal check from evidence-pipeline summary:

- `discoverabilityGate.ok` should be `true`
- `discoverabilityGate.status` should be `200`
- If pipeline `overallOk=false`, inspect `runtimeBlockers[]` and use `nextAction` (copy/paste-ready remediation).
- Optional: execute `nextActionSteps[]` sequentially for structured remediation.
- Optional: inspect `tokenHelperProbe` for parsed token-helper diagnostics (`code`, `error`, `nextSteps[]`) when auth token is missing.
- Optional: inspect `helperTests` for helper-layer gate status (`enabled`, `ok`, `exitCode`, `elapsedMs`).
- Optional: inspect `docsAsciiCheck` for docs parser-safety gate status (`enabled`, `ok`, `exitCode`, `elapsedMs`).
- Optional: inspect `flagParserTests` for env-flag parser gate status (`enabled`, `ok`, `exitCode`, `elapsedMs`).
- Optional: inspect `helperContractCheck` for helper-test output contract gate status (`enabled`, `ok`, `exitCode`, `elapsedMs`).

Full gate pack (runtime evidence + ready-to-commit preflight):

```powershell
npm run run:website-builder-ready-to-commit-pack
```

Optional strict pack mode (include helper-layer tests in pack gate):

```powershell
$env:WEBSITE_BUILDER_INCLUDE_HELPER_TESTS="1"
npm run run:website-builder-ready-to-commit-pack
```

Optional strict pack mode (include docs ASCII parser-safety check in pack gate):

```powershell
$env:WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK="1"
npm run run:website-builder-ready-to-commit-pack
```

Optional strict pack mode (include env-flag parser tests in pack gate):

```powershell
$env:WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS="1"
npm run run:website-builder-ready-to-commit-pack
```

Optional strict pack mode (include helper-test contract validation in pack gate):

```powershell
$env:WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK="1"
npm run run:website-builder-ready-to-commit-pack
```

If pack summary returns `overallOk=false`, inspect `runtimeBlockers[]` for explicit env/auth blockers.

Use `nextAction` from pack output (copy/paste-ready PowerShell env + rerun command, including token-helper flow when token is missing) before rerun.
- Optional: execute `nextActionSteps[]` for command-by-command recovery.
- Optional: inspect `tokenHelperProbe` for parsed token-helper diagnostics (`code`, `error`, `nextSteps[]`) when auth token is missing.
- Optional: inspect `helperTests` for helper-layer gate status (`enabled`, `ok`, `exitCode`, `elapsedMs`).
- Optional: inspect `docsAsciiCheck` for docs parser-safety gate status (`enabled`, `ok`, `exitCode`, `elapsedMs`).
- Optional: inspect `flagParserTests` for env-flag parser gate status (`enabled`, `ok`, `exitCode`, `elapsedMs`).
- Optional: inspect `helperContractCheck` for helper-test output contract gate status (`enabled`, `ok`, `exitCode`, `elapsedMs`).

Optional helper-layer guardrail check:

```powershell
npm run test:website-builder-step4-8-helpers
```

Expected helper-test summary fields:

- `check` (expected `website-builder-step4-8-helper-tests`)
- `overallOk`
- `steps[]` (`label`, `command`, `ok`, `exitCode`, `elapsedMs`)
- Expected `steps[].label` includes `flag-parser-gate` plus existing helper labels.
