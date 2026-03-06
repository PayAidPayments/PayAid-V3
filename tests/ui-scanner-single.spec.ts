/**
 * Single-route smoke test with 5 min timeout. Use to verify the correct spec runs.
 * If the full ui-scanner fails with timeouts or "Broken links" with status -1, run: npm run test:e2e:ui-scanner
 */
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
const EXTENDED_GOTO_TIMEOUT_MS = 300_000;
const route = '/finance/cmjptk2mw0000aocw31u48n64/Invoices';

test('[LINKS] single route with 5min timeout', async ({ page }) => {
  test.setTimeout(EXTENDED_GOTO_TIMEOUT_MS + 60_000);
  page.setDefaultNavigationTimeout(EXTENDED_GOTO_TIMEOUT_MS);
  const url = new URL(route, baseURL).toString();
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: EXTENDED_GOTO_TIMEOUT_MS });
  expect(response?.status(), `Page ${route} should load`).toBeLessThan(400);
});
