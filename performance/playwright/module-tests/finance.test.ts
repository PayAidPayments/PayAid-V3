import { expect, test } from '@playwright/test';
import { loginIfNeeded, navigateReady, tenantPath } from '../utils/auth';
import { collectWebVitals } from '../utils/metrics';

const MAX_ROUTE_MS = Number(process.env.PERF_UI_MAX_ROUTE_MS ?? 240_000);
const MAX_LCP_MS = Number(process.env.PERF_UI_MAX_LCP_MS ?? 120_000);
const MAX_CLS = Number(process.env.PERF_UI_MAX_CLS ?? 1);

test.describe('Finance module performance', () => {
  test('Invoices page renders within budget', async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, 'PERF_TEST_EMAIL/PERF_TEST_PASSWORD not set.');

    const loadMs = await navigateReady(page, tenantPath('finance', 'Invoices'));

    const vitals = await collectWebVitals(page);
    expect(loadMs).toBeLessThan(MAX_ROUTE_MS);
    expect(vitals.lcp).toBeLessThan(MAX_LCP_MS);
    expect(vitals.cls).toBeLessThan(MAX_CLS);
  });
});
