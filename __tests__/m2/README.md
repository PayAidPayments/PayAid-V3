# M2 Smoke Tests

This folder is the dedicated M2 smoke-test surface used by:

- `npm run test:m2:smoke` (see `jest.m2.smoke.config.js`)

## How to add a new M2 route smoke test

1. Copy `m2-route-smoke-template.test.ts` to a new file like:
   - `m2-marketplace-apps-route.test.ts`
   - `m2-calls-start-route.test.ts`
   - References: `m2-marketplace-apps-route.test.ts` (`GET /api/marketplace/apps`), `m2-marketplace-install-route.test.ts` (`POST /api/marketplace/apps/install`), `m2-marketplace-reviews-route.test.ts` (`GET`/`POST /api/marketplace/apps/[id]/reviews`), `m2-developer-marketplace-apps-route.test.ts` (`GET`/`POST /api/developer/marketplace/apps`), `m2-calls-route.test.ts` (`GET`/`POST /api/calls`), `m2-call-detail-route.test.ts` (`GET /api/calls/[id]`), `m2-calls-webhook-route.test.ts` (`POST /api/calls/webhook`), `m2-calls-faqs-route.test.ts` (`GET`/`POST /api/calls/faqs`), `m2-crm-calls-recordings-route.test.ts` (`POST /api/crm/calls/recordings`), `m2-voice-ping-route.test.ts` (`POST /api/voice/ping`), `m2-voice-demo-route.test.ts` (`POST /api/voice/demo`), `m2-voice-agents-route.test.ts` (`GET /api/v1/voice-agents`), `m2-quotes-route.test.ts` (`GET`/`POST /api/quotes`), `m2-quotes-approval-workflow-route.test.ts` (`POST /api/quotes/[id]/approval-workflow`), `m2-crm-cpq-quotes-route.test.ts` (`GET`/`POST /api/crm/cpq/quotes`), `m2-crm-cpq-quote-detail-route.test.ts` (`GET /api/crm/cpq/quotes/[id]`), `m2-outbox-health-route.test.ts` (`GET /api/v1/outbox/health`), `m2-outbox-metrics-route.test.ts` (`GET /api/v1/outbox/metrics`), `m2-revenue-funnel-route.test.ts` (`GET /api/v1/revenue/funnel`), `m2-conversations-settings-route.test.ts` (`GET /api/v1/conversations/settings`), `m2-audit-actions-route.test.ts` (`GET /api/v1/audit/actions`), `m2-signals-route.test.ts` (`GET /api/v1/signals`), `m2-signals-ingest-route.test.ts` (negative path for `POST /api/v1/signals/ingest`), `m2-workflows-route.test.ts` (`GET /api/v1/workflows`), `m2-workflows-publish-route.test.ts` (`POST /api/v1/workflows/[id]/publish`), `m2-workflows-test-run-route.test.ts` (`POST /api/v1/workflows/[id]/test-run`), `m2-sequences-route.test.ts` (`POST /api/v1/sequences`), `m2-sequences-pause-route.test.ts` (`POST /api/v1/sequences/[id]/pause`), `m2-sequences-enroll-route.test.ts` (`POST /api/v1/sequences/[id]/enroll`), `m2-sequences-enrollment-reply-route.test.ts` (`PATCH /api/v1/sequences/[id]/enrollments/[enrollmentId]/reply`), `m2-kpi-scorecard-route.test.ts` (`GET /api/v1/kpi/scorecard`)
2. Replace:
   - the imported route handler (`GET`/`POST` from the relevant `apps/dashboard/app/api/.../route.ts`)
   - the mocked module service (e.g. `@/lib/...`) your handler calls
3. Keep the test lightweight:
   - assert status code and 1–3 key response fields
   - include at least one negative case if the route has a hard requirement (e.g. missing idempotency key)

## Notes

- We follow the same mocking pattern as `__tests__/m0` route tests (auth + feature flags + permissions mocked).
- Add real M2 route tests as M2 endpoints are implemented; keep placeholder tests minimal.

