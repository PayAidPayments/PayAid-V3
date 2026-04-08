# M1 Exit Evidence Template

Use this folder to store staging/production evidence required to close the M1 exit criteria in `docs/PAYAID_V3_M0_M2_IMPLEMENTATION_CHECKLIST.md`.

## Naming convention

- Folder per run: `YYYY-MM-DD_<tenant-id>_m1-exit`
- Example: `2026-04-07_tn_demo_m1-exit`

Inside each run folder, include:

- `summary.md` (required)
- `inbound-coverage.csv` or `inbound-coverage.json`
- `sla-metrics.csv` or `sla-metrics.json`
- `sla-enforcement-audit.json`
- `next-action-acceptance.csv` or `next-action-acceptance.json`
- Optional screenshots/exports from dashboard pages

## `summary.md` template

Copy this block into each run folder as `summary.md` and fill it:

```markdown
# M1 Exit Evidence Summary

- Run date:
- Tenant ID:
- Environment: (staging/prod)
- Window: (start/end ISO)
- Collected by:

## 1) Inbound Unibox Coverage

- Provider/webhook delivery count:
- Created Unibox conversation count:
- Coverage by channel:
  - email:
  - whatsapp:
  - sms:
  - web:
  - phone:
  - in_app:
- Gap notes (if any):
- Artifact path(s):

## 2) SLA Measurability

- First-response median:
- First-response p95:
- Breach count:
- Breach rate:
- Unibox settings screenshot/export path:
- Artifact path(s):

## 3) SLA Enforceability

- Breach sample event id:
- Breach sample conversation id:
- Breached at:
- Follow-up action id:
- Non-breach control sample id:
- Artifact path(s):

## 4) Next-Action Acceptance

- Eligible recommendations:
- Accepted recommendations:
- Acceptance ratio:
- Meets >20% target? (yes/no):
- Artifact path(s):

## Exit Decision

- Inbound conversations criterion met? (yes/no):
- SLA measurable/enforceable criterion met? (yes/no):
- Next-action acceptance criterion met? (yes/no):
- Reviewer:
- Reviewed at:
```

## Checklist linkage

After each evidence run, add links (artifact paths + run date + tenant id) back into the M1 section in `docs/PAYAID_V3_M0_M2_IMPLEMENTATION_CHECKLIST.md`.

## Validation commands

- Report mode (does not fail process): `npm run validate:m1:exit-evidence`
- Per-run report (single summary): `npm run validate:m1:exit-evidence -- --summary docs/evidence/m1-exit/<run-folder>/summary.md`
- Strict mode (fails on any missing/empty required field): `npm run validate:m1:exit-evidence:strict`
- Ready gate (strict + minimum completion threshold): `npm run validate:m1:exit-evidence:ready`
- Ready gate + critical fields (strict + threshold + critical checks): `npm run validate:m1:exit-evidence:ready:critical`
- Validator also prints completion progress (`filled/required` and `%`) per summary and overall.

## Closure rubric

Before marking M1 exit criteria complete in the checklist:

- `npm run validate:m1:exit-evidence:ready:critical` passes.
- Critical values are present (`Provider/webhook delivery count`, `Created Unibox conversation count`, `First-response median`, `First-response p95`, `Acceptance ratio`, and all Exit Decision yes/no fields).
- Evidence confirms next-action acceptance is `> 20%` for the selected window.
- Reviewer and reviewed timestamp are filled in the run `summary.md`, and that file is linked in the checklist artifact table.
