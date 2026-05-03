import { chromium, type FullConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const EMAIL = process.env.PERF_TEST_EMAIL;
const PASSWORD = process.env.PERF_TEST_PASSWORD;

async function fetchOrThrow(url: string, timeoutMs: number): Promise<void> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal, redirect: 'follow' });
    if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
  } finally {
    clearTimeout(timer);
  }
}

async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL as string | undefined;
  const base = (baseURL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');

  // Playwright runs globalSetup before webServer startup.
  // Only preflight when server is expected to already be running.
  const playwrightWillStartWebServer =
    !process.env.CI && process.env.PLAYWRIGHT_NO_WEB_SERVER !== '1';
  if (!playwrightWillStartWebServer) {
    await fetchOrThrow(`${base}/`, 90_000);
    await fetchOrThrow(`${base}/login`, 90_000);
  }

  if (process.env.PERF_SKIP_AUTH_SETUP === '1') {
    return;
  }

  if (!EMAIL || !PASSWORD) {
    console.log('[perf-global-setup] PERF_TEST_EMAIL/PERF_TEST_PASSWORD not set; continuing without auth state.');
    return;
  }

  const browser = await chromium.launch({ headless: true, timeout: 120_000 });
  const context = await browser.newContext({ baseURL: base });
  const page = await context.newPage();

  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard|\/home\//, { timeout: 120_000 });

  const tenant = process.env.PERF_TENANT_ID ?? 'demo-business-pvt-ltd';
  const warmupRoutes = [
    `/crm/${tenant}/Home`,
    `/marketing/${tenant}/Creative-Studio`,
    `/finance/${tenant}/Invoices`,
  ];
  for (const route of warmupRoutes) {
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 120_000 }).catch(() => {});
  }

  const authDir = path.resolve(__dirname, '.auth');
  fs.mkdirSync(authDir, { recursive: true });
  await context.storageState({ path: path.join(authDir, 'perf-user.json') });
  await browser.close();
}

export default globalSetup;
