import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.(ts|js)/,
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
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // No auto-start by default: run "npm run dev" first, then "npm run test:e2e" so you see output immediately.
  // Set PLAYWRIGHT_START_DEV=1 to let Playwright start the dev server (may show nothing for 1–2 min while it boots).
  webServer: process.env.CI
    ? undefined
    : process.env.PLAYWRIGHT_START_DEV
      ? {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: true,
          timeout: 120_000,
          stdout: 'pipe',
          stderr: 'pipe',
        }
      : undefined,
});
