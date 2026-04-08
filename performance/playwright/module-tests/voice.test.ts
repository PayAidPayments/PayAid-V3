import { expect, test } from '@playwright/test';
import { loginIfNeeded, navigateReady, tenantPath } from '../utils/auth';
import { collectWebVitals } from '../utils/metrics';

const MAX_ROUTE_MS = Number(process.env.PERF_UI_MAX_ROUTE_MS ?? 240_000);
const MAX_LCP_MS = Number(process.env.PERF_UI_MAX_LCP_MS ?? 120_000);
const MAX_INP_MS = Number(process.env.PERF_UI_MAX_INP_MS ?? 60_000);

test.describe('Voice module performance', () => {
  test('Voice Agents page render performance', async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, 'PERF_TEST_EMAIL/PERF_TEST_PASSWORD not set.');

    const loadMs = await navigateReady(page, tenantPath('crm', 'Dialer'));

    const vitals = await collectWebVitals(page);
    expect(loadMs).toBeLessThan(MAX_ROUTE_MS);
    expect(vitals.lcp).toBeLessThan(MAX_LCP_MS);
    expect(vitals.inp).toBeLessThan(MAX_INP_MS);
  });
});
