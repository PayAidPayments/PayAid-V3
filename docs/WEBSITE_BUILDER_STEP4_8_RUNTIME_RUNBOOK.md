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

If token is not already available, use helper command:

```powershell
$env:WEBSITE_BUILDER_BASE_URL="https://payaid-v3.vercel.app"
$env:WEBSITE_BUILDER_LOGIN_EMAIL="admin@demo.com"
$env:WEBSITE_BUILDER_LOGIN_PASSWORD="paste-password"
npm run get:website-builder-step4-8-token
```

---

## 2) Command flow (recommended)

Run full release gate pack (runtime evidence + ready-to-commit preflight):

```powershell
npm run run:website-builder-ready-to-commit-pack
```

Or run runtime evidence only:

```powershell
npm run run:website-builder-step4-8-evidence-pipeline
```

Run the full pipeline (runtime check + evidence autofill):

```powershell
npm run run:website-builder-step4-8-evidence-pipeline
```

Equivalent split commands:

```powershell
npm run check:website-builder-step4-8-runtime
npm run apply:website-builder-step4-8-runtime-artifact
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

---

## 5) Closeout checklist

- [ ] Runtime artifacts generated (`json` + `md`)
- [ ] Template autofilled
- [ ] Module-switcher discoverability evidence captured (Website Builder visible + navigable from non-Website Builder module)
- [ ] Manual UI evidence screenshots added
- [ ] Step 4.8 sign-off gate evaluated in handoff doc
- [ ] Final QA report updated with Step 4.8 result
