/**
 * CRM Feature Audit only — single browser project (avoids 5× duplicate runs from the root config).
 *
 * Run: npm run test:e2e:crm-audit
 * Or:  cross-env PLAYWRIGHT_NO_WEB_SERVER=1 CRM_AUDIT_SKIP_PREFLIGHT=1 playwright test -c playwright.crm-audit.config.ts
 */
import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e/crm-audit',
  testMatch: /.*\.spec\.(ts|js)/,
  globalSetup: './tests/global-setup-ui-scanner.ts',
  timeout: 300_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter:
    process.env.CI
      ? [['github'], ['html', { open: 'never' }]]
      : [['list'], ['html', { open: 'on-failure' }], ['json', { outputFile: 'e2e-crm-audit-results.json' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 300_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.CI
    ? undefined
    : process.env.PLAYWRIGHT_NO_WEB_SERVER
      ? undefined
      : {
          command: 'npm run dev',
          url: `${baseURL}/api/payaid-internal/ping`,
          reuseExistingServer: true,
          timeout: 900_000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
})
