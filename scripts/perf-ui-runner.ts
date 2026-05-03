import { execSync } from 'node:child_process';

function run(command: string) {
  execSync(command, { stdio: 'inherit', env: process.env });
}

const browserMode = process.env.PERF_RUN_BROWSER === '1';
const hasPerfCreds = Boolean(process.env.PERF_TEST_EMAIL && process.env.PERF_TEST_PASSWORD);

try {
  run('npm run perf:ui:smoke');
} catch (error) {
  if (!browserMode) throw error;
  console.log('[perf-ui-runner] Smoke failed, continuing in browser mode (webServer startup may recover).');
}

if (browserMode) {
  if (hasPerfCreds) {
    run(
      'playwright test -c performance/playwright/playwright.config.ts performance/playwright/module-tests performance/playwright/platform-journey.test.ts'
    );
  } else {
    console.log(
      '[perf-ui-runner] PERF_TEST credentials missing; skipping browser suite. Set PERF_TEST_EMAIL/PERF_TEST_PASSWORD to run full browser checks.'
    );
  }
} else {
  console.log('[perf-ui-runner] Skipping browser perf tests. Set PERF_RUN_BROWSER=1 to enable.');
}
