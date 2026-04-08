import { expect, Page } from '@playwright/test';

const TENANT = process.env.PERF_TENANT_ID ?? 'demo-business-pvt-ltd';
const EMAIL = process.env.PERF_TEST_EMAIL;
const PASSWORD = process.env.PERF_TEST_PASSWORD;
const NAV_TIMEOUT_MS = Number(process.env.PERF_NAV_TIMEOUT_MS ?? 180_000);

export async function loginIfNeeded(page: Page): Promise<boolean> {
  if (!EMAIL || !PASSWORD) {
    return false;
  }

  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard|\/home\//, { timeout: NAV_TIMEOUT_MS });
  await expect(page.locator('body')).toBeAttached();
  return true;
}

export function tenantPath(moduleName: string, pageName: string): string {
  return `/${moduleName}/${TENANT}/${pageName}`;
}

export async function navigateReady(page: Page, path: string): Promise<number> {
  const started = Date.now();
  try {
    await page.goto(path, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
  } catch {
    // Retry once for transient frame detaches observed on Windows under heavy local load.
    await page.goto(path, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
  }
  await expect(page.locator('body')).toBeAttached({ timeout: Math.min(60_000, NAV_TIMEOUT_MS) });
  return Date.now() - started;
}
