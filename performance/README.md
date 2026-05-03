# PayAid V3 Performance Suite

This folder contains coordinated performance tests across UI and APIs.

## Test Layers

- UI performance: `performance/playwright`
- API load testing: `performance/k6`
- Reports output: `performance/reports`

## Environment Variables

- `PERF_BASE_URL` (default: `http://127.0.0.1:3000`)
- `PERF_TENANT_ID` (default: `demo-business-pvt-ltd`)
- `PERF_TEST_EMAIL` and `PERF_TEST_PASSWORD` (required for authenticated Playwright tests)
- `PERF_API_TOKEN` (optional bearer token for k6 scripts)

## Run Commands

- `npm run perf:ui` - run smoke by default; set `PERF_RUN_BROWSER=1` for browser checks
- `npm run perf:ui:smoke` - quick Node-based health/speed smoke (no Playwright/browser)
- `npm run perf:ui:modules` - run module-focused Playwright tests
- `npm run perf:ui:journey` - run full platform journey test
- `npm run perf:api` - run CRM/Marketing/Finance/Voice k6 tests
- `npm run perf:api:platform` - run combined platform k6 test
- `npm run perf:full` - run UI + API suites together

## Notes

- k6 must be installed locally to run `perf:api*` scripts.
- Thresholds are encoded in test assertions and k6 checks; tune them based on your production baselines.
- Playwright perf tests auto-start the app via `npm run dev` unless `PLAYWRIGHT_NO_WEB_SERVER=1` is set.
- Playwright global setup now performs fast preflight checks (`/` and `/login`) and logs in once to reuse auth state.
- Smoke check validates `/login` and `/api/payaid-internal/ping` (not `/`) to avoid protected-route/auth delays.
- In browser mode, full module/journey specs run only when `PERF_TEST_EMAIL` and `PERF_TEST_PASSWORD` are set; otherwise browser suite is skipped after smoke.
