import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.(ts|js)/,
  // No ui-scanner.spec.ts in repo; global setup deletes it if present. Scanner = ui-scanner-run.spec.ts only.
  testIgnore: ['**/ui-scanner.spec.ts'],
  globalSetup: './tests/global-setup-ui-scanner.ts',
  timeout: 300_000, // 5 min default; route-health and ui-scanner set per-test where needed
  fullyParallel: true,
  retries: 1,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 2 : undefined,
  reporter:
    process.env.CI
      ? [['github'], ['html', { open: 'never' }]]
      : [['list'], ['html', { open: 'on-failure' }], ['json', { outputFile: 'e2e-results.json' }]],
  use: {
    // Prefer 127.0.0.1 over localhost to avoid IPv6/hosts flakiness on Windows.
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Next.js dev cold-compiles tenant routes; 5 min avoids flaky goto timeouts in ui-scanner/route-health.
    navigationTimeout: 300_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Phase 8: CTO demo flows – run with --project crm (or use baseURL in spec).
    { name: 'crm', use: { ...devices['Desktop Chrome'], baseURL } },
    { name: 'hr', use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3002' } },
    { name: 'voice', use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3003' } },
    { name: 'dashboard', use: { ...devices['Desktop Chrome'], baseURL } },
  ],
  // Start dev server automatically for local E2E runs.
  // Opt out with PLAYWRIGHT_NO_WEB_SERVER=1 if you prefer starting it manually.
  webServer: process.env.CI
    ? undefined
    : process.env.PLAYWRIGHT_NO_WEB_SERVER
      ? undefined
      : {
          command: 'npm run dev',
          // Lightweight health endpoint avoids heavy first-route compile during readiness checks.
          url: `${baseURL}/api/payaid-internal/ping`,
          reuseExistingServer: true,
          timeout: 900_000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
});
