import { expect, test } from '@playwright/test';
import { loginIfNeeded, navigateReady, tenantPath } from '../utils/auth';
import { collectWebVitals, resourceDurationByUrlPart } from '../utils/metrics';

const MAX_ROUTE_MS = Number(process.env.PERF_UI_MAX_ROUTE_MS ?? 240_000);
const MAX_LCP_MS = Number(process.env.PERF_UI_MAX_LCP_MS ?? 120_000);
const MAX_INP_MS = Number(process.env.PERF_UI_MAX_INP_MS ?? 60_000);
const MAX_AI_TEXT_MS = Number(process.env.PERF_UI_MAX_AI_TEXT_MS ?? 120_000);

test.describe('Marketing module performance', () => {
  test('Creative Studio page and AI text API stay responsive', async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, 'PERF_TEST_EMAIL/PERF_TEST_PASSWORD not set.');

    const loadMs = await navigateReady(page, tenantPath('marketing', 'Creative-Studio'));

    const vitals = await collectWebVitals(page);
    const aiTextMs = await resourceDurationByUrlPart(page, '/api/ai/text/generate');

    expect(loadMs).toBeLessThan(MAX_ROUTE_MS);
    expect(vitals.lcp).toBeLessThan(MAX_LCP_MS);
    expect(vitals.inp).toBeLessThan(MAX_INP_MS);
    if (aiTextMs !== null) {
      expect(aiTextMs).toBeLessThan(MAX_AI_TEXT_MS);
    }
  });
});
