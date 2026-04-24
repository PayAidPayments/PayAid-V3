# Website Builder Ready-to-Commit Checklist

Use this checklist before creating a commit/PR for Website Builder Step 4.8 work.

Optional fast preflight command:

- `npm run check:website-builder-ready-to-commit`

One-command pack (runtime evidence + preflight):

- `npm run run:website-builder-ready-to-commit-pack`

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
- R