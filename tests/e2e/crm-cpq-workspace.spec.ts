/**
 * CPQ workspace smoke: shell, flow stepper, history sheet.
 *
 * Run (dev server on PLAYWRIGHT_BASE_URL, e.g. http://127.0.0.1:3000):
 *   npm run test:e2e:cpq-workspace
 *
 * Env: CRM_DAY2_QA_TENANT (default `demo`), CRM_AUDIT_EMAIL / CRM_AUDIT_PASSWORD
 */
import { expect, test } from '@playwright/test'
import { gotoWithRetry, loginAsTenant } from './crm-audit/fixtures'
import { resolvePlaywrightBaseUrl } from '../playwright-base-url'

const TENANT = process.env.CRM_DAY2_QA_TENANT ?? 'demo'

test.describe('CPQ workspace', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenant(page, TENANT)
  })

  test('loads workspace or empty state; history sheet opens', async ({ page }) => {
    const origin = resolvePlaywrightBaseUrl()
    await gotoWithRetry(page, `${origin}/crm/${TENANT}/CPQ`, {
      navigationTimeout: 300_000,
      waitUntil: 'commit',
      maxAttempts: 2,
    })

    const empty = page.getByText('No quotes yet')
    const header = page.getByTestId('cpq-header')

    await expect(empty.or(header).first()).toBeVisible({ timeout: 120_000 })

    if (await empty.isVisible().catch(() => false)) {
      return
    }

    await expect(page.getByTestId('cpq-flow-stepper')).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: /history/i }).click()
    await expect(page.getByTestId('cpq-support-sheet')).toBeVisible({ timeout: 15_000 })
  })
})
