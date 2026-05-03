/**
 * Day 2 post-gating QA (signed-in) — Home, Deals, Contacts, CPQ.
 * Mirrors `docs/CRM_GA_DAY2_QA_HOME_DEALS_CONTACTS.md` at a smoke level, plus CPQ workspace (GA No-404 / core CRM).
 *
 * One browser page + one login for all surfaces (avoids repeated cold `/api/auth/login` on a slow dev server).
 *
 * Run (dev server must already be on PLAYWRIGHT_BASE_URL, e.g. 127.0.0.1:3000):
 *   npm run test:e2e:crm-day2-qa
 *
 * Env (optional): CRM_DAY2_QA_TENANT (default `demo`), CRM_AUDIT_EMAIL / CRM_AUDIT_PASSWORD
 */
import { expect, test } from '@playwright/test'
import { gotoWithRetry, loginAsTenant } from './crm-audit/fixtures'
import { resolvePlaywrightBaseUrl } from '../playwright-base-url'

const TENANT = process.env.CRM_DAY2_QA_TENANT ?? 'demo'

async function assertNoFatalOverlay(page: import('@playwright/test').Page) {
  const body = await page.locator('body').innerText().catch(() => '')
  expect(body, 'no Next fatal overlay').not.toContain('Application error: a server-side exception')
}

test.describe('Day 2 QA — Home / Deals / Contacts / CPQ (post-gating)', () => {
  test('Home, Deals, AllPeople, and CPQ load after single auth', async ({ page }) => {
    const origin = resolvePlaywrightBaseUrl()
    await loginAsTenant(page, TENANT)

    await gotoWithRetry(page, `${origin}/crm/${TENANT}/Home`, {
      navigationTimeout: 300_000,
      waitUntil: 'commit',
      maxAttempts: 2,
    })
    await assertNoFatalOverlay(page)
    await expect(page).not.toHaveURL(/\/login/i)
    await expect(
      page.getByRole('heading', { level: 1 }).or(page.locator('main')).first()
    ).toBeVisible({ timeout: 120_000 })

    await gotoWithRetry(page, `${origin}/crm/${TENANT}/Deals`, {
      navigationTimeout: 300_000,
      waitUntil: 'commit',
      maxAttempts: 2,
    })
    await assertNoFatalOverlay(page)
    await expect(page).not.toHaveURL(/\/login/i)
    await expect(page.getByText(/deal/i).or(page.locator('main')).first()).toBeVisible({
      timeout: 120_000,
    })

    await gotoWithRetry(page, `${origin}/crm/${TENANT}/AllPeople`, {
      navigationTimeout: 300_000,
      waitUntil: 'commit',
      maxAttempts: 2,
    })
    await assertNoFatalOverlay(page)
    await expect(page).not.toHaveURL(/\/login/i)
    await expect(
      page.getByText(/contact|people/i).or(page.locator('main')).first()
    ).toBeVisible({ timeout: 120_000 })

    await gotoWithRetry(page, `${origin}/crm/${TENANT}/CPQ`, {
      navigationTimeout: 300_000,
      waitUntil: 'commit',
      maxAttempts: 2,
    })
    await assertNoFatalOverlay(page)
    await expect(page).not.toHaveURL(/\/login/i)
    const cpqHeader = page.getByTestId('cpq-header')
    const cpqEmpty = page.getByText('No quotes yet')
    await expect(cpqHeader.or(cpqEmpty).first()).toBeVisible({ timeout: 120_000 })
  })
})
