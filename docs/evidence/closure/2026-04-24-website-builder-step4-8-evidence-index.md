# Website Builder Step 4.8 Evidence Index

Canonical reference for Step 4.8 runtime + commit-gate evidence artifacts.

---

## Commands

Recommended one-command gate:

```powershell
npm run run:website-builder-ready-to-commit-pack
```

Equivalent split flow:

```powershell
npm run run:website-builder-step4-8-evidence-pipeline
npm run check:website-builder-ready-to-commit
```

---

## Required artifacts

Runtime checks:

- `docs/evidence/closure/*-website-builder-step4-8-runtime-checks.json`
- `docs/evidence/closure/*-website-builder-step4-8-runtime-checks.md`

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
