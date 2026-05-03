# SOLO-T04 Prep Discovery — Duplicate/Merge Paths

Date: 2026-04-15  
Owner: Phani  
Purpose: identify Day 4 duplicate-prevention and merge-reliability touchpoints before QA closure.

## Key code paths

- Contact create duplicate validation: `apps/dashboard/app/api/contacts/route.ts`
- Contact update duplicate validation: `apps/dashboard/app/api/contacts/[id]/route.ts`
- Merge route and guards: `apps/dashboard/app/api/contacts/merge/route.ts`
- Merge key logic: `lib/crm/contact-merge-key.ts`
- Merge guard tests: `lib/crm/__tests__/contact-merge-guard.test.ts`

## Expected error/code outcomes

- Duplicate email: `DUPLICATE_EMAIL` or structured duplicate-field code
- Duplicate phone: `DUPLICATE_PHONE` or structured duplicate-field code
- Merge same contact: `MERGE_SAME_CONTACT`
- Merge contact missing: `MERGE_CONTACT_NOT_FOUND`
- Merge no overlap: `MERGE_GUARD_NO_OVERLAP`
- Merge no primary key: `MERGE_GUARD_NO_PRIMARY_KEY`

## QA handoff

- Runbook: `docs/CRM_GA_SOLO_T04_QA_RUNBOOK.md`
- Automation evidence: `docs/evidence/closure/2026-04-20T22-15-00-000Z-crm-day4-merge-guard-tests.md`
- Queue tracker: `docs/CRM_GA_CLOSURE_EXECUTION_LOG.md` queue #5
