import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['**/*.test.ts'],
  globalSetup: './global-setup.ts',
  outputDir: '../reports/test-results',
  timeout: 120_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers:
    process.env.PLAYWRIGHT_WORKERS !== undefined
      ? Math.max(1, parseInt(process.env.PLAYWRIGHT_WORKERS, 10) || 1)
      : process.env.CI
        ? 1
        : 1,
  reporter: [
    ['html', { outputFolder: '../reports/playwright-html', open: 'never' }],
    ['json', { outputFile: '../reports/playwright-report.json' }],
  ],
  use: {
    baseURL: process.env.PERF_BASE_URL ?? 'http://127.0.0.1:3000',
    storageState:
      process.env.PERF_SKIP_AUTH_SETUP === '1' ||
      !process.env.PERF_TEST_EMAIL ||
      !process.env.PERF_TEST_PASSWORD
        ? undefined
        : './performance/playwright/.auth/perf-user.json',
    trace: 'off',
    headless: true,
    screenshot: 'only-on-failure',
    navigationTimeout: 60_000,
    launchOptions: {
      timeout: 60_000,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Auto-start local app for perf runs unless explicitly disabled.
  webServer: process.env.CI
    ? undefined
    : process.env.PLAYWRIGHT_NO_WEB_SERVER === '1'
      ? undefined
      : {
          command: 'npm run dev',
          url: process.env.PERF_BASE_URL ?? 'http://127.0.0.1:3000',
          reuseExistingServer: true,
          timeout: 300_000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
});
