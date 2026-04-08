import { expect, test } from '@playwright/test';
import { loginIfNeeded, navigateReady, tenantPath } from './utils/auth';

const MAX_ROUTE_MS = Number(process.env.PERF_UI_MAX_ROUTE_MS ?? 240_000);

test.describe('Full platform performance journey', () => {
  test('User can move across core modules within latency budget', async ({ page }) => {
    if (!(await loginIfNeeded(page))) test.skip(true, 'PERF_TEST_EMAIL/PERF_TEST_PASSWORD not set.');

    const checkpoints: Array<{ label: string; path: string; maxMs: number }> = [
      { label: 'CRM', path: tenantPath('crm', 'Leads'), maxMs: MAX_ROUTE_MS },
      { label: 'Marketing', path: tenantPath('marketing', 'Creative-Studio'), maxMs: MAX_ROUTE_MS },
      { label: 'Finance', path: tenantPath('finance', 'Invoices'), maxMs: MAX_ROUTE_MS },
      { label: 'AI Studio', path: tenantPath('ai-studio', 'Cofounder'), maxMs: MAX_ROUTE_MS },
      { label: 'Projects', path: tenantPath('projects', 'Tasks'), maxMs: MAX_ROUTE_MS },
      { label: 'Inventory', path: tenantPath('inventory', 'Products'), maxMs: MAX_ROUTE_MS },
    ];

    for (const checkpoint of checkpoints) {
      const elapsed = await navigateReady(page, checkpoint.path);
      expect(
        elapsed,
        `${checkpoint.label} exceeded budget: ${elapsed}ms > ${checkpoint.maxMs}ms`
      ).toBeLessThan(checkpoint.maxMs);
    }
  });
});
